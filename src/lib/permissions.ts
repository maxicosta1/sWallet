import type { ModuleAccess } from "@/config/modules";
import type { Role } from "@prisma/client";

const roleRank: Record<string, number> = {
  cliente: -1,
  solo_lectura: 0,
  marketing: 1,
  desarrollador: 1,
  project_manager: 2,
  finanzas: 2,
  admin: 3
};

const moduleAccessByRole: Record<string, ModuleAccess[]> = {
  admin: ["dashboard", "sales", "projects", "finance", "operations", "reports", "settings", "client_portal"],
  finanzas: ["dashboard", "sales", "finance", "reports", "settings"],
  project_manager: ["dashboard", "sales", "projects", "operations", "reports", "client_portal"],
  desarrollador: ["dashboard", "projects", "operations", "reports", "client_portal"],
  marketing: ["dashboard", "sales", "operations", "reports"],
  solo_lectura: ["dashboard", "sales", "projects", "finance", "operations", "reports"],
  cliente: ["client_portal"]
};

export function canAccessModule(role: string | null | undefined, access: ModuleAccess) {
  if (!role) return false;
  return moduleAccessByRole[role]?.includes(access) ?? false;
}

export function canWriteFinance(role?: string | null) {
  if (!role) return false;
  return role === "admin" || role === "finanzas";
}

export function canWriteProjects(role?: string | null) {
  if (!role) return false;
  return role === "admin" || role === "desarrollador" || role === "project_manager";
}

export function canAdmin(role?: string | null) {
  return role === "admin";
}

export function hasRoleAtLeast(role: Role | undefined | null, minimum: Role) {
  if (!role) return false;
  return roleRank[role] >= roleRank[minimum];
}
