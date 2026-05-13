import type { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { conflict, notFound } from "../../shared/errors.js";
import { paginationMeta } from "../../shared/pagination.js";
import { serializeClient } from "../../shared/serializers.js";
import type { ClientStatus, Currency, Priority } from "../../types/domain.js";

type ClientListInput = {
  page: number;
  pageSize: number;
  search?: string;
  status?: ClientStatus;
  priority?: Priority;
  currency?: Currency;
};

type CreateClientInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  socials?: string;
  website?: string;
  service: string;
  agreedPrice: number;
  currency: Currency;
  status: ClientStatus;
  priority: Priority;
  firstContact?: Date;
  lastContact?: Date;
  startDate?: Date;
  observations?: string;
};

type UpdateClientInput = Partial<Omit<CreateClientInput, "address" | "socials" | "website" | "firstContact" | "lastContact" | "startDate" | "observations">> & {
  address?: string | null;
  socials?: string | null;
  website?: string | null;
  firstContact?: Date | null;
  lastContact?: Date | null;
  startDate?: Date | null;
  observations?: string | null;
};

const clientInclude = {
  user: { select: { id: true, name: true, email: true } },
  _count: { select: { projects: true, invoices: true, payments: true, tasks: true } }
} satisfies Prisma.ClientInclude;

export async function listClients(input: ClientListInput) {
  const insensitive = "insensitive" as const;
  const where: Prisma.ClientWhereInput = {
    deletedAt: null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: insensitive } },
            { company: { contains: input.search, mode: insensitive } },
            { email: { contains: input.search, mode: insensitive } },
            { service: { contains: input.search, mode: insensitive } }
          ]
        }
      : {})
  };

  const [total, clients] = await prisma.$transaction([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      include: clientInclude,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize
    })
  ]);

  return {
    clients: clients.map(serializeClient),
    meta: paginationMeta(total, input.page, input.pageSize)
  };
}

export async function getClient(id: string) {
  const client = await prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: clientInclude
  });

  if (!client) throw notFound("Client not found.");
  return serializeClient(client);
}

export async function createClient(input: CreateClientInput, userId: string) {
  await assertClientUnique(input.email);

  const client = await prisma.client.create({
    data: {
      ...input,
      userId,
      agreedPrice: input.agreedPrice.toString()
    },
    include: clientInclude
  });

  await prisma.activityLog.create({
    data: {
      userId,
      clientId: client.id,
      entityType: "client",
      entityId: client.id,
      type: "creado",
      title: "Cliente creado",
      body: client.company
    }
  });

  return serializeClient(client);
}

export async function updateClient(id: string, input: UpdateClientInput, userId: string) {
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw notFound("Client not found.");

  if (input.email && input.email !== existing.email) {
    await assertClientUnique(input.email, id);
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...input,
      agreedPrice: input.agreedPrice === undefined ? undefined : input.agreedPrice.toString()
    },
    include: clientInclude
  });

  await prisma.activityLog.create({
    data: {
      userId,
      clientId: client.id,
      entityType: "client",
      entityId: client.id,
      type: "actualizado",
      title: "Cliente actualizado",
      body: client.company
    }
  });

  return serializeClient(client);
}

export async function deleteClient(id: string, userId: string) {
  const existing = await prisma.client.findFirst({ where: { id, deletedAt: null } });

  if (!existing) throw notFound("Client not found.");

  const [projectsCount, invoicesCount, paymentsCount] = await prisma.$transaction([
    prisma.project.count({ where: { clientId: id, deletedAt: null } }),
    prisma.invoice.count({ where: { clientId: id, deletedAt: null } }),
    prisma.payment.count({ where: { clientId: id, deletedAt: null } })
  ]);

  if (projectsCount > 0 || invoicesCount > 0 || paymentsCount > 0) {
    throw conflict("Client has related projects, invoices or payments. Archive related records first.");
  }

  await prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await prisma.activityLog.create({
    data: {
      userId,
      clientId: id,
      entityType: "client",
      entityId: id,
      type: "eliminado",
      title: "Cliente archivado",
      body: existing.company
    }
  });
}

async function assertClientUnique(email: string, id?: string) {
  const existing = await prisma.client.findFirst({
    where: {
      email,
      deletedAt: null,
      ...(id ? { id: { not: id } } : {})
    }
  });

  if (existing) throw conflict("Client email already exists.");
}
