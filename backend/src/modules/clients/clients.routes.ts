import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { createClient, deleteClient, getClient, listClients, updateClient } from "./clients.service.js";
import { clientParamsSchema, createClientSchema, listClientsSchema, updateClientSchema } from "./clients.schemas.js";

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

clientsRouter.get("/", asyncHandler(async (req, res) => {
  const query = listClientsSchema.parse(req.query);
  const result = await listClients(query);
  res.json(result);
}));

clientsRouter.get("/:id", asyncHandler(async (req, res) => {
  const { id } = clientParamsSchema.parse(req.params);
  const client = await getClient(id);
  res.json({ client });
}));

clientsRouter.post("/", requireRole("admin", "finanzas", "desarrollador"), asyncHandler(async (req, res) => {
  const payload = createClientSchema.parse(req.body);
  const client = await createClient(payload, req.auth!.userId);
  res.status(201).json({ client });
}));

clientsRouter.patch("/:id", requireRole("admin", "finanzas", "desarrollador"), asyncHandler(async (req, res) => {
  const { id } = clientParamsSchema.parse(req.params);
  const payload = updateClientSchema.parse(req.body);
  const client = await updateClient(id, payload, req.auth!.userId);
  res.json({ client });
}));

clientsRouter.delete("/:id", requireRole("admin"), asyncHandler(async (req, res) => {
  const { id } = clientParamsSchema.parse(req.params);
  await deleteClient(id, req.auth!.userId);
  res.status(204).send();
}));
