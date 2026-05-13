import { SCHEMA_VERSION, state, STORAGE_KEY } from "./state.js";

const persistedArrays = [
  "users",
  "clients",
  "projects",
  "invoices",
  "payments",
  "movements",
  "subscriptions",
  "tasks",
  "goals",
  "requests",
  "notes",
  "actions",
  "opportunities",
  "budgets",
  "calendarEvents",
  "documents",
  "supportPlans",
  "teamMembers",
  "marketingCampaigns",
  "clientPortalItems",
  "activityLogs"
];

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = migrateSnapshot(JSON.parse(saved));
    state.schemaVersion = parsed.schemaVersion;
    state.savedAt = parsed.savedAt || "";
    state.session = parsed.session || null;
    persistedArrays.forEach((key) => {
      state[key] = Array.isArray(parsed[key]) ? parsed[key] : [];
    });
    state.companySettings = { ...state.companySettings, ...(parsed.companySettings || {}) };
    state.exchangeRate = Number(parsed.exchangeRate) || 1200;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function saveState() {
  state.savedAt = new Date().toISOString();
  const payload = persistedArrays.reduce((acc, key) => {
    acc[key] = normalizeCollection(state[key]);
    return acc;
  }, {
    schemaVersion: SCHEMA_VERSION,
    savedAt: state.savedAt,
    session: state.session,
    companySettings: state.companySettings,
    exchangeRate: state.exchangeRate
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function exportSnapshot() {
  return localStorage.getItem(STORAGE_KEY) || JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    session: state.session,
    companySettings: state.companySettings,
    exchangeRate: state.exchangeRate
  });
}

export function importSnapshot(json) {
  const parsed = migrateSnapshot(JSON.parse(json));
  if (!parsed || typeof parsed !== "object") throw new Error("Archivo invalido.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
}

export function resetStorage() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

export function migrateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new Error("Archivo invalido.");
  const migrated = {
    ...snapshot,
    schemaVersion: SCHEMA_VERSION,
    savedAt: snapshot.savedAt || new Date().toISOString(),
    session: snapshot.session || null,
    companySettings: snapshot.companySettings || {},
    exchangeRate: Number(snapshot.exchangeRate) || 1200
  };

  persistedArrays.forEach((key) => {
    migrated[key] = normalizeCollection(snapshot[key]);
  });

  migrated.clients = migrated.clients.map(migrateClient);
  migrated.projects = migrated.projects.map(migrateProject);
  migrated.invoices = migrated.invoices.map(migrateInvoice);
  migrated.payments = migrated.payments.map(migratePayment);
  migrated.tasks = migrated.tasks.map(migrateTask);
  migrated.goals = migrated.goals.map(migrateGoal);
  migrated.users = migrated.users.map(migrateUser);

  return migrated;
}

function normalizeCollection(collection) {
  return Array.isArray(collection) ? collection.map(normalizeRecord) : [];
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") return {};
  const now = new Date().toISOString();
  return {
    createdAt: record.createdAt || now,
    updatedAt: record.updatedAt || record.createdAt || now,
    ...record
  };
}

function migrateClient(client) {
  const statusMap = {
    activo: "cliente_activo",
    pendiente: "en_negociacion",
    finalizado: "proyecto_finalizado"
  };
  return {
    priority: "media",
    firstContact: client.firstContact || client.startDate || "",
    lastContact: client.lastContact || "",
    observations: client.observations || "",
    ...client,
    status: statusMap[client.status] || client.status || "lead"
  };
}

function migrateProject(project) {
  const statusMap = {
    pendiente: "planificacion",
    en_progreso: "en_desarrollo",
    revision: "en_revision",
    entregado: "finalizado"
  };
  return {
    paid: 0,
    expenses: 0,
    progress: 0,
    responsible: "",
    technologies: "",
    links: "",
    notes: "",
    tasks: [],
    ...project,
    status: statusMap[project.status] || project.status || "planificacion"
  };
}

function migrateInvoice(invoice) {
  return {
    projectId: "",
    notes: "",
    ...invoice,
    status: invoice.status || "pendiente"
  };
}

function migratePayment(payment) {
  return {
    invoiceId: "",
    projectId: "",
    notes: "",
    ...payment,
    status: payment.status || "pagado"
  };
}

function migrateTask(task) {
  return {
    projectId: "",
    checklist: [],
    comments: "",
    ...task,
    status: task.status || "pendiente",
    priority: task.priority || "media"
  };
}

function migrateGoal(goal) {
  return {
    current: 0,
    status: "en_progreso",
    priority: "media",
    ...goal
  };
}

function migrateUser(user) {
  const username = user.username || String(user.email || user.name || "usuario").split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, ".");
  const status = user.status === "active" ? "activo" : user.status;
  return {
    username,
    status: "activo",
    permissions: defaultPermissionsForRole(user.role),
    avatar: "",
    phone: "",
    area: "",
    notes: "",
    ...user,
    status: status || "activo"
  };
}

function defaultPermissionsForRole(role) {
  if (role === "admin") return ["clients", "finance", "projects", "reports", "settings", "write", "delete"];
  if (role === "finanzas") return ["clients", "finance", "reports", "write"];
  return ["reports"];
}
