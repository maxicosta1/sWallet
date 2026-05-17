import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export type DocumentsSupportData = Awaited<ReturnType<typeof getDocumentsSupportData>>;

const documentTemplates: Record<string, string[]> = {
  brief: ["Objetivos", "Publico objetivo", "Referencias", "Funciones necesarias", "Contenido requerido", "Notas"],
  contrato: ["Alcance", "Tiempos estimados", "Revisiones incluidas", "Condiciones de pago", "Responsabilidades", "Aceptacion"],
  factura: ["Datos del cliente", "Conceptos", "Total", "Estado de pago", "Vencimiento", "Condiciones"],
  propuesta: ["Servicios incluidos", "Items", "Total", "Condiciones", "Validez", "Proximos pasos"],
  recurso: ["Descripcion", "Uso interno", "Proyecto asociado", "Responsable", "Version", "Notas"],
  otro: ["Descripcion", "Contexto", "Relacion", "Estado", "Notas"]
};

export async function getDocumentsSupportData() {
  const [clients, projects, documents, supportPlans] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: [{ company: "asc" }, { name: "asc" }]
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.document.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.supportPlan.findMany({
      where: { deletedAt: null },
      include: { client: true, project: true },
      orderBy: [{ domainRenewal: "asc" }, { hostingRenewal: "asc" }, { updatedAt: "desc" }]
    })
  ]);

  const now = new Date();
  const next30 = addDays(now, 30);
  const supportAlerts = supportPlans.flatMap((plan) => {
    const alerts: Array<{ id: string; title: string; date: Date; severity: "alta" | "media" }> = [];
    if (plan.domainRenewal && plan.domainRenewal <= next30) {
      alerts.push({
        id: `domain-${plan.id}`,
        title: `Dominio ${plan.domain}`,
        date: plan.domainRenewal,
        severity: plan.domainRenewal < now ? "alta" : "media"
      });
    }
    if (plan.hostingRenewal && plan.hostingRenewal <= next30) {
      alerts.push({
        id: `hosting-${plan.id}`,
        title: `Hosting ${plan.hosting}`,
        date: plan.hostingRenewal,
        severity: plan.hostingRenewal < now ? "alta" : "media"
      });
    }
    return alerts;
  });

  return {
    clients: clients.map((client) => ({ id: client.id, label: `${client.company} - ${client.name}` })),
    projects: projects.map((project) => ({ id: project.id, label: `${project.name} - ${project.client.company}` })),
    documents: documents.map((document) => ({
      id: document.id,
      name: document.name,
      type: document.type,
      link: document.link,
      tags: document.tags,
      description: document.description,
      clientName: document.client?.company ?? "Sin cliente",
      projectName: document.project?.name ?? null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      templateSections: documentTemplates[document.type] ?? documentTemplates.otro
    })),
    supportPlans: supportPlans.map((plan) => ({
      id: plan.id,
      url: plan.url,
      domain: plan.domain,
      hosting: plan.hosting,
      domainRenewal: plan.domainRenewal,
      hostingRenewal: plan.hostingRenewal,
      plan: plan.plan,
      monthlyPrice: decimalToNumber(plan.monthlyPrice),
      currency: plan.currency,
      status: plan.status,
      notes: plan.notes,
      clientName: plan.client?.company ?? "Sin cliente",
      projectName: plan.project?.name ?? null,
      nextRenewal: nextRenewal(plan.domainRenewal, plan.hostingRenewal),
      renewalState: renewalState(nextRenewal(plan.domainRenewal, plan.hostingRenewal), now)
    })),
    supportAlerts
  };
}

function nextRenewal(domainRenewal: Date | null, hostingRenewal: Date | null) {
  const dates = [domainRenewal, hostingRenewal].filter(Boolean) as Date[];
  if (!dates.length) return null;
  return dates.sort((a, b) => a.getTime() - b.getTime())[0];
}

function renewalState(date: Date | null, now: Date) {
  if (!date) return "sin_fecha";
  if (date < now) return "vencido";
  if (date <= addDays(now, 30)) return "por_vencer";
  return "normal";
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
