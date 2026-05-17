"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canWriteProjects } from "@/lib/permissions";

const teamMemberSchema = z.object({
  name: z.string().min(2),
  lastName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().min(2),
  status: z.enum(["activo", "inactivo", "invitado"]).default("activo"),
  focus: z.string().optional(),
  responsibilities: z.string().optional(),
  notes: z.string().optional()
});

const taskSchema = z.object({
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  responsibleTeamMemberId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  priority: z.enum(["baja", "media", "alta", "urgente"]).default("media"),
  status: z.enum(["pendiente", "en_proceso", "en_revision", "bloqueada", "completada", "cancelada"]).default("pendiente"),
  dueDate: z.string().optional(),
  comments: z.string().optional()
});

const timeEntrySchema = z.object({
  teamMemberId: z.string().min(1),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  date: z.string().min(1),
  hours: z.coerce.number().positive(),
  comment: z.string().optional()
});

export async function createTeamMemberAction(formData: FormData) {
  await assertOperationsWrite();
  const data = teamMemberSchema.parse(Object.fromEntries(formData));
  await prisma.teamMember.create({
    data: emptyToNull(data)
  });
  revalidateOperations();
}

export async function createTaskAction(formData: FormData) {
  await assertOperationsWrite();
  const data = taskSchema.parse(Object.fromEntries(formData));
  const task = await prisma.adminTask.create({
    data: {
      ...emptyToNull(data),
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }
  });

  if (task.projectId) {
    await syncProjectProgress(task.projectId);
  }
  revalidateOperations();
}

export async function updateTaskStatusAction(formData: FormData) {
  await assertOperationsWrite();
  const id = z.string().min(1).parse(formData.get("taskId"));
  const status = z.enum(["pendiente", "en_proceso", "en_revision", "bloqueada", "completada", "cancelada"]).parse(formData.get("status"));

  const task = await prisma.adminTask.update({
    where: { id },
    data: { status },
    select: { projectId: true }
  });

  if (task.projectId) {
    await syncProjectProgress(task.projectId);
  }
  revalidateOperations();
}

export async function createTimeEntryAction(formData: FormData) {
  await assertOperationsWrite();
  const data = timeEntrySchema.parse(Object.fromEntries(formData));
  await prisma.timeEntry.create({
    data: {
      ...emptyToNull(data),
      date: new Date(data.date),
      hours: data.hours
    }
  });
  revalidateOperations();
}

async function syncProjectProgress(projectId: string) {
  const tasks = await prisma.adminTask.findMany({
    where: { projectId, deletedAt: null, status: { not: "cancelada" } },
    select: { status: true }
  });

  if (!tasks.length) return;

  const completed = tasks.filter((task) => task.status === "completada").length;
  const progress = Math.round((completed / tasks.length) * 100);
  await prisma.project.update({
    where: { id: projectId },
    data: {
      progress,
      status: progress >= 100 ? "finalizado" : undefined
    }
  });
}

async function assertOperationsWrite() {
  const session = await auth();
  if (!canWriteProjects(session?.user.role)) {
    throw new Error("No tenes permisos para modificar operaciones.");
  }
}

function revalidateOperations() {
  ["/tasks", "/team", "/projects", "/dashboard", "/reports"].forEach((path) => revalidatePath(path));
}

function emptyToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])) as T;
}
