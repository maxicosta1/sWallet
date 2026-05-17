"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOperations, canWriteSales } from "@/lib/permissions";

const currencySchema = z.enum(["ARS", "USD"]);

const opportunitySchema = z.object({
  clientId: z.string().optional(),
  campaignId: z.string().optional(),
  responsibleTeamMemberId: z.string().optional(),
  title: z.string().min(2),
  service: z.string().min(2),
  value: z.coerce.number().min(0),
  currency: currencySchema,
  probability: z.coerce.number().min(0).max(100),
  status: z.enum(["nuevo", "contacto", "reunion_agendada", "negociacion", "ganado", "perdido"]),
  nextAction: z.string().optional(),
  notes: z.string().optional()
});

const opportunityStatusSchema = z.object({
  opportunityId: z.string().min(1),
  status: z.enum(["nuevo", "contacto", "reunion_agendada", "negociacion", "ganado", "perdido"])
});

const campaignSchema = z.object({
  name: z.string().min(2),
  target: z.string().min(2),
  message: z.string().min(2),
  contacts: z.coerce.number().int().min(0).default(0),
  responses: z.coerce.number().int().min(0).default(0),
  meetings: z.coerce.number().int().min(0).default(0),
  sales: z.coerce.number().int().min(0).default(0),
  status: z.string().min(2),
  date: z.string().min(1)
});

const calendarEventSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  title: z.string().min(2),
  type: z.string().min(2),
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(["pendiente", "confirmado", "completado", "cancelado"]).default("pendiente"),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  description: z.string().optional()
});

const calendarStatusSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["pendiente", "confirmado", "completado", "cancelado"])
});

export async function createOpportunityAction(formData: FormData) {
  await assertSalesWrite();
  const data = opportunitySchema.parse(Object.fromEntries(formData));
  await prisma.opportunity.create({
    data: emptyToNull({
      ...data,
      value: data.value
    })
  });
  revalidateCommercial();
}

export async function updateOpportunityStatusAction(formData: FormData) {
  await assertSalesWrite();
  const data = opportunityStatusSchema.parse(Object.fromEntries(formData));
  await prisma.opportunity.update({
    where: { id: data.opportunityId },
    data: { status: data.status }
  });
  revalidateCommercial();
}

export async function createMarketingCampaignAction(formData: FormData) {
  await assertOperationsWrite();
  const data = campaignSchema.parse(Object.fromEntries(formData));
  await prisma.marketingCampaign.create({
    data: {
      ...data,
      date: new Date(data.date)
    }
  });
  revalidateCommercial();
}

export async function createCalendarEventAction(formData: FormData) {
  await assertOperationsWrite();
  const data = calendarEventSchema.parse(Object.fromEntries(formData));
  await prisma.calendarEvent.create({
    data: {
      ...emptyToNull(data),
      date: new Date(data.date)
    }
  });
  revalidateCommercial();
}

export async function updateCalendarEventStatusAction(formData: FormData) {
  await assertOperationsWrite();
  const data = calendarStatusSchema.parse(Object.fromEntries(formData));
  await prisma.calendarEvent.update({
    where: { id: data.eventId },
    data: { status: data.status }
  });
  revalidateCommercial();
}

async function assertSalesWrite() {
  const session = await auth();
  if (!canWriteSales(session?.user.role)) {
    throw new Error("No tenes permisos para modificar ventas.");
  }
}

async function assertOperationsWrite() {
  const session = await auth();
  if (!canWriteOperations(session?.user.role)) {
    throw new Error("No tenes permisos para modificar operaciones.");
  }
}

function revalidateCommercial() {
  ["/crm", "/marketing", "/agenda", "/alerts", "/dashboard", "/clients", "/reports"].forEach((path) => revalidatePath(path));
}

function emptyToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}
