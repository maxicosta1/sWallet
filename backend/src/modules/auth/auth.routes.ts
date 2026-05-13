import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { bootstrapAdmin, getCurrentUser, login, logout, refreshSession } from "./auth.service.js";
import { bootstrapSchema, loginSchema, logoutSchema, refreshSchema } from "./auth.schemas.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false
});

authRouter.post("/bootstrap", authLimiter, asyncHandler(async (req, res) => {
  const payload = bootstrapSchema.parse(req.body);
  const user = await bootstrapAdmin(payload);
  res.status(201).json({ user });
}));

authRouter.post("/login", authLimiter, asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const session = await login({
    ...payload,
    userAgent: req.header("user-agent"),
    ipAddress: req.ip
  });
  res.json(session);
}));

authRouter.post("/refresh", authLimiter, asyncHandler(async (req, res) => {
  const payload = refreshSchema.parse(req.body);
  const session = await refreshSession(payload.refreshToken, {
    userAgent: req.header("user-agent"),
    ipAddress: req.ip
  });
  res.json(session);
}));

authRouter.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  const payload = logoutSchema.parse(req.body ?? {});
  await logout(req.auth?.userId, payload.refreshToken);
  res.status(204).send();
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.auth!.userId);
  res.json({ user });
}));
