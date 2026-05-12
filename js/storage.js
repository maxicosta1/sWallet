import { state, STORAGE_KEY } from "./state.js";

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.users = parsed.users || [];
    state.session = parsed.session || null;
    state.clients = parsed.clients || [];
    state.projects = parsed.projects || [];
    state.invoices = parsed.invoices || [];
    state.payments = parsed.payments || [];
    state.movements = parsed.movements || [];
    state.subscriptions = parsed.subscriptions || [];
    state.exchangeRate = Number(parsed.exchangeRate) || 1200;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    users: state.users,
    session: state.session,
    clients: state.clients,
    projects: state.projects,
    invoices: state.invoices,
    payments: state.payments,
    movements: state.movements,
    subscriptions: state.subscriptions,
    exchangeRate: state.exchangeRate
  }));
}

export function resetStorage() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
