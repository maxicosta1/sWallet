import { prisma } from "@/lib/prisma";
import { convertToARS } from "@/lib/finance";
import { decimalToNumber } from "@/lib/format";
import { getActiveExchangeRate } from "@/server/queries/dashboard";

export type AdvancedReportsData = Awaited<ReturnType<typeof getAdvancedReportsData>>;

export async function getAdvancedReportsData(query = "") {
  const q = query.trim();
  const exchangeRate = await getActiveExchangeRate();

  const [
    clients,
    projects,
    invoices,
    payments,
    movements,
    budgets,
    tasks,
    documents,
    teamMembers,
    timeEntries,
    opportunities,
    campaigns
  ] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      include: {
        projects: { where: { deletedAt: null } },
        invoices: { where: { deletedAt: null }, include: { payments: { where: { deletedAt: null } } } },
        payments: { where: { deletedAt: null } }
      }
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        invoices: { where: { deletedAt: null }, include: { payments: { where: { deletedAt: null } } } },
        payments: { where: { deletedAt: null } },
        movements: { where: { deletedAt: null } },
        timeEntries: { where: { deletedAt: null } }
      }
    }),
    prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true, payments: { where: { deletedAt: null } } },
      orderBy: [{ dueDate: "asc" }]
    }),
    prisma.payment.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true, invoice: true, movement: true },
      orderBy: [{ dueDate: "asc" }]
    }),
    prisma.movement.findMany({
      where: { deletedAt: null },
      include: { category: true, client: true, project: true },
      orderBy: [{ date: "desc" }]
    }),
    prisma.budget.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true },
      orderBy: [{ validUntil: "asc" }]
    }),
    prisma.adminTask.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true, responsibleTeamMember: true },
      orderBy: [{ dueDate: "asc" }]
    }),
    prisma.document.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.teamMember.findMany({
      where: { deletedAt: null },
      include: {
        assignedTasks: { where: { deletedAt: null } },
        timeEntries: { where: { deletedAt: null } }
      },
      orderBy: [{ name: "asc" }]
    }),
    prisma.timeEntry.findMany({
      where: { deletedAt: null },
      include: { teamMember: true, project: { include: { client: true } }, task: true },
      orderBy: [{ date: "desc" }]
    }),
    prisma.opportunity.findMany({
      where: { deletedAt: null },
      include: { client: true, campaign: true, responsibleTeamMember: true },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.marketingCampaign.findMany({
      where: { deletedAt: null },
      include: { opportunities: { where: { deletedAt: null } } },
      orderBy: [{ date: "desc" }]
    })
  ]);

  const invoiceRows = invoices.map((invoice) => {
    const total = decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
    const paid = invoice.payments.reduce((sum, payment) => sum + decimalToNumber(payment.paidAmount || payment.amount), 0);
    const balanceDue = Math.max(decimalToNumber(invoice.balanceDue) || total - paid, 0);
    return {
      id: invoice.id,
      number: invoice.number,
      clientName: invoice.client.company,
      projectName: invoice.project?.name ?? null,
      total,
      paid,
      balanceDue,
      totalARS: convertToARS(total, invoice.currency, exchangeRate),
      balanceARS: convertToARS(balanceDue, invoice.currency, exchangeRate),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      status: balanceDue <= 0 ? "pagada" : invoice.dueDate < new Date() && invoice.status !== "cancelada" ? "vencida" : invoice.status
    };
  });

  const cashMovements = movements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    category: movement.category.name,
    clientName: movement.client?.company ?? null,
    projectName: movement.project?.name ?? null,
    description: movement.description,
    amount: decimalToNumber(movement.amount),
    amountARS: convertToARS(decimalToNumber(movement.amount), movement.currency, exchangeRate),
    currency: movement.currency,
    date: movement.date
  }));

  const projectProfitability = projects.map((project) => {
    const invoiceTotal = project.invoices.reduce((sum, invoice) => sum + convertToARS(decimalToNumber(invoice.total) || decimalToNumber(invoice.amount), invoice.currency, exchangeRate), 0);
    const paidTotal = project.payments.reduce((sum, payment) => sum + convertToARS(decimalToNumber(payment.paidAmount || payment.amount), payment.currency, exchangeRate), 0);
    const movementIncome = project.movements.filter((movement) => movement.type === "ingreso").reduce((sum, movement) => sum + convertToARS(decimalToNumber(movement.amount), movement.currency, exchangeRate), 0);
    const movementExpense = project.movements.filter((movement) => movement.type !== "ingreso").reduce((sum, movement) => sum + convertToARS(decimalToNumber(movement.amount), movement.currency, exchangeRate), 0);
    const hours = project.timeEntries.reduce((sum, entry) => sum + decimalToNumber(entry.hours), 0);
    const collected = movementIncome || paidTotal;
    const profit = collected - movementExpense;
    return {
      id: project.id,
      name: project.name,
      clientName: project.client.company,
      status: project.status,
      progress: project.progress,
      budgetARS: convertToARS(decimalToNumber(project.budget), project.currency, exchangeRate),
      invoicedARS: invoiceTotal,
      collectedARS: collected,
      expensesARS: movementExpense,
      profitARS: profit,
      profitability: collected ? Math.round((profit / collected) * 100) : 0,
      hours,
      realHourlyValue: hours ? profit / hours : 0
    };
  }).sort((a, b) => b.profitARS - a.profitARS);

  const clientProfitability = clients.map((client) => {
    const invoicedARS = client.invoices.reduce((sum, invoice) => sum + convertToARS(decimalToNumber(invoice.total) || decimalToNumber(invoice.amount), invoice.currency, exchangeRate), 0);
    const paidARS = client.payments
      .filter((payment) => payment.status === "pagado")
      .reduce((sum, payment) => sum + convertToARS(decimalToNumber(payment.paidAmount || payment.amount), payment.currency, exchangeRate), 0);
    const debtARS = client.invoices.reduce((sum, invoice) => {
      const total = decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
      const paid = invoice.payments.reduce((paymentSum, payment) => paymentSum + decimalToNumber(payment.paidAmount || payment.amount), 0);
      return sum + convertToARS(Math.max(decimalToNumber(invoice.balanceDue) || total - paid, 0), invoice.currency, exchangeRate);
    }, 0);
    return {
      id: client.id,
      name: client.company,
      status: client.status,
      projects: client.projects.length,
      invoicedARS,
      paidARS,
      debtARS,
      valueARS: paidARS - debtARS
    };
  }).sort((a, b) => b.valueARS - a.valueARS);

  const teamPerformance = teamMembers.map((member) => {
    const hours = member.timeEntries.reduce((sum, entry) => sum + decimalToNumber(entry.hours), 0);
    const completed = member.assignedTasks.filter((task) => task.status === "completada").length;
    const pending = member.assignedTasks.filter((task) => task.status !== "completada" && task.status !== "cancelada").length;
    return {
      id: member.id,
      name: [member.name, member.lastName].filter(Boolean).join(" ") || member.email,
      role: member.role,
      status: member.status,
      hours,
      completed,
      pending,
      totalTasks: member.assignedTasks.length,
      completionRate: member.assignedTasks.length ? Math.round((completed / member.assignedTasks.length) * 100) : 0
    };
  }).sort((a, b) => b.hours - a.hours);

  const campaignReports = campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    target: campaign.target,
    contacts: campaign.contacts,
    responses: campaign.responses,
    meetings: campaign.meetings,
    sales: campaign.sales,
    status: campaign.status,
    responseRate: percentage(campaign.responses, campaign.contacts),
    meetingRate: percentage(campaign.meetings, campaign.responses),
    closingRate: percentage(campaign.sales, campaign.meetings),
    pipelineARS: campaign.opportunities.reduce((sum, opportunity) => sum + convertToARS(decimalToNumber(opportunity.value), opportunity.currency, exchangeRate), 0)
  }));

  return {
    exchangeRate,
    metrics: {
      cashIncomeARS: cashMovements.filter((movement) => movement.type === "ingreso").reduce((sum, movement) => sum + movement.amountARS, 0),
      cashExpensesARS: cashMovements.filter((movement) => movement.type !== "ingreso").reduce((sum, movement) => sum + movement.amountARS, 0),
      debtARS: invoiceRows.reduce((sum, invoice) => sum + invoice.balanceARS, 0),
      overdueInvoices: invoiceRows.filter((invoice) => invoice.status === "vencida").length,
      activeProjects: projects.filter((project) => project.status !== "finalizado" && project.status !== "entregado").length,
      openPipelineARS: opportunities
        .filter((opportunity) => opportunity.status !== "ganado" && opportunity.status !== "perdido")
        .reduce((sum, opportunity) => sum + convertToARS(decimalToNumber(opportunity.value) * (opportunity.probability / 100), opportunity.currency, exchangeRate), 0)
    },
    charts: {
      monthly: buildMonthlyCashSeries(cashMovements),
      services: buildServiceSales(clients),
      profitableClients: clientProfitability.slice(0, 8).map((client) => ({ name: client.name, value: client.valueARS }))
    },
    invoiceRows,
    cashMovements,
    clientProfitability,
    projectProfitability,
    teamPerformance,
    campaignReports,
    filters: {
      debtClients: clientProfitability.filter((client) => client.debtARS > 0),
      overdueInvoices: invoiceRows.filter((invoice) => invoice.status === "vencida"),
      delayedProjects: projectProfitability.filter((project) => project.progress < 80 && !["finalizado", "entregado"].includes(project.status)),
      urgentTasks: tasks.filter((task) => task.priority === "urgente" && task.status !== "completada" && task.status !== "cancelada").map((task) => ({
        id: task.id,
        title: task.title,
        clientName: task.client?.company ?? null,
        projectName: task.project?.name ?? null,
        dueDate: task.dueDate,
        status: task.status
      })),
      pendingBudgets: budgets.filter((budget) => budget.status === "borrador" || budget.status === "enviado").map((budget) => ({
        id: budget.id,
        title: budget.projectName,
        clientName: budget.client?.company ?? "Sin cliente",
        total: decimalToNumber(budget.total) || decimalToNumber(budget.subtotal),
        currency: budget.currency,
        validUntil: budget.validUntil,
        status: budget.status
      }))
    },
    search: q ? buildSearchResults(q, {
      clients,
      projects,
      invoices: invoiceRows,
      budgets,
      payments,
      tasks,
      documents,
      teamMembers,
      opportunities
    }) : []
  };
}

