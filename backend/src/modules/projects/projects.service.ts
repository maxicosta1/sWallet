import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { badRequest, conflict, notFound } from "../../shared/errors.js";
import { paginationMeta } from "../../shared/pagination.js";
import { serializeProject } from "../../shared/serializers.js";
import type { Currency, ProjectStatus } from "../../types/domain.js";

type ProjectListInput = {
  page: number;
  pageSize: number;
  search?: string;
  clientId?: string;
  status?: ProjectStatus;
  currency?: Currency;
  responsible?: string;
};

type CreateProjectInput = {
  clientId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  paid: number;
  expenses: number;
  currency: Currency;
  responsible?: string;
  technologies?: string;
  links?: string;
  notes?: string;
  startsAt?: Date;
  dueAt?: Date;
  deliveredAt?: Date;
};

type UpdateProjectInput = Partial<Omit<CreateProjectInput, "description" | "responsible" | "technologies" | "links" | "notes" | "startsAt" | "dueAt" | "deliveredAt">> & {
  description?: string | null;
  responsible?: string | null;
  technologies?: string | null;
  links?: string | null;
  notes?: string | null;
  startsAt?: Date | null;
  dueAt?: Date | null;
  deliveredAt?: Date | null;
};

const projectInclude = {
  client: { select: { id: true, name: true, company: true, email: true } },
  user: { select: { id: true, name: true, email: true } },
  _count: { select: { invoices: true, payments: true, adminTasks: true, tasks: true } }
} satisfies Prisma.ProjectInclude;

export async function listProjects(input: ProjectListInput) {
  const insensitive = "insensitive" as const;
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(input.clientId ? { clientId: input.clientId } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.responsible ? { responsible: { contains: input.responsible, mode: insensitive } } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: insensitive } },
            { description: { contains: input.search, mode: insensitive } },
            { technologies: { contains: input.search, mode: insensitive } },
            { client: { company: { contains: input.search, mode: insensitive } } }
          ]
        }
      : {})
  };

  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    })
  ]);

  return {
    projects: projects.map(serializeProject),
    meta: paginationMeta(total, input.page, input.pageSize)
  };
}

export async function getProject(id: string) {
  const project = await prisma.project.findFirst({
    where: { id, deletedAt: null },
    include: projectInclude
  });

  if (!project) throw notFound("Project not found.");
  return serializeProject(project);
}

export async function createProject(input: CreateProjectInput, userId: string) {
  await assertActiveClient(input.clientId);
  await assertProjectUnique(input.clientId, input.name);
  assertProjectDates(input.startsAt, input.dueAt, input.deliveredAt);

  const project = await prisma.project.create({
    data: {
      ...input,
      userId,
      budget: input.budget.toString(),
      paid: input.paid.toString(),
      expenses: input.expenses.toString()
    },
    include: projectInclude
  });

  await prisma.activityLog.create({
    data: {
      userId,
      clientId: project.clientId,
      entityType: "project",
      entityId: project.id,
      type: "creado",
      title: "Proyecto creado",
      body: project.name
    }
  });

  return serializeProject(project);
}

export async function updateProject(id: string, input: UpdateProjectInput, userId: string) {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound("Project not found.");

  const clientId = input.clientId ?? existing.clientId;
  if (input.clientId) await assertActiveClient(input.clientId);
  if ((input.clientId && input.clientId !== existing.clientId) || (input.name && input.name !== existing.name)) {
    await assertProjectUnique(clientId, input.name ?? existing.name, id);
  }

  assertProjectDates(
    input.startsAt === undefined ? existing.startsAt : input.startsAt,
    input.dueAt === undefined ? existing.dueAt : input.dueAt,
    input.deliveredAt === undefined ? existing.deliveredAt : input.deliveredAt
  );

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...input,
      budget: input.budget === undefined ? undefined : input.budget.toString(),
      paid: input.paid === undefined ? undefined : input.paid.toString(),
      expenses: input.expenses === undefined ? undefined : input.expenses.toString()
    },
    include: projectInclude
  });

  await prisma.activityLog.create({
    data: {
      userId,
      clientId: project.clientId,
      entityType: "project",
      entityId: project.id,
      type: "actualizado",
      title: "Proyecto actualizado",
      body: project.name
    }
  });

  return serializeProject(project);
}

export async function deleteProject(id: string, userId: string) {
  const existing = await prisma.project.findFirst({ where: { id, deletedAt: null } });

  if (!existing) throw notFound("Project not found.");

  const [invoicesCount, paymentsCount] = await prisma.$transaction([
    prisma.invoice.count({ where: { projectId: id, deletedAt: null } }),
    prisma.payment.count({ where: { projectId: id, deletedAt: null } })
  ]);

  if (invoicesCount > 0 || paymentsCount > 0) {
    throw conflict("Project has related invoices or payments. Archive related records first.");
  }

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      clientId: existing.clientId,
      entityType: "project",
      entityId: id,
      type: "eliminado",
      title: "Proyecto archivado",
      body: existing.name
    }
  });
}

async function assertActiveClient(clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    select: { id: true }
  });

  if (!client) throw notFound("Client not found.");
}

async function assertProjectUnique(clientId: string, name: string, id?: string) {
  const existing = await prisma.project.findFirst({
    where: {
      clientId,
      name,
      deletedAt: null,
      ...(id ? { id: { not: id } } : {})
    }
  });

  if (existing) throw conflict("Project name already exists for this client.");
}

function assertProjectDates(startsAt?: Date | null, dueAt?: Date | null, deliveredAt?: Date | null) {
  if (startsAt && dueAt && startsAt > dueAt) throw badRequest("Project start date must be before due date.");
  if (startsAt && deliveredAt && startsAt > deliveredAt) throw badRequest("Project start date must be before delivery date.");
}
