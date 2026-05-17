import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export type ClientPortalData = Awaited<ReturnType<typeof getClientPortalData>>;

export async function getClientPortalData() {
  const session = await auth();
  const role = session?.user.role;
  const isClient = role === "cliente";
  const email = session?.user.email?.trim().toLowerCase();

  const clients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      ...(isClient ? { email: email ?? "__no_client__" } : {})
    },
    include: {
      projects: {
        where: { deletedAt: null },
        include: {
          adminTasks: {
            where: {
              deletedAt: null,
              status: { in: ["en_revision", "bloqueada", "completada"] }
            },
            orderBy: [{ dueDate: "asc" }]
          },
          documents: {
            where: { deletedAt: null },
            orderBy: [{ updatedAt: "desc" }]
          }
        },
        orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }]
      },
      budgets: {
        where: { deletedAt: null },
        orderBy: [{ validUntil: "asc" }, { createdAt: "desc" }]
      },
      invoices: {
        where: { deletedAt: null, status: { not: "cancelada" } },
        include: { payments: { where: { deletedAt: null }, orderBy: { date: "desc" } } },
        orderBy: [{ dueDate: "asc" }]
      },
      payments: {
        where: { deletedAt: null },
        orderBy: [{ dueDate: "asc" }, { date: "desc" }]
      },
      documents: {
        where: { deletedAt: null },
        orderBy: [{ updatedAt: "desc" }]
      },
      portalItems: {
        where: isClient ? { deletedAt: null, status: "visible" } : { deletedAt: null },
        orderBy: [{ updatedAt: "desc" }]
      },
      supportPlans: {
        where: { deletedAt: null },
        orderBy: [{ domainRenewal: "asc" }, { hostingRenewal: "asc" }]
      }
    },
    orderBy: [{ company: "asc" }, { name: "asc" }]
  });

  const publicClients = clients.map((client) => {
    const invoices = client.invoices.map((invoice) => {
      const total = decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
      const paid = invoice.payments.reduce((sum, payment) => sum + decimalToNumber(payment.paidAmount || payment.amount), 0);
      const balanceDue = Math.max(decimalToNumber(invoice.balanceDue) || total - paid, 0);
      return {
        id: invoice.id,
        number: invoice.number,
        total,
        paid,
        balanceDue,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        status: balanceDue <= 0 ? "pagada" : invoice.status
      };
    });

    return {
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      service: client.service,
      status: client.status,
      projects: client.projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        stage: project.stage,
        progress: project.progress,
        dueAt: project.dueAt,
        tasksForReview: project.adminTasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate
        })),
        sharedDocuments: project.documents.map((document) => ({
          id: document.id,
          name: document.name,
          type: document.type,
          link: document.link,
          description: document.description
        }))
      })),
      budgets: client.budgets.map((budget) => ({
        id: budget.id,
        number: budget.number,
        title: budget.projectName,
        total: decimalToNumber(budget.total) || decimalToNumber(budget.subtotal),
        currency: budget.currency,
        validUntil: budget.validUntil,
        status: budget.status
      })),
      invoices,
      payments: client.payments.map((payment) => ({
        id: payment.id,
        amount: decimalToNumber(payment.paidAmount || payment.amount),
        currency: payment.currency,
        dueDate: payment.dueDate,
        date: payment.date,
        status: payment.status,
        method: payment.method
      })),
      documents: client.documents.map((document) => ({
        id: document.id,
        name: document.name,
        type: document.type,
        link: document.link,
        description: document.description
      })),
      portalItems: client.portalItems.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        link: item.link,
        notes: item.notes,
        updatedAt: item.updatedAt
      })),
      supportPlans: client.supportPlans.map((plan) => ({
        id: plan.id,
        url: plan.url,
        domain: plan.domain,
        hosting: plan.hosting,
        domainRenewal: plan.domainRenewal,
        hostingRenewal: plan.hostingRenewal,
        plan: plan.plan,
        status: plan.status
      })),
      totals: {
        pendingInvoices: invoices.filter((invoice) => invoice.balanceDue > 0).length,
        pendingAmountARS: invoices.filter((invoice) => invoice.currency === "ARS").reduce((sum, invoice) => sum + invoice.balanceDue, 0),
        pendingAmountUSD: invoices.filter((invoice) => invoice.currency === "USD").reduce((sum, invoice) => sum + invoice.balanceDue, 0),
        projectsActive: client.projects.filter((project) => project.status !== "finalizado" && project.status !== "entregado").length
      }
    };
  });

  return {
    isClient,
    clients: publicClients,
    clientOptions: publicClients.map((client) => ({ id: client.id, label: `${client.company} - ${client.name}` }))
  };
}