function buildSearchResults(
  query: string,
  data: {
    clients: Array<{ id: string; company: string; name: string; email: string; service: string; status: string }>;
    projects: Array<{ id: string; name: string; description: string | null; status: string; client: { company: string } }>;
    invoices: Array<{ id: string; number: string; clientName: string; status: string }>;
    budgets: Array<{ id: string; number: string | null; projectName: string; status: string; client: { company: string } | null }>;
    payments: Array<{ id: string; status: string; method: string; client: { company: string }; invoice: { number: string } | null }>;
    tasks: Array<{ id: string; title: string; status: string; client: { company: string } | null; project: { name: string } | null }>;
    documents: Array<{ id: string; name: string; type: string; client: { company: string } | null; project: { name: string } | null }>;
    teamMembers: Array<{ id: string; name: string; lastName: string | null; email: string; role: string }>;
    opportunities: Array<{ id: string; title: string; service: string; status: string; client: { company: string } | null }>;
  }
) {
  const needle = normalize(query);
  const results = [
    ...data.clients.map((client) => ({
      type: "Cliente",
      title: client.company,
      detail: `${client.name} - ${client.service}`,
      status: client.status,
      href: `/clients/${client.id}`,
      haystack: [client.company, client.name, client.email, client.service, client.status]
    })),
    ...data.projects.map((project) => ({
      type: "Proyecto",
      title: project.name,
      detail: project.client.company,
      status: project.status,
      href: `/projects/${project.id}`,
      haystack: [project.name, project.description, project.client.company, project.status]
    })),
    ...data.invoices.map((invoice) => ({
      type: "Factura",
      title: invoice.number,
      detail: invoice.clientName,
      status: invoice.status,
      href: `/billing/${invoice.id}`,
      haystack: [invoice.number, invoice.clientName, invoice.status]
    })),
    ...data.budgets.map((budget) => ({
      type: "Presupuesto",
      title: budget.number || budget.projectName,
      detail: budget.client?.company ?? "Sin cliente",
      status: budget.status,
      href: `/budgets/${budget.id}`,
      haystack: [budget.number, budget.projectName, budget.client?.company, budget.status]
    })),
    ...data.payments.map((payment) => ({
      type: "Pago",
      title: payment.invoice?.number ? `Pago ${payment.invoice.number}` : `Pago ${payment.method}`,
      detail: payment.client.company,
      status: payment.status,
      href: "/payments",
      haystack: [payment.client.company, payment.invoice?.number, payment.method, payment.status]
    })),
    ...data.tasks.map((task) => ({
      type: "Tarea",
      title: task.title,
      detail: task.project?.name ?? task.client?.company ?? "Interna",
      status: task.status,
      href: "/tasks",
      haystack: [task.title, task.project?.name, task.client?.company, task.status]
    })),
    ...data.documents.map((document) => ({
      type: "Documento",
      title: document.name,
      detail: document.project?.name ?? document.client?.company ?? "Sin asociar",
      status: document.type,
      href: "/documents",
      haystack: [document.name, document.type, document.project?.name, document.client?.company]
    })),
    ...data.teamMembers.map((member) => ({
      type: "Equipo",
      title: [member.name, member.lastName].filter(Boolean).join(" "),
      detail: member.email,
      status: member.role,
      href: "/team",
      haystack: [member.name, member.lastName, member.email, member.role]
    })),
    ...data.opportunities.map((opportunity) => ({
      type: "CRM",
      title: opportunity.title,
      detail: opportunity.client?.company ?? opportunity.service,
      status: opportunity.status,
      href: "/crm",
      haystack: [opportunity.title, opportunity.service, opportunity.client?.company, opportunity.status]
    }))
  ];

  return results
    .filter((result) => result.haystack.some((value) => normalize(value).includes(needle)))
    .slice(0, 25)
    .map(({ haystack, ...result }) => result);
}

function buildMonthlyCashSeries(movements: Array<{ type: string; amountARS: number; date: Date }>) {
  return Array.from({ length: 12 }, (_, index) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthMovements = movements.filter((movement) => movement.date >= start && movement.date <= end);
    const ingresos = monthMovements.filter((movement) => movement.type === "ingreso").reduce((sum, movement) => sum + movement.amountARS, 0);
    const egresos = monthMovements.filter((movement) => movement.type !== "ingreso").reduce((sum, movement) => sum + movement.amountARS, 0);
    return {
      month: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(date),
      ingresos,
      egresos,
      saldo: ingresos - egresos
    };
  });
}

function buildServiceSales(clients: Array<{ service: string }>) {
  const grouped = clients.reduce<Record<string, number>>((acc, client) => {
    acc[client.service] = (acc[client.service] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
