const DEFAULT_API_BASE_URL = "http://localhost:4000/api/v1";
const API_BASE_URL = window.sWalletApiBaseUrl || DEFAULT_API_BASE_URL;
const ACCESS_TOKEN_KEY = "swalletAccessToken";
const REFRESH_TOKEN_KEY = "swalletRefreshToken";

export class ApiError extends Error {
  constructor(message, { status = 0, details = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function setSessionTokens({ accessToken, refreshToken }) {
  if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSessionTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });

  if (response.status === 204) return null;

  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiError(errorMessage(payload, response.status), {
      status: response.status,
      details: payload
    });
  }

  return payload;
}

function buildHeaders(headers = {}) {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function errorMessage(payload, status) {
  if (payload?.message) return payload.message;
  if (payload?.error?.message) return payload.error.message;
  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  return "No se pudo completar la operacion.";
}
