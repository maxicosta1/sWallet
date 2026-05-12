"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteFinance, canWriteProjects } from "@/lib/permissions";

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
  await prisma.payment.create({
    data: {
      ...data,
      amount: data.amount,
      paidAmount: data.paidAmount,
      date: new Date(data.date),
      dueDate: new Date(data.dueDate),
      isRecurring: Boolean(data.isRecurring)
    }
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
  ["/dashboard", "/clients", "/payments", "/movements", "/reports", "/projects", "/subscriptions"].forEach((path) => {
    revalidatePath(path);
  });
}
