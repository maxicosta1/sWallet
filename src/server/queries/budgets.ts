import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/format";

export type BudgetsData = Awaited<ReturnType<typeof getBudgetsData>>;
export type BudgetDetail = NonNullable<Awaited<ReturnType<typeof getBudgetDetail>>>;

type BudgetSummaryInput = {
  id: string;
  number: string | null;
  projectName: string;
  currency: "ARS" | "USD";
  subtotal: unknown;
  discount: unknown;
  taxes: unknown;
  total: unknown;
  validUntil: Date | null;
  status: string;
  client: { company: string; name: string } | null;
  project: { name: string } | null;
  items: Array<{ amount: unknown; total: unknown }>;
  invoices: Array<{ id: string; number: string }>;
  approvedProject: { id: string; name: string } | null;
};

type BudgetDetailInput = Omit<BudgetSummaryInput, "client" | "project" | "items"> & {
  services: string | null;
  issueDate: Date;
  notes: string | null;
  client: {
    id: string;
    company: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  project: { id: string; name: string } | null;
  items: Array<{
    id: string;
    description: string;
    amount: unknown;
    quantity: unknown;
    unitPrice: unknown;
    total: unknown;
    position: number;
  }>;
};

export async function getBudgetsData() {
  const [clients, projects, budgets] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: [{ company: "asc" }, { name: "asc" }]
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.budget.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        project: true,
        items: { orderBy: { position: "asc" } },
        invoices: { where: { deletedAt: null }, select: { id: true, number: true } },
        approvedProject: { select: { id: true, name: true } }
      },
      orderBy: [{ createdAt: "desc" }]
    })
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
    budgets: budgets.map((budget) => serializeBudgetSummary(budget))
  };
}

export async function getBudgetDetail(id: string) {
  const budget = await prisma.budget.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      project: true,
      items: { orderBy: { position: "asc" } },
      invoices: { where: { deletedAt: null }, select: { id: true, number: true } },
      approvedProject: { select: { id: true, name: true } }
    }
  });

  if (!budget) return null;
  return serializeBudgetDetail(budget);
}

function serializeBudgetSummary(budget: BudgetSummaryInput) {
  const subtotal = decimalToNumber(budget.subtotal) || budget.items.reduce((sum, item) => sum + (decimalToNumber(item.total) || decimalToNumber(item.amount)), 0);
  const total = decimalToNumber(budget.total) || Math.max(subtotal - decimalToNumber(budget.discount) + decimalToNumber(budget.taxes), 0);

  return {
    id: budget.id,
    number: budget.number || "Sin numero",
    title: budget.projectName,
    clientName: budget.client?.company ?? "Sin cliente",
    projectName: budget.project?.name ?? null,
    subtotal,
    discount: decimalToNumber(budget.discount),
    taxes: decimalToNumber(budget.taxes),
    total,
    currency: budget.currency,
    validUntil: budget.validUntil,
    status: budget.status,
    itemCount: budget.items.length,
    invoiceCount: budget.invoices.length,
    approvedProject: budget.approvedProject
  };
}

function serializeBudgetDetail(budget: BudgetDetailInput) {
  const summary = serializeBudgetSummary(budget);

  return {
    ...summary,
    client: budget.client,
    project: budget.project,
    services: budget.services,
    issueDate: budget.issueDate,
    notes: budget.notes,
    items: budget.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: decimalToNumber(item.quantity),
      unitPrice: decimalToNumber(item.unitPrice) || decimalToNumber(item.amount),
      total: decimalToNumber(item.total) || decimalToNumber(item.amount),
      position: item.position
    })),
    invoices: budget.invoices
  };
}
