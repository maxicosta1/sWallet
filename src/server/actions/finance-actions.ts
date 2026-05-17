"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteFinance, canWriteProjects } from "@/lib/permissions";
import { decimalToNumber } from "@/lib/format";
import type { Prisma } from "@prisma/client";

const currencySchema = z.enum(["ARS", "USD"]);

const clientSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  service: z.string().min(2),
  agreedPrice: z.coerce.number().positive(),
  currency: currencySchema,
  status: z.enum(["lead", "interesado", "activo", "en_desarrollo", "mantenimiento", "finalizado"]),
  startDate: z.string().optional(),
  observations: z.string().optional()
});

const paymentSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  invoiceId: z.string().optional(),
  budgetId: z.string().optional(),
  categoryId: z.string().optional(),
  amount: z.coerce.number().positive(),
  paidAmount: z.coerce.number().min(0).default(0),
  currency: currencySchema,
  date: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["pendiente", "pagado", "vencido", "cancelado"]),
  method: z.enum(["transferencia", "efectivo", "mercadopago", "paypal", "wise", "stripe", "otro"]),
  isRecurring: z.coerce.boolean().optional(),
  notes: z.string().optional()
});

const invoiceSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  budgetId: z.string().optional(),
  number: z.string().optional(),
  currency: currencySchema,
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  discount: z.coerce.number().min(0).default(0),
  taxes: z.coerce.number().min(0).default(0),
  status: z.enum(["borrador", "pendiente", "enviada", "vencida", "cancelada"]),
  notes: z.string().optional()
});

const budgetSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  number: z.string().optional(),
  projectName: z.string().min(2),
  services: z.string().optional(),
  currency: currencySchema,
  issueDate: z.string().optional(),
  validUntil: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
  taxes: z.coerce.number().min(0).default(0),
  status: z.enum(["borrador", "enviado", "aprobado", "rechazado", "vencido"]),
  notes: z.string().optional()
});

const movementSchema = z.object({
  type: z.enum(["ingreso", "gasto", "inversion"]),
  categoryId: z.string().min(1),
  description: z.string().min(3),
  amount: z.coerce.number().positive(),
  currency: currencySchema,
  date: z.string().min(1)
});

const projectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["pendiente", "en_progreso", "revision", "entregado", "pausado"]),
  progress: z.coerce.number().min(0).max(100),
  budget: z.coerce.number().positive(),
  currency: currencySchema,
  dueAt: z.string().optional()
});

const subscriptionSchema = z.object({
  name: z.string().min(2),
  provider: z.string().min(2),
  category: z.string().min(2),
  monthlyCost: z.coerce.number().min(0),
  annualCost: z.coerce.number().min(0),
  currency: currencySchema,
  renewsAt: z.string().min(1),
  status: z.enum(["activa", "por_vencer", "vencida", "cancelada"])
});

export async function createClientAction(formData: FormData) {
  await assertFinance();
  const data = clientSchema.parse(Object.fromEntries(formData));
  await prisma.client.create({
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      agreedPrice: data.agreedPrice
    }
  });
  revalidateEverywhere();
}

export async function createPaymentAction(formData: FormData) {
  await assertFinance();
  const data = paymentSchema.parse(Object.fromEntries(formData));
  const { categoryId, ...paymentData } = data;
  const paidAmount = data.status === "pagado" ? Math.max(data.paidAmount || data.amount, 0) : data.paidAmount;
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        ...emptyToNull(paymentData),
        amount: data.amount,
        paidAmount,
        date: new Date(data.date),
        dueDate: new Date(data.dueDate),
        isRecurring: Boolean(data.isRecurring)
      }
    });

    if (data.status === "pagado") {
      const resolvedCategoryId = await resolveIncomeCategoryId(tx, categoryId);
      await tx.movement.create({
        data: {
          userId: payment.userId,
          clientId: payment.clientId,
          projectId: payment.projectId,
          invoiceId: payment.invoiceId,
          paymentId: payment.id,
          type: "ingreso",
          categoryId: resolvedCategoryId,
          description: data.notes || "Cobro confirmado desde pagos",
          amount: paidAmount || data.amount,
          currency: payment.currency,
          date: new Date(data.date)
        }
      });
    }

    if (payment.invoiceId) {
      await syncInvoicePaymentStatus(tx, payment.invoiceId);
    }
  });
  revalidateEverywhere();
}

export async function createInvoiceAction(formData: FormData) {
  await assertFinance();
  const data = invoiceSchema.parse(Object.fromEntries(formData));
  const items = parseInvoiceItems(formData);
  if (!items.length) throw new Error("Agrega al menos un item a la factura.");

  const subtotal = items.reduce((total, item) => total + item.total, 0);
  const total = Math.max(subtotal - data.discount + data.taxes, 0);
  const number = data.number?.trim() || await nextInvoiceNumber();

  await prisma.invoice.create({
    data: {
      ...emptyToNull(data),
      number,
      amount: total,
      subtotal,
      discount: data.discount,
      taxes: data.taxes,
      total,
      balanceDue: total,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
      items: {
        create: items
      }
    }
  });
  revalidateEverywhere();
}

