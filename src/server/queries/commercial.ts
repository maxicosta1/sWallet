import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export type CommercialData = Awaited<ReturnType<typeof getCommercialData>>;
export type CommercialAlert = {
  id: string;
  type: "invoice" | "client" | "project" | "task" | "opportunity" | "subscription" | "support";
  severity: "alta" | "media" | "baja";
  title: string;
  detail: string;
  href?: string;
  date?: Date | null;
};

const dayMs = 24 * 60 * 60 * 1000;

export async function getCommercialData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const nextWeek = addDays(now, 7);
  const nextMonth = addDays(now, 30);
  const staleContactLimit = addDays(now, -15);

  const [
    clients,
    projects,
    teamMembers,
    opportunities,
    campaigns,
    calendarEvents,
    invoices,
    tasks,
    subscriptions,
    supportPlans
  ] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      include: { opportunities: { where: { deletedAt: null }, select: { id: true } } },
      orderBy: [{ company: "asc" }, { name: "asc" }]
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.teamMember.findMany({
      where: { deletedAt: null },
      orderBy: [{ status: "asc" }, { name: "asc" }]
    }),
    prisma.opportunity.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        campaign: true,
        responsibleTeamMember: true
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.marketingCampaign.findMany({
      where: { deletedAt: null },
      include: { opportunities: { where: { deletedAt: null } } },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.calendarEvent.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }]
    }),
    prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true, payments: { where: { deletedAt: null } } },
      orderBy: [{ dueDate: "asc" }]
    }),
    prisma.adminTask.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true, responsibleTeamMember: true },
      orderBy: [{ dueDate: "asc" }]
    }),
    prisma.subscription.findMany({
      where: { deletedAt: null },
      orderBy: [{ renewsAt: "asc" }]
    }),
    prisma.supportPlan.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true },
      orderBy: [{ domainRenewal: "asc" }, { hostingRenewal: "asc" }]
    })
  ]);

  const normalizedOpportunities = opportunities.map((opportunity) => ({
    id: opportunity.id,
    title: opportunity.title,
    service: opportunity.service,
    clientId: opportunity.clientId,
    clientName: opportunity.client?.company ?? "Prospecto sin cliente",
    campaignName: opportunity.campaign?.name ?? null,
    responsibleName: opportunity.responsibleTeamMember
      ? [opportunity.responsibleTeamMember.name, opportunity.responsibleTeamMember.lastName].filter(Boolean).join(" ")
      : opportunity.responsible || "Sin responsable",
    value: decimalToNumber(opportunity.value),
    currency: opportunity.currency,
    probability: opportunity.probability,
    status: opportunity.status,
    nextAction: opportunity.nextAction,
    notes: opportunity.notes,
    updatedAt: opportunity.updatedAt,
    createdAt: opportunity.createdAt
  }));

  const normalizedCampaigns = campaigns.map((campaign) => {
    const estimatedPipeline = campaign.opportunities
      .filter((opportunity) => opportunity.status !== "perdido")
      .reduce((sum, opportunity) => sum + decimalToNumber(opportunity.value) * (opportunity.probability / 100), 0);
    const wonValue = campaign.opportunities
      .filter((opportunity) => opportunity.status === "ganado")
      .reduce((sum, opportunity) => sum + decimalToNumber(opportunity.value), 0);

    return {
      id: campaign.id,
      name: campaign.name,
      target: campaign.target,
      message: campaign.message,
      contacts: campaign.contacts,
      responses: campaign.responses,
      meetings: campaign.meetings,
      sales: campaign.sales,
      status: campaign.status,
      date: campaign.date,
      opportunityCount: campaign.opportunities.length,
      responseRate: percentage(campaign.responses, campaign.contacts),
      meetingRate: percentage(campaign.meetings, campaign.responses),
      closingRate: percentage(campaign.sales, campaign.meetings),
      estimatedPipeline,
      wonValue
    };
  });

  const alerts = buildAlerts({
    now,
    todayStart,
    nextWeek,
    nextMonth,
    staleContactLimit,
    clients,
    projects,
    invoices,
    tasks,
    opportunities: normalizedOpportunities,
    subscriptions,
    supportPlans
  });

  const agendaItems = [
    ...calendarEvents.map((event) => ({
      id: event.id,
      source: "calendar",
      type: event.type,
      title: event.title,
      date: event.date,
      priority: event.priority,
      status: event.status,
      detail: [event.client?.company, event.project?.name].filter(Boolean).join(" - ") || event.description || "Evento manual",
      href: null as string | null
    })),
    ...invoices
      .filter((invoice) => invoice.status !== "pagada" && invoice.status !== "cancelada")
      .map((invoice) => ({
        id: `invoice-${invoice.id}`,
        source: "invoice",
        type: "vencimiento_factura",
        title: `Vence factura ${invoice.number}`,
        date: invoice.dueDate,
        priority: invoice.dueDate < todayStart ? "urgente" : "alta",
        status: invoice.status,
        detail: invoice.client.company,
        href: `/billing/${invoice.id}`
      })),
    ...projects
      .filter((project) => project.dueAt && project.progress < 100 && project.status !== "finalizado")
      .map((project) => ({
        id: `project-${project.id}`,
        source: "project",
        type: "entrega_proyecto",
        title: `Entrega ${project.name}`,
        date: project.dueAt!,
        priority: project.dueAt! < todayStart ? "urgente" : "alta",
        status: project.status,
        detail: project.client.company,
        href: `/projects/${project.id}`
      })),
    ...tasks
      .filter((task) => task.dueDate && task.status !== "completada" && task.status !== "cancelada")
      .map((task) => ({
        id: `task-${task.id}`,
        source: "task",
        type: "deadline_tarea",
        title: task.title,
        date: task.dueDate!,
        priority: task.priority,
        status: task.status,
        detail: task.project?.name ?? task.client?.company ?? "Tarea interna",
        href: task.projectId ? `/projects/${task.projectId}` : "/tasks"
      })),
    ...subscriptions
      .filter((subscription) => subscription.renewsAt <= nextMonth && subscription.status !== "cancelada")
      .map((subscription) => ({
        id: `subscription-${subscription.id}`,
        source: "subscription",
        type: "renovacion",
        title: `Renovacion ${subscription.name}`,
        date: subscription.renewsAt,
        priority: subscription.renewsAt < todayStart ? "urgente" : "media",
        status: subscription.status,
        detail: subscription.provider,
        href: "/subscriptions"
      }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    clients: clients.map((client) => ({ id: client.id, label: `${client.company} - ${client.name}` })),
    projects: projects.map((project) => ({ id: project.id, label: `${project.name} - ${project.client.company}` })),
    teamMembers: teamMembers.map((member) => ({
      id: member.id,
      label: [member.name, member.lastName].filter(Boolean).join(" ") || member.email
    })),
    campaigns: normalizedCampaigns,
    campaignOptions: normalizedCampaigns.map((campaign) => ({ id: campaign.id, label: campaign.name })),
    opportunities: normalizedOpportunities,
    agendaItems,
    calendarEvents: calendarEvents.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      status: event.status,
      priority: event.priority,
      clientName: event.client?.company ?? null,
      projectName: event.project?.name ?? null,
      description: event.description
    })),
    alerts
  };
}

