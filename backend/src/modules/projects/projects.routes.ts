import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { asyncHandler } from "../../shared/async-handler.js";
import { createProject, deleteProject, getProject, listProjects, updateProject } from "./projects.service.js";
import { createProjectSchema, listProjectsSchema, projectParamsSchema, updateProjectSchema } from "./projects.schemas.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", asyncHandler(async (req, res) => {
  const query = listProjectsSchema.parse(req.query);
  const result = await listProjects(query);
  res.json(result);
}));

projectsRouter.get("/:id", asyncHandler(async (req, res) => {
  const { id } = projectParamsSchema.parse(req.params);
  const project = await getProject(id);
  res.json({ project });
}));

projectsRouter.post("/", requireRole("admin", "finanzas", "desarrollador"), asyncHandler(async (req, res) => {
  const payload = createProjectSchema.parse(req.body);
  const project = await createProject(payload, req.auth!.userId);
  res.status(201).json({ project });
}));

projectsRouter.patch("/:id", requireRole("admin", "finanzas", "desarrollador"), asyncHandler(async (req, res) => {
  const { id } = projectParamsSchema.parse(req.params);
  const payload = updateProjectSchema.parse(req.body);
  const project = await updateProject(id, payload, req.auth!.userId);
  res.json({ project });
}));

projectsRouter.delete("/:id", requireRole("admin"), asyncHandler(async (req, res) => {
  const { id } = projectParamsSchema.parse(req.params);
  await deleteProject(id, req.auth!.userId);
  res.status(204).send();
}));
