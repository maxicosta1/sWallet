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
  await assertNoDependents(data.type, data.id);
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

async function assertNoDependents(type: z.infer<typeof trashEntitySchema>["type"], id: string) {
  const dependents = await dependentCount(type, id);
  if (dependents > 0) {
    throw new Error("No se puede eliminar definitivamente porque todavia tiene datos asociados. Restauralo y resolvelos primero.");
  }
}

async function dependentCount(type: z.infer<typeof trashEntitySchema>["type"], id: string) {
  switch (type) {
    case "client": {
      const counts = await Promise.all([
        prisma.project.count({ where: { clientId: id } }),
        prisma.invoice.count({ where: { clientId: id } }),
        prisma.payment.count({ where: { clientId: id } }),
        prisma.movement.count({ where: { clientId: id } }),
        prisma.adminTask.count({ where: { clientId: id } }),
        prisma.budget.count({ where: { clientId: id } }),
        prisma.document.count({ where: { clientId: id } }),
        prisma.supportPlan.count({ where: { clientId: id } }),
        prisma.clientPortalItem.count({ where: { clientId: id } }),
        prisma.opportunity.count({ where: { clientId: id } }),
        prisma.clientNote.count({ where: { clientId: id } }),
        prisma.attachment.count({ where: { clientId: id } })
      ]);
      return sum(counts);
    }
    case "project": {
      const counts = await Promise.all([
        prisma.invoice.count({ where: { projectId: id } }),
        prisma.payment.count({ where: { projectId: id } }),
        prisma.movement.count({ where: { projectId: id } }),
        prisma.adminTask.count({ where: { projectId: id } }),
        prisma.budget.count({ where: { projectId: id } }),
        prisma.document.count({ where: { projectId: id } }),
        prisma.supportPlan.count({ where: { projectId: id } }),
        prisma.timeEntry.count({ where: { projectId: id } }),
        prisma.attachment.count({ where: { projectId: id } })
      ]);
      return sum(counts);
    }
    case "invoice": {
      const counts = await Promise.all([
        prisma.payment.count({ where: { invoiceId: id } }),
        prisma.movement.count({ where: { invoiceId: id } }),
        prisma.invoiceItem.count({ where: { invoiceId: id } }),
        prisma.attachment.count({ where: { invoiceId: id } })
      ]);
      return sum(counts);
    }
    case "payment": {
      const counts = await Promise.all([
        prisma.movement.count({ where: { paymentId: id } }),
        prisma.paymentInstallment.count({ where: { paymentId: id } }),
        prisma.attachment.count({ where: { paymentId: id } })
      ]);
      return sum(counts);
    }
    case "budget": {
      const counts = await Promise.all([
        prisma.budgetItem.count({ where: { budgetId: id } }),
        prisma.invoice.count({ where: { budgetId: id } }),
        prisma.payment.count({ where: { budgetId: id } }),
        prisma.project.count({ where: { approvedBudgetId: id } })
      ]);
      return sum(counts);
    }
    case "movement": {
      return prisma.attachment.count({ where: { movementId: id } });
    }
    case "document":
      return 0;
  }
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
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
