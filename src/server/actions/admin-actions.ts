"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAdmin } from "@/lib/permissions";

const trashEntitySchema = z.object({
  type: z.enum(["client", "project", "invoice", "payment", "document", "budget", "movement"]),
  id: z.string().min(1)
});

export async function restoreTrashItemAction(formData: FormData) {
  await assertAdmin();
  const data = trashEntitySchema.parse(Object.fromEntries(formData));
  await updateDeletedAt(data.type, data.id, null);
  revalidateAdmin();
}

export async function permanentlyDeleteTrashItemAction(formData: FormData) {
  await assertAdmin();
  const data = trashEntitySchema.parse(Object.fromEntries(formData));
  const confirm = z.string().parse(formData.get("confirm"));
  if (confirm !== "ELIMINAR") {
    throw new Error("Escribi ELIMINAR para confirmar la eliminacion definitiva.");
  }
  await deleteRecord(data.type, data.id);
  revalidateAdmin();
}

async function updateDeletedAt(type: z.infer<typeof trashEntitySchema>["type"], id: string, deletedAt: Date | null) {
  switch (type) {
    case "client":
      return prisma.client.update({ where: { id }, data: { deletedAt } });
    case "project":
      return prisma.project.update({ where: { id }, data: { deletedAt } });
    case "invoice":
      return prisma.invoice.update({ where: { id }, data: { deletedAt } });
    case "payment":
      return prisma.payment.update({ where: { id }, data: { deletedAt } });
    case "document":
      return prisma.document.update({ where: { id }, data: { deletedAt } });
    case "budget":
      return prisma.budget.update({ where: { id }, data: { deletedAt } });
    case "movement":
      return prisma.movement.update({ where: { id }, data: { deletedAt } });
  }
}

async function deleteRecord(type: z.infer<typeof trashEntitySchema>["type"], id: string) {
  switch (type) {
    case "client":
      return prisma.client.delete({ where: { id } });
    case "project":
      return prisma.project.delete({ where: { id } });
    case "invoice":
      return prisma.invoice.delete({ where: { id } });
    case "payment":
      return prisma.payment.delete({ where: { id } });
    case "document":
      return prisma.document.delete({ where: { id } });
    case "budget":
      return prisma.budget.delete({ where: { id } });
    case "movement":
      return prisma.movement.delete({ where: { id } });
  }
}

async function assertAdmin() {
  const session = await auth();
  if (!canAdmin(session?.user.role)) {
    throw new Error("Solo admin puede administrar la papelera.");
  }
}

function revalidateAdmin() {
  ["/admin", "/dashboard", "/clients", "/projects", "/billing", "/payments", "/movements", "/documents", "/reports"].forEach((path) => revalidatePath(path));
}
