import { prisma } from "../../db/prisma.js";
import { conflict } from "../../shared/errors.js";
import { hashPassword } from "../../shared/passwords.js";
import { serializeUser } from "../../shared/users.js";
import type { Role } from "../../types/domain.js";

type CreateUserInput = {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: Role;
  status: "activo" | "inactivo" | "invitado";
};

export async function listUsers() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return users.map(serializeUser);
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        ...(input.username ? [{ username: input.username }] : [])
      ]
    }
  });

  if (existing) throw conflict("User email or username already exists.");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      username: input.username,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: input.status,
      permissions: permissionsForRole(input.role)
    }
  });

  return serializeUser(user);
}

function permissionsForRole(role: Role) {
  if (role === "admin") return ["clients", "finance", "projects", "reports", "settings", "write", "delete"];
  if (role === "finanzas") return ["clients", "finance", "reports", "write"];
  if (role === "desarrollador") return ["clients", "projects", "reports", "write"];
  return ["reports"];
}
