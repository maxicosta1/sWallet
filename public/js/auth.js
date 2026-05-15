import { authService } from "./api/authService.js";
import { state } from "./state.js";
import { loadRemoteState, saveState } from "./storage.js";

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

export async function login({ credential, password }) {
  const session = await authService.login({ credential, password });
  setAuthenticatedUser(session.user);
  await loadApiCollections();
  saveState();
  return session.user;
}

export async function logout() {
  await authService.logout();
  clearAuthState();
  saveState();
}

export async function restoreSession() {
  try {
    const user = await authService.me();
    setAuthenticatedUser(user);
    await loadApiCollections();
  } catch {
    try {
      const session = await authService.refresh();
      if (!session?.user) {
        clearAuthState();
        return;
      }
      setAuthenticatedUser(session.user);
      await loadApiCollections();
    } catch {
      clearAuthState();
    }
  }
}

export async function loadApiCollections() {
  await loadRemoteState();
}

function setAuthenticatedUser(user) {
  const normalized = normalizeUser(user);
  state.users = [normalized];
  state.session = { userId: normalized.id, createdAt: new Date().toISOString() };
}

function clearAuthState() {
  state.session = null;
  state.users = [];
  state.clients = [];
  state.projects = [];
}

function normalizeUser(user) {
  return {
    permissions: [],
    avatar: "",
    phone: "",
    area: "",
    notes: "",
    ...user,
    name: user.name || user.email,
    username: user.username || String(user.email || "").split("@")[0],
    status: user.status || "activo"
  };
}

