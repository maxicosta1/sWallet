import type { Role } from "@prisma/client";

const roleRank: Record<Role, number> = {
  solo_lectura: 0,
  desarrollador: 1,
  finanzas: 2,
  admin: 3
};

export function canWriteFinance(role?: Role | null) {
  if (!role) return false;
  return role === "admin" || role === "finanzas";
}

export function canWriteProjects(role?: Role | null) {
  if (!role) return false;
  return role === "admin" || role === "desarrollador";
}

export function canAdmin(role?: Role | null) {
  return role === "admin";
}

export function hasRoleAtLeast(role: Role | undefined | null, minimum: Role) {
  if (!role) return false;
  return roleRank[role] >= roleRank[minimum];
}
