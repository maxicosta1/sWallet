import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { createUser, listUsers } from "./users.service.js";
import { createUserSchema } from "./users.schemas.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("admin"));

usersRouter.get("/", asyncHandler(async (_req, res) => {
  const users = await listUsers();
  res.json({ users });
}));

usersRouter.post("/", asyncHandler(async (req, res) => {
  const payload = createUserSchema.parse(req.body);
  const user = await createUser(payload);
  res.status(201).json({ user });
}));
