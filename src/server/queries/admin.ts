import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAdmin } from "@/lib/permissions";

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;

const roles = ["admin", "finanzas", "project_manager", "desarrollador", "marketing", "solo_lectura", "cliente"];
const modules = [
  "Dashboard",
  "Clientes y ventas",
  "Proyectos",
  "Finanzas",
  "Operacion",
  "Reportes",
  "Configuracion",
  "Administracion",
  "Portal cliente"
];

export async function getAdminData() {
  const session = await auth();
  const isAdmin = canAdmin(session?.user.role);

  const [
    deletedClients,
    deletedProjects,
    deletedInvoices,
    deletedPayments,
    deletedDocuments,
    deletedBudgets,
    deletedMovements,
    overdueInvoices,
    paidPaymentsWithoutMovement,
    unassignedTasks,
    documentsWithoutLink,
    hiddenPortalItems
  ] = await Promise.all([
    prisma.client.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.project.findMany({ where: { deletedAt: { not: null } }, include: { client: true }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.invoice.findMany({ where: { deletedAt: { not: null } }, include: { client: true }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.payment.findMany({ where: { deletedAt: { not: null } }, include: { client: true }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.document.findMany({ where: { deletedAt: { not: null } }, include: { client: true, project: true }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.budget.findMany({ where: { deletedAt: { not: null } }, include: { client: true }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.movement.findMany({ where: { deletedAt: { not: null } }, include: { category: true }, orderBy: { deletedAt: "desc" }, take: 20 }),
    prisma.invoice.count({ where: { deletedAt: null, status: { notIn: ["pagada", "cancelada"] }, dueDate: { lt: new Date() } } }),
    prisma.payment.count({ where: { deletedAt: null, status: "pagado", movement: { is: null } } }),
    prisma.adminTask.count({ where: { deletedAt: null, responsibleTeamMemberId: null, status: { notIn: ["completada", "cancelada"] } } }),
    prisma.document.count({ where: { deletedAt: null, OR: [{ link: "#" }, { link: "" }] } }),
    prisma.clientPortalItem.count({ where: { deletedAt: null, status: { not: "visible" } } })
  ]);

  const trash = [
    ...deletedClients.map((item) => trashItem("client", item.id, item.company, "Cliente", item.deletedAt)),
    ...deletedProjects.map((item) => trashItem("project", item.id, item.name, `Proyecto - ${item.client.company}`, item.deletedAt)),
    ...deletedInvoices.map((item) => trashItem("invoice", item.id, item.number, `Factura - ${item.client.company}`, item.deletedAt)),
    ...deletedPayments.map((item) => trashItem("payment", item.id, item.client.company, "Pago", item.deletedAt)),
    ...deletedDocuments.map((item) => trashItem("document", item.id, item.name, `Documento - ${item.client?.company ?? item.project?.name ?? "Sin asociar"}`, item.deletedAt)),
    ...deletedBudgets.map((item) => trashItem("budget", item.id, item.projectName, `Presupuesto - ${item.client?.company ?? "Sin cliente"}`, item.deletedAt)),
    ...deletedMovements.map((item) => trashItem("movement", item.id, item.description, `Movimiento - ${item.category.name}`, item.deletedAt))
  ].sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0));

  return {
    isAdmin,
    sessionRole: session?.user.role ?? "sin_sesion",
    trash,
    qaChecks: [
      qa("Facturas vencidas", overdueInvoices, "Revisar cobros pendientes y registrar pagos."),
      qa("Pagos pagados sin movimiento", paidPaymentsWithoutMovement, "Vincular o generar movimiento de ingreso para caja real."),
      qa("Tareas activas sin responsable", unassignedTasks, "Asignar responsables desde Equipo."),
      qa("Documentos sin link", documentsWithoutLink, "Completar enlace o generar plantilla imprimible."),
      qa("Items de portal no visibles", hiddenPortalItems, "Confirmar si deben publicarse, archivarse o quedar ocultos.")
    ],
    onboardingSteps: [
      "Crear cliente con datos comerciales y proxima accion.",
      "Crear presupuesto asociado al cliente.",
      "Aprobar presupuesto y convertirlo en proyecto.",
      "Asignar tareas y responsables desde Equipo.",
      "Registrar horas trabajadas sobre proyecto y tarea.",
      "Generar factura desde presupuesto o desde Facturacion.",
      "Registrar pago parcial o total y generar movimiento de ingreso.",
      "Revisar movimientos como fuente de caja real.",
      "Compartir documentos o aprobaciones desde Portal Cliente.",
      "Revisar reportes, alertas y agenda al cierre del dia."
    ],
    permissionMatrix: roles.map((role) => ({
      role,
      modules: modules.map((module) => ({ module, allowed: permissionAllowed(role, module) }))
    }))
  };
}

function trashItem(type: string, id: string, title: string, detail: string, deletedAt: Date | null) {
  return { type, id, title, detail, deletedAt };
}

function qa(title: string, count: number, action: string) {
  return { title, count, action, status: count ? "atencion" : "ok" };
}

function permissionAllowed(role: string, module: string) {
  const byRole: Record<string, string[]> = {
    admin: modules,
    finanzas: ["Dashboard", "Clientes y ventas", "Finanzas", "Reportes", "Configuracion"],
    project_manager: ["Dashboard", "Clientes y ventas", "Proyectos", "Operacion", "Reportes", "Portal cliente"],
    desarrollador: ["Dashboard", "Proyectos", "Operacion", "Reportes", "Portal cliente"],
    marketing: ["Dashboard", "Clientes y ventas", "Operacion", "Reportes"],
    solo_lectura: ["Dashboard", "Clientes y ventas", "Proyectos", "Finanzas", "Operacion", "Reportes"],
    cliente: ["Portal cliente"]
  };
  return byRole[role]?.includes(module) ?? false;
}
