import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export type BillingData = Awaited<ReturnType<typeof getBillingData>>;

export async function getBillingData() {
  const [clients, projects, invoices, categories] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: [{ company: "asc" }, { name: "asc" }]
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.invoice.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        project: true,
        budget: true,
        items: true,
        payments: { where: { deletedAt: null }, orderBy: { date: "desc" } }
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } })
  ]);

  return {
    clients: clients.map((client) => ({
      id: client.id,
      label: `${client.company} - ${client.name}`
    })),
    projects: projects.map((project) => ({
      id: project.id,
      clientId: project.clientId,
      label: `${project.name} - ${project.client.company}`
    })),
    categories: categories.map((category) => ({
      id: category.id,
      label: category.name
    })),
    invoices: invoices.map((invoice) => {
      const total = decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
      const paid = invoice.payments.reduce((sum, payment) => sum + decimalToNumber(payment.paidAmount || payment.amount), 0);
      const balanceDue = Math.max(decimalToNumber(invoice.balanceDue) || total - paid, 0);

      return {
        id: invoice.id,
        number: invoice.number,
        clientId: invoice.clientId,
        clientName: invoice.client.company,
        projectName: invoice.project?.name ?? null,
        total,
        paid,
        balanceDue,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: normalizeInvoiceStatus(invoice.status, invoice.dueDate, balanceDue),
        itemCount: invoice.items.length
      };
    })
  };
}

export async function getInvoiceDetail(id: string) {
  const [invoice, categories] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        project: true,
        budget: true,
        items: { orderBy: { createdAt: "asc" } },
        payments: { where: { deletedAt: null }, orderBy: { date: "desc" } },
        movements: { where: { deletedAt: null }, include: { category: true }, orderBy: { date: "desc" } }
      }
    }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } })
  ]);

  if (!invoice) return null;

  const total = decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
  const paid = invoice.payments.reduce((sum, payment) => sum + decimalToNumber(payment.paidAmount || payment.amount), 0);
  const balanceDue = Math.max(decimalToNumber(invoice.balanceDue) || total - paid, 0);

  return {
    invoice: {
      id: invoice.id,
      number: invoice.number,
      client: invoice.client,
      project: invoice.project,
      budget: invoice.budget,
      subtotal: decimalToNumber(invoice.subtotal) || total,
      discount: decimalToNumber(invoice.discount),
      taxes: decimalToNumber(invoice.taxes),
      total,
      paid,
      balanceDue,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: normalizeInvoiceStatus(invoice.status, invoice.dueDate, balanceDue),
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: decimalToNumber(item.quantity),
        unitPrice: decimalToNumber(item.unitPrice),
        total: decimalToNumber(item.total)
      })),
      payments: invoice.payments.map((payment) => ({
        id: payment.id,
        amount: decimalToNumber(payment.amount),
        paidAmount: decimalToNumber(payment.paidAmount || payment.amount),
        currency: payment.currency,
        date: payment.date,
        dueDate: payment.dueDate,
        status: payment.status,
        method: payment.method
      })),
      movements: invoice.movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        category: movement.category.name,
        amount: decimalToNumber(movement.amount),
        currency: movement.currency,
        date: movement.date,
        description: movement.description
      }))
    },
    categories: categories.map((category) => ({
      id: category.id,
      label: category.name
    }))
  };
}

function normalizeInvoiceStatus(status: string, dueDate: Date, balanceDue: number) {
  if (status === "pagada" || status === "cancelada" || status === "anulada") return status;
  if (balanceDue <= 0) return "pagada";
  if (dueDate < new Date()) return "vencida";
  return status;
}
