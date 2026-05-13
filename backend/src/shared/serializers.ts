type DecimalLike = {
  toString(): string;
};

type UserLite = {
  id: string;
  name: string | null;
  email: string;
};

type ClientLite = {
  id: string;
  name: string;
  company: string;
  email: string;
};

export type ClientRecord = {
  id: string;
  userId: string | null;
  legacyId: string | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string | null;
  socials: string | null;
  website: string | null;
  service: string;
  agreedPrice: DecimalLike;
  currency: string;
  status: string;
  priority: string;
  firstContact: Date | null;
  lastContact: Date | null;
  startDate: Date | null;
  observations: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: UserLite | null;
  _count?: {
    projects?: number;
    invoices?: number;
    payments?: number;
    tasks?: number;
  };
};

export type ProjectRecord = {
  id: string;
  userId: string | null;
  clientId: string;
  legacyId: string | null;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: DecimalLike;
  paid: DecimalLike;
  expenses: DecimalLike;
  currency: string;
  responsible: string | null;
  technologies: string | null;
  links: string | null;
  notes: string | null;
  startsAt: Date | null;
  dueAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  client?: ClientLite;
  user?: UserLite | null;
  _count?: {
    invoices?: number;
    payments?: number;
    adminTasks?: number;
    tasks?: number;
  };
};

export function serializeClient(client: ClientRecord) {
  return {
    id: client.id,
    userId: client.userId,
    legacyId: client.legacyId,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    socials: client.socials,
    website: client.website,
    service: client.service,
    agreedPrice: Number(client.agreedPrice.toString()),
    currency: client.currency,
    status: client.status,
    priority: client.priority,
    firstContact: client.firstContact?.toISOString() ?? null,
    lastContact: client.lastContact?.toISOString() ?? null,
    startDate: client.startDate?.toISOString() ?? null,
    observations: client.observations,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    user: client.user ? serializeLiteUser(client.user) : null,
    counts: client._count ?? {}
  };
}

export function serializeProject(project: ProjectRecord) {
  return {
    id: project.id,
    userId: project.userId,
    clientId: project.clientId,
    legacyId: project.legacyId,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    budget: Number(project.budget.toString()),
    paid: Number(project.paid.toString()),
    expenses: Number(project.expenses.toString()),
    currency: project.currency,
    responsible: project.responsible,
    technologies: project.technologies,
    links: project.links,
    notes: project.notes,
    startsAt: project.startsAt?.toISOString() ?? null,
    dueAt: project.dueAt?.toISOString() ?? null,
    deliveredAt: project.deliveredAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    client: project.client
      ? {
          id: project.client.id,
          name: project.client.name,
          company: project.client.company,
          email: project.client.email
        }
      : null,
    user: project.user ? serializeLiteUser(project.user) : null,
    counts: project._count ?? {}
  };
}

function serializeLiteUser(user: UserLite) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}
