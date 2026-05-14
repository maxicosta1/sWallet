import { apiRequest, clearSessionTokens, getRefreshToken, setSessionTokens } from "./http.js";

export const authService = {
  async login(input) {
    const session = await apiRequest("/auth/login", {
      method: "POST",
      body: input
    });
    setSessionTokens(session);
    return normalizeSession(session);
  },

  async refresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const session = await apiRequest("/auth/refresh", {
      method: "POST",
      body: { refreshToken }
    });
    setSessionTokens(session);
    return normalizeSession(session);
  },

  async me() {
    const payload = await apiRequest("/auth/me");
    return payload.user;
  },

  async logout() {
    const refreshToken = getRefreshToken();
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: refreshToken ? { refreshToken } : {}
      });
    } finally {
      clearSessionTokens();
    }
  }
};

function normalizeSession(session) {
  return {
    user: session.user,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt
  };
}