function buildAlerts({
  now,
  todayStart,
  nextWeek,
  nextMonth,
  staleContactLimit,
  clients,
  projects,
  invoices,
  tasks,
  opportunities,
  subscriptions,
  supportPlans
}: {
  now: Date;
  todayStart: Date;
  nextWeek: Date;
  nextMonth: Date;
  staleContactLimit: Date;
  clients: Array<{ id: string; company: string; lastContact: Date | null; status: string }>;
  projects: Array<{ id: string; name: string; dueAt: Date | null; progress: number; status: string; risk: string; client: { company: string } }>;
  invoices: Array<{ id: string; number: string; dueDate: Date; status: string; balanceDue: unknown; total: unknown; amount: unknown; client: { company: string } }>;
  tasks: Array<{ id: string; title: string; dueDate: Date | null; status: string; priority: string; projectId: string | null; project: { name: string } | null }>;
  opportunities: Array<{ id: string; title: string; status: string; nextAction: string | null; updatedAt: Date; probability: number; value: number; currency: string }>;
  subscriptions: Array<{ id: string; name: string; renewsAt: Date; status: string; provider: string }>;
  supportPlans: Array<{ id: string; domain: string; hosting: string; domainRenewal: Date | null; hostingRenewal: Date | null; status: string; client: { company: string } | null }>;
}) {
  const alerts: CommercialAlert[] = [];

  invoices.forEach((invoice) => {
    const balanceDue = decimalToNumber(invoice.balanceDue) || decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
    if (invoice.status !== "pagada" && invoice.status !== "cancelada" && invoice.dueDate < todayStart && balanceDue > 0) {
      alerts.push({
        id: `invoice-overdue-${invoice.id}`,
        type: "invoice",
        severity: "alta",
        title: `Factura vencida ${invoice.number}`,
        detail: `${invoice.client.company} tiene saldo pendiente.`,
        href: `/billing/${invoice.id}`,
        date: invoice.dueDate
      });
    }
  });

  clients
    .filter((client) => client.status !== "finalizado" && (!client.lastContact || client.lastContact < staleContactLimit))
    .forEach((client) => {
      alerts.push({
        id: `client-stale-${client.id}`,
        type: "client",
        severity: "media",
        title: `Seguimiento pendiente: ${client.company}`,
        detail: client.lastContact ? "Sin contacto hace mas de 15 dias." : "Sin ultimo contacto registrado.",
        href: `/clients/${client.id}`,
        date: client.lastContact
      });
    });

  projects
    .filter((project) => project.status !== "finalizado" && project.status !== "entregado")
    .forEach((project) => {
      if (project.risk !== "normal") {
        alerts.push({
          id: `project-risk-${project.id}`,
          type: "project",
          severity: project.risk.includes("bloqueado") || project.risk === "atrasado" ? "alta" : "media",
          title: `Proyecto con riesgo: ${project.name}`,
          detail: `${project.client.company} - ${project.risk.replaceAll("_", " ")}.`,
          href: `/projects/${project.id}`,
          date: project.dueAt
        });
      } else if (project.dueAt && project.dueAt <= nextWeek && project.progress < 80) {
        alerts.push({
          id: `project-soon-${project.id}`,
          type: "project",
          severity: "media",
          title: `Entrega cercana: ${project.name}`,
          detail: `${project.progress}% de avance con vencimiento proximo.`,
          href: `/projects/${project.id}`,
          date: project.dueAt
        });
      }
    });

  tasks
    .filter((task) => task.status !== "completada" && task.status !== "cancelada")
    .forEach((task) => {
      if (task.dueDate && task.dueDate < todayStart) {
        alerts.push({
          id: `task-overdue-${task.id}`,
          type: "task",
          severity: "alta",
          title: `Tarea vencida: ${task.title}`,
          detail: task.project?.name ?? "Tarea sin proyecto asociado.",
          href: task.projectId ? `/projects/${task.projectId}` : "/tasks",
          date: task.dueDate
        });
      } else if (task.priority === "urgente") {
        alerts.push({
          id: `task-urgent-${task.id}`,
          type: "task",
          severity: "media",
          title: `Tarea urgente: ${task.title}`,
          detail: task.project?.name ?? "Tarea sin proyecto asociado.",
          href: task.projectId ? `/projects/${task.projectId}` : "/tasks",
          date: task.dueDate
        });
      }
    });

  opportunities
    .filter((opportunity) => opportunity.status !== "ganado" && opportunity.status !== "perdido" && opportunity.updatedAt < addDays(now, -7))
    .forEach((opportunity) => {
      alerts.push({
        id: `opportunity-stale-${opportunity.id}`,
        type: "opportunity",
        severity: "baja",
        title: `Oportunidad sin movimiento: ${opportunity.title}`,
        detail: opportunity.nextAction || "Definir proxima accion comercial.",
        href: "/crm",
        date: opportunity.updatedAt
      });
    });

  subscriptions
    .filter((subscription) => subscription.status !== "cancelada" && subscription.renewsAt <= nextMonth)
    .forEach((subscription) => {
      alerts.push({
        id: `subscription-renewal-${subscription.id}`,
        type: "subscription",
        severity: subscription.renewsAt < todayStart ? "alta" : "media",
        title: `Renovacion: ${subscription.name}`,
        detail: `${subscription.provider} requiere revision.`,
        href: "/subscriptions",
        date: subscription.renewsAt
      });
    });

  supportPlans
    .filter((plan) => plan.status !== "cancelado")
    .forEach((plan) => {
      if (plan.domainRenewal && plan.domainRenewal <= nextMonth) {
        alerts.push({
          id: `domain-renewal-${plan.id}`,
          type: "support",
          severity: plan.domainRenewal < todayStart ? "alta" : "media",
          title: `Dominio por renovar: ${plan.domain}`,
          detail: plan.client?.company ?? "Sin cliente asociado.",
          href: "/support",
          date: plan.domainRenewal
        });
      }
      if (plan.hostingRenewal && plan.hostingRenewal <= nextMonth) {
        alerts.push({
          id: `hosting-renewal-${plan.id}`,
          type: "support",
          severity: plan.hostingRenewal < todayStart ? "alta" : "media",
          title: `Hosting por renovar: ${plan.hosting}`,
          detail: plan.client?.company ?? "Sin cliente asociado.",
          href: "/support",
          date: plan.hostingRenewal
        });
      }
    });

  return alerts.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function severityRank(severity: CommercialAlert["severity"]) {
  return severity === "alta" ? 3 : severity === "media" ? 2 : 1;
}
