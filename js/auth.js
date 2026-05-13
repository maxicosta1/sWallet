import { createRecord, seedDemoData, state } from "./state.js";
import { saveState } from "./storage.js";

export function mockHash(value) {
  return btoa(unescape(encodeURIComponent(String(value))));
}

export function hasUsers() {
  return state.users.length > 0;
}

export function currentUser() {
  if (!state.session?.userId) return null;
  return state.users.find((user) => user.id === state.session.userId) || null;
}

export function isAuthenticated() {
  return Boolean(currentUser());
}

export function canWrite() {
  const user = currentUser();
  return user?.role === "admin" || user?.role === "finanzas" || user?.permissions?.includes("write");
}

export function canDelete() {
  const user = currentUser();
  return user?.role === "admin" || user?.permissions?.includes("delete");
}

export function registerInitialUser({ name, email, password, username = "admin" }) {
  if (hasUsers()) throw new Error("El registro inicial ya fue creado.");
  const user = createRecord({
    name,
    username,
    email: email.toLowerCase(),
    passwordHashMock: mockHash(password),
    role: "admin",
    status: "activo",
    permissions: ["clients", "finance", "projects", "reports", "settings", "write", "delete"],
    avatar: "",
    phone: "",
    area: "Administracion",
    notes: ""
  });

  state.users.push(user);
  state.session = { userId: user.id, createdAt: new Date().toISOString() };

  const hasExistingData = state.clients.length || state.projects.length || state.invoices.length || state.payments.length || state.tasks.length || state.goals.length || state.opportunities.length || state.budgets.length;
  if (hasExistingData) {
    attachUserToExistingData(user.id);
  } else {
    Object.assign(state, seedDemoData(user.id));
    state.users = [user];
    state.session = { userId: user.id, createdAt: new Date().toISOString() };
  }

  saveState();
  return user;
}

export function login({ email, password }) {
  const credential = email.toLowerCase();
  const user = state.users.find((item) => item.email === credential || String(item.username || "").toLowerCase() === credential);
  if (!user || user.passwordHashMock !== mockHash(password) || user.status === "inactivo") {
    throw new Error("Email o contrasena incorrectos.");
  }
  state.session = { userId: user.id, createdAt: new Date().toISOString() };
  saveState();
  return user;
}

export function logout() {
  state.session = null;
  saveState();
}

function attachUserToExistingData(userId) {
  ["clients", "projects", "invoices", "payments", "movements", "subscriptions", "tasks", "goals", "requests", "notes", "actions", "opportunities", "budgets", "calendarEvents", "documents", "supportPlans", "teamMembers", "marketingCampaigns", "clientPortalItems", "activityLogs"].forEach((key) => {
    state[key] = state[key].map((item) => ({ ...item, userId: item.userId || userId }));
  });

  if (!state.invoices.length && state.payments.length) {
    state.invoices = state.payments.map((payment, index) => createRecord({
      userId,
      clientId: payment.clientId,
      projectId: payment.projectId || "",
      number: `F-${String(index + 1).padStart(4, "0")}`,
      amount: payment.amount,
      currency: payment.currency,
      issueDate: payment.date,
      dueDate: payment.dueDate || payment.date,
      status: payment.status === "pagado" ? "pagada" : payment.status === "vencido" ? "vencida" : "pendiente",
      notes: payment.notes || "Factura migrada desde pagos existentes."
    }));
    state.payments = state.payments.map((payment, index) => ({
      ...payment,
      invoiceId: state.invoices[index]?.id || payment.invoiceId || ""
    }));
  }
}
