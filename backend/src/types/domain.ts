export const domainModules = [
  "auth",
  "users",
  "clients",
  "projects",
  "billing",
  "payments",
  "movements",
  "tasks",
  "goals",
  "dashboard",
  "settings",
  "audit"
] as const;

export type DomainModule = (typeof domainModules)[number];

export const roles = ["admin", "finanzas", "desarrollador", "solo_lectura"] as const;
export type Role = (typeof roles)[number];

export const currencies = ["ARS", "USD"] as const;
export type Currency = (typeof currencies)[number];

export const clientStatuses = [
  "lead",
  "interesado",
  "activo",
  "cliente_activo",
  "en_negociacion",
  "en_desarrollo",
  "mantenimiento",
  "proyecto_finalizado",
  "finalizado"
] as const;
export type ClientStatus = (typeof clientStatuses)[number];

export const priorities = ["baja", "media", "alta", "urgente"] as const;
export type Priority = (typeof priorities)[number];

export const projectStatuses = [
  "pendiente",
  "planificacion",
  "en_progreso",
  "en_desarrollo",
  "revision",
  "en_revision",
  "entregado",
  "pausado",
  "finalizado"
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