export async function createInvoicePaymentAction(formData: FormData) {
  await assertFinance();
  const invoiceId = z.string().min(1).parse(formData.get("invoiceId"));
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
    select: { id: true, clientId: true, projectId: true, currency: true, dueDate: true }
  });
  if (!invoice) throw new Error("Factura no encontrada.");

  const payload = new FormData();
  payload.set("clientId", invoice.clientId);
  if (invoice.projectId) payload.set("projectId", invoice.projectId);
  payload.set("invoiceId", invoice.id);
  payload.set("amount", String(formData.get("amount") || "0"));
  payload.set("paidAmount", String(formData.get("paidAmount") || formData.get("amount") || "0"));
  payload.set("currency", String(formData.get("currency") || invoice.currency));
  payload.set("date", String(formData.get("date") || new Date().toISOString().slice(0, 10)));
  payload.set("dueDate", String(formData.get("dueDate") || invoice.dueDate.toISOString().slice(0, 10)));
  payload.set("status", String(formData.get("status") || "pagado"));
  payload.set("method", String(formData.get("method") || "transferencia"));
  payload.set("categoryId", String(formData.get("categoryId") || ""));
  payload.set("notes", String(formData.get("notes") || "Pago registrado desde factura"));

  await createPaymentAction(payload);
}

export async function createBudgetAction(formData: FormData) {
  await assertFinance();
  const data = budgetSchema.parse(Object.fromEntries(formData));
  const items = parseBudgetItems(formData);
  if (!items.length) throw new Error("Agrega al menos un item al presupuesto.");

  const subtotal = items.reduce((total, item) => total + item.total, 0);
  const total = Math.max(subtotal - data.discount + data.taxes, 0);
  const number = data.number?.trim() || await nextBudgetNumber();

  await prisma.budget.create({
    data: {
      ...emptyToNull(data),
      number,
      subtotal,
      discount: data.discount,
      taxes: data.taxes,
      total,
      issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      items: {
        create: items.map((item, position) => ({
          ...item,
          amount: item.total,
          position
        }))
      }
    }
  });
  revalidateEverywhere();
}

export async function convertBudgetToInvoiceAction(formData: FormData) {
  await assertFinance();
  const budgetId = z.string().min(1).parse(formData.get("budgetId"));
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, deletedAt: null },
    include: { items: { orderBy: { position: "asc" } } }
  });
  if (!budget) throw new Error("Presupuesto no encontrado.");
  if (!budget.clientId) throw new Error("El presupuesto necesita un cliente para convertirse en factura.");

  const subtotal = decimalToNumber(budget.subtotal) || budget.items.reduce((sum, item) => sum + (decimalToNumber(item.total) || decimalToNumber(item.amount)), 0);
  const total = decimalToNumber(budget.total) || Math.max(subtotal - decimalToNumber(budget.discount) + decimalToNumber(budget.taxes), 0);
  const dueDate = budget.validUntil ?? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.invoice.create({
      data: {
        number: await nextInvoiceNumber(tx),
        clientId: budget.clientId!,
        projectId: budget.projectId,
        budgetId: budget.id,
        amount: total,
        subtotal,
        discount: budget.discount,
        taxes: budget.taxes,
        total,
        balanceDue: total,
        currency: budget.currency,
        issueDate: new Date(),
        dueDate,
        status: "pendiente",
        notes: budget.notes,
        items: {
          create: budget.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: decimalToNumber(item.unitPrice) || decimalToNumber(item.amount),
            total: decimalToNumber(item.total) || decimalToNumber(item.amount)
          }))
        }
      }
    });

    await tx.budget.update({
      where: { id: budget.id },
      data: { status: "aprobado" }
    });
  });
  revalidateEverywhere();
}

export async function convertBudgetToProjectAction(formData: FormData) {
  await assertProject();
  const budgetId = z.string().min(1).parse(formData.get("budgetId"));
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, deletedAt: null },
    include: { approvedProject: true }
  });
  if (!budget) throw new Error("Presupuesto no encontrado.");
  if (!budget.clientId) throw new Error("El presupuesto necesita un cliente para convertirse en proyecto.");
  if (budget.projectId || budget.approvedProject) throw new Error("Este presupuesto ya tiene un proyecto asociado.");

  const total = decimalToNumber(budget.total) || decimalToNumber(budget.subtotal);
  await prisma.$transaction(async (tx) => {
    await tx.project.create({
      data: {
        clientId: budget.clientId!,
        approvedBudgetId: budget.id,
        name: budget.projectName,
        description: budget.services || budget.notes,
        status: "planificacion",
        stage: "relevamiento",
        risk: "normal",
        progress: 0,
        budget: total,
        currency: budget.currency,
        startsAt: new Date(),
        notes: budget.notes
      }
    });

    await tx.budget.update({
      where: { id: budget.id },
      data: { status: "aprobado" }
    });
  });
  revalidateEverywhere();
}

