import { state, STORAGE_KEY } from "./state.js";

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
  "clientPortalItems"
];

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.session = parsed.session || null;
    persistedArrays.forEach((key) => {
      state[key] = Array.isArray(parsed[key]) ? parsed[key] : [];
    });
    state.exchangeRate = Number(parsed.exchangeRate) || 1200;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function saveState() {
  const payload = persistedArrays.reduce((acc, key) => {
    acc[key] = state[key];
    return acc;
  }, {
    session: state.session,
    exchangeRate: state.exchangeRate
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function resetStorage() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
