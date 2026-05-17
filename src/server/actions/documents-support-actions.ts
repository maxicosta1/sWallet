"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOperations, canWriteProjects } from "@/lib/permissions";

const documentSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  name: z.string().min(2),
  type: z.enum(["brief", "contrato", "factura", "propuesta", "recurso", "otro"]),
  link: z.string().optional(),
  tags: z.string().optional(),
  description: z.string().optional()
});

const supportPlanSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  url: z.string().optional(),
  domain: z.string().min(2),
  hosting: z.string().min(2),
  domainRenewal: z.string().optional(),
  hostingRenewal: z.string().optional(),
  plan: z.string().min(2),
  monthlyPrice: z.coerce.number().min(0),
  currency: z.enum(["ARS", "USD"]),
  status: z.string().min(2),
  notes: z.string().optional()
});

export async function createDocumentAction(formData: FormData) {
  await assertProjectWrite();
  const data = documentSchema.parse(Object.fromEntries(formData));
  await prisma.document.create({
    data: {
      ...emptyToNull(data),
      link: data.link?.trim() || "#"
    }
  });
  revalidateDocumentsSupport();
}

export async function createSupportPlanAction(formData: FormData) {
  await assertOperationsWrite();
  const data = supportPlanSchema.parse(Object.fromEntries(formData));
  await prisma.supportPlan.create({
    data: {
      ...emptyToNull(data),
      url: data.url?.trim() || "#",
      monthlyPrice: data.monthlyPrice,
      domainRenewal: data.domainRenewal ? new Date(data.domainRenewal) : null,
      hostingRenewal: data.hostingRenewal ? new Date(data.hostingRenewal) : null
    }
  });
  revalidateDocumentsSupport();
}

async function assertProjectWrite() {
  const session = await auth();
  if (!canWriteProjects(session?.user.role) && !canWriteOperations(session?.user.role)) {
    throw new Error("No tenes permisos para modificar documentos.");
  }
}

async function assertOperationsWrite() {
  const session = await auth();
  if (!canWriteOperations(session?.user.role)) {
    throw new Error("No tenes permisos para modificar soporte.");
  }
}

function revalidateDocumentsSupport() {
  ["/documents", "/support", "/projects", "/clients", "/agenda", "/alerts", "/dashboard"].forEach((path) => revalidatePath(path));
}

function emptyToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}