export async function createMovementAction(formData: FormData) {
  await assertFinance();
  const data = movementSchema.parse(Object.fromEntries(formData));
  await prisma.movement.create({
    data: {
      ...data,
      amount: data.amount,
      date: new Date(data.date)
    }
  });
  revalidateEverywhere();
}

export async function createProjectAction(formData: FormData) {
  await assertProject();
  const data = projectSchema.parse(Object.fromEntries(formData));
  await prisma.project.create({
    data: {
      ...data,
      budget: data.budget,
      dueAt: data.dueAt ? new Date(data.dueAt) : null
    }
  });
  revalidateEverywhere();
}

export async function createSubscriptionAction(formData: FormData) {
  await assertFinance();
  const data = subscriptionSchema.parse(Object.fromEntries(formData));
  await prisma.subscription.create({
    data: {
      ...data,
      monthlyCost: data.monthlyCost,
      annualCost: data.annualCost,
      renewsAt: new Date(data.renewsAt)
    }
  });
  revalidateEverywhere();
}

export async function updateExchangeRateAction(formData: FormData) {
  await assertFinance();
  const rate = z.coerce.number().positive().parse(formData.get("rate"));
  await prisma.exchangeRate.create({
    data: {
      rate,
      source: "manual",
      validAt: new Date()
    }
  });
  revalidateEverywhere();
}

async function assertFinance() {
  const session = await auth();
  if (!canWriteFinance(session?.user.role)) {
    throw new Error("No tenés permisos para modificar finanzas.");
  }
}

async function assertProject() {
  const session = await auth();
  if (!canWriteProjects(session?.user.role)) {
    throw new Error("No tenés permisos para modificar proyectos.");
  }
}

function revalidateEverywhere() {
  ["/dashboard", "/clients", "/payments", "/movements", "/reports", "/projects", "/subscriptions", "/billing", "/budgets", "/finance"].forEach((path) => {
    revalidatePath(path);
  });
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const latest = await tx.invoice.findFirst({
    where: { number: { startsWith: "FAC-" } },
    orderBy: { createdAt: "desc" },
    select: { number: true }
  });
  const next = (Number(latest?.number.replace("FAC-", "")) || 0) + 1;
  return `FAC-${String(next).padStart(6, "0")}`;
}

async function nextBudgetNumber() {
  const latest = await prisma.budget.findFirst({
    where: { number: { startsWith: "PRE-" } },
    orderBy: { createdAt: "desc" },
    select: { number: true }
  });
  const next = (Number(latest?.number?.replace("PRE-", "")) || 0) + 1;
  return `PRE-${String(next).padStart(6, "0")}`;
}

function parseInvoiceItems(formData: FormData) {
  const descriptions = formData.getAll("itemDescription").map((value) => String(value).trim());
  const quantities = formData.getAll("itemQuantity");
  const unitPrices = formData.getAll("itemUnitPrice");

  return descriptions
    .map((description, index) => {
      const quantity = Number(quantities[index] || 0);
      const unitPrice = Number(unitPrices[index] || 0);
      return {
        description,
        quantity,
        unitPrice,
        total: quantity * unitPrice
      };
    })
    .filter((item) => item.description && item.quantity > 0 && item.unitPrice >= 0);
}

function parseBudgetItems(formData: FormData) {
  const descriptions = formData.getAll("budgetItemDescription").map((value) => String(value).trim());
  const quantities = formData.getAll("budgetItemQuantity");
  const unitPrices = formData.getAll("budgetItemUnitPrice");

  return descriptions
    .map((description, index) => {
      const quantity = Number(quantities[index] || 0);
      const unitPrice = Number(unitPrices[index] || 0);
      return {
        description,
        quantity,
        unitPrice,
        total: quantity * unitPrice
      };
    })
    .filter((item) => item.description && item.quantity > 0 && item.unitPrice >= 0);
}

function emptyToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}

async function resolveIncomeCategoryId(
  tx: Prisma.TransactionClient,
  categoryId?: string | null
) {
  if (categoryId) return categoryId;

  const category = await tx.category.upsert({
    where: { name: "ingresos" },
    update: {},
    create: {
      name: "ingresos",
      color: "#35d49a",
      icon: "TrendingUp"
    }
  });

  return category.id;
}

async function syncInvoicePaymentStatus(
  tx: Prisma.TransactionClient,
  invoiceId: string
) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { where: { deletedAt: null } } }
  });
  if (!invoice) return;

  const total = decimalToNumber(invoice.total) || decimalToNumber(invoice.amount);
  const paid = invoice.payments.reduce((sum, payment) => sum + decimalToNumber(payment.paidAmount || payment.amount), 0);
  const balanceDue = Math.max(total - paid, 0);
  const status = balanceDue <= 0 ? "pagada" : paid > 0 ? "pendiente" : invoice.dueDate < new Date() ? "vencida" : invoice.status;

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      balanceDue,
      status
    }
  });
}
