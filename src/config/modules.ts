export type ModuleGroupKey = "home" | "sales" | "projects" | "finance" | "operations";

export type ModuleAccess =
  | "dashboard"
  | "sales"
  | "projects"
  | "finance"
  | "operations"
  | "reports"
  | "settings"
  | "client_portal";

export type ModuleStatus = "active" | "foundation" | "planned";

export type AppModule = {
  key: string;
  href: string;
  label: string;
  shortLabel: string;
  group: ModuleGroupKey;
  access: ModuleAccess;
  status: ModuleStatus;
  description: string;
  legacySection?: string;
};

export const moduleGroups: Array<{ key: ModuleGroupKey; label: string }> = [
  { key: "home", label: "Inicio" },
  { key: "sales", label: "Clientes y ventas" },
  { key: "projects", label: "Proyectos" },
  { key: "finance", label: "Finanzas" },
  { key: "operations", label: "Operacion interna" }
];

export const appModules: AppModule[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "DB",
    group: "home",
    access: "dashboard",
    status: "active",
    description: "Resumen ejecutivo de caja, deuda, proyectos, alertas y actividad."
  },
  {
    key: "agenda",
    href: "/agenda",
    label: "Agenda",
    shortLabel: "AG",
    group: "home",
    access: "operations",
    status: "planned",
    description: "Calendario operativo con vencimientos, entregas, reuniones y proximas acciones.",
    legacySection: "Calendario"
  },
  {
    key: "alerts",
    href: "/alerts",
    label: "Alertas",
    shortLabel: "AL",
    group: "home",
    access: "operations",
    status: "planned",
    description: "Senales inteligentes para facturas vencidas, clientes sin contacto y proyectos en riesgo."
  },
  {
    key: "clients",
    href: "/clients",
    label: "Clientes",
    shortLabel: "CL",
    group: "sales",
    access: "sales",
    status: "active",
    description: "Ficha comercial, financiera y operativa de cada cliente."
  },
  {
    key: "crm",
    href: "/crm",
    label: "CRM / Ventas",
    shortLabel: "CRM",
    group: "sales",
    access: "sales",
    status: "planned",
    description: "Pipeline comercial desde lead hasta venta cerrada.",
    legacySection: "CRM / Ventas"
  },
  {
    key: "budgets",
    href: "/budgets",
    label: "Presupuestos",
    shortLabel: "PR",
    group: "sales",
    access: "sales",
    status: "planned",
    description: "Propuestas comerciales con items, condiciones y conversion a proyecto o factura.",
    legacySection: "Presupuestos"
  },
  {
    key: "client-portal",
    href: "/client-portal",
    label: "Portal Cliente",
    shortLabel: "PC",
    group: "sales",
    access: "client_portal",
    status: "planned",
    description: "Vista limitada y segura para compartir avance, documentos, facturas y aprobaciones.",
    legacySection: "Portal Cliente"
  },
  {
    key: "projects",
    href: "/projects",
    label: "Proyectos",
    shortLabel: "PY",
    group: "projects",
    access: "projects",
    status: "active",
    description: "Delivery conectado con cliente, tareas, equipo, dinero, riesgo y rentabilidad."
  },
  {
    key: "tasks",
    href: "/tasks",
    label: "Tareas",
    shortLabel: "TA",
    group: "projects",
    access: "projects",
    status: "planned",
    description: "Kanban de trabajo con responsables del equipo, fechas, subtareas y horas.",
    legacySection: "Tareas"
  },
  {
    key: "documents",
    href: "/documents",
    label: "Documentos",
    shortLabel: "DO",
    group: "projects",
    access: "projects",
    status: "planned",
    description: "Biblioteca y plantillas imprimibles asociadas a clientes y proyectos.",
    legacySection: "Documentos"
  },
  {
    key: "support",
    href: "/support",
    label: "Soporte / Mantenimiento",
    shortLabel: "SO",
    group: "projects",
    access: "projects",
    status: "planned",
    description: "Mantenimiento post-entrega, dominios, hosting, SSL y renovaciones.",
    legacySection: "Soporte"
  },
  {
    key: "finance",
    href: "/finance",
    label: "Finanzas",
    shortLabel: "FI",
    group: "finance",
    access: "finance",
    status: "foundation",
    description: "Resumen financiero general basado en caja real, deuda y proyeccion de cobros."
  },
  {
    key: "billing",
    href: "/billing",
    label: "Facturacion",
    shortLabel: "FA",
    group: "finance",
    access: "finance",
    status: "planned",
    description: "Facturas reales con items, vencimientos, saldo pendiente y PDF imprimible.",
    legacySection: "Facturacion"
  },
  {
    key: "payments",
    href: "/payments",
    label: "Pagos",
    shortLabel: "PA",
    group: "finance",
    access: "finance",
    status: "active",
    description: "Cobros recibidos o pendientes, incluyendo pagos parciales."
  },
  {
    key: "movements",
    href: "/movements",
    label: "Movimientos",
    shortLabel: "MO",
    group: "finance",
    access: "finance",
    status: "active",
    description: "Caja real: ingresos y egresos confirmados."
  },
  {
    key: "subscriptions",
    href: "/subscriptions",
    label: "Suscripciones",
    shortLabel: "SU",
    group: "finance",
    access: "finance",
    status: "active",
    description: "Servicios recurrentes, costos y renovaciones."
  },
  {
    key: "reports",
    href: "/reports",
    label: "Reportes",
    shortLabel: "RE",
    group: "finance",
    access: "reports",
    status: "active",
    description: "Analisis de ingresos, gastos, rentabilidad, deuda y crecimiento."
  },
  {
    key: "team",
    href: "/team",
    label: "Equipo",
    shortLabel: "EQ",
    group: "operations",
    access: "operations",
    status: "planned",
    description: "Personas, responsabilidades, asignaciones, horas y rendimiento.",
    legacySection: "Equipo"
  },
  {
    key: "goals",
    href: "/goals",
    label: "Metas",
    shortLabel: "ME",
    group: "operations",
    access: "operations",
    status: "planned",
    description: "Objetivos internos por periodo, progreso y seguimiento.",
    legacySection: "Metas"
  },
  {
    key: "marketing",
    href: "/marketing",
    label: "Marketing",
    shortLabel: "MK",
    group: "operations",
    access: "operations",
    status: "planned",
    description: "Campanas conectadas con oportunidades, reuniones, presupuestos y ventas.",
    legacySection: "Marketing"
  },
  {
    key: "admin",
    href: "/admin",
    label: "Administracion",
    shortLabel: "AD",
    group: "operations",
    access: "operations",
    status: "planned",
    description: "Pedidos, notas internas, proximas acciones y control administrativo.",
    legacySection: "Administracion"
  },
  {
    key: "settings",
    href: "/settings",
    label: "Configuracion",
    shortLabel: "CF",
    group: "operations",
    access: "settings",
    status: "active",
    description: "Monedas, roles, empresa, permisos y ajustes de plataforma."
  }
];

export const protectedPaths = appModules.map((module) => module.href);

export function modulesByGroup(group: ModuleGroupKey) {
  return appModules.filter((module) => module.group === group);
}

export function findModuleByHref(pathname: string) {
  return appModules.find((module) => pathname === module.href || pathname.startsWith(`${module.href}/`));
}
