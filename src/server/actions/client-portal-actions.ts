"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteOperations, canWriteProjects } from "@/lib/permissions";

const portalItemSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(2),
  type: z.string().min(2),
  status: z.enum(["visible", "oculto", "archivado"]).default("visible"),
  link: z.string().optional(),
  notes: z.string().optional()
});

export async function createClientPortalItemAction(formData: FormData) {
  await assertPortalWrite();
  const data = portalItemSchema.parse(Object.fromEntries(formData));
  await prisma.clientPortalItem.create({
    data: {
      ...emptyToNull(data)
    }
  });
  revalidatePortal();
}

async function assertPortalWrite() {
  const session = await auth();
  if (!canWriteProjects(session?.user.role) && !canWriteOperations(session?.user.role)) {
    throw new Error("No tenes permisos para modificar el portal cliente.");
  }
}

function revalidatePortal() {
  ["/client-portal", "/clients", "/documents", "/dashboard"].forEach((path) => revalidatePath(path));
}

function emptyToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}
