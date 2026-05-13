import type { Express } from "express";
import { auditRouter } from "./audit/audit.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { billingRouter } from "./billing/billing.routes.js";
import { clientsRouter } from "./clients/clients.routes.js";
import { dashboardRouter } from "./dashboard/dashboard.routes.js";
import { goalsRouter } from "./goals/goals.routes.js";
import { healthRouter } from "./health/health.routes.js";
import { movementsRouter } from "./movements/movements.routes.js";
import { paymentsRouter } from "./payments/payments.routes.js";
import { projectsRouter } from "./projects/projects.routes.js";
import { settingsRouter } from "./settings/settings.routes.js";
import { tasksRouter } from "./tasks/tasks.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { domainModules } from "../types/domain.js";

export function registerModules(app: Express) {
  app.use("/health", healthRouter);

  app.get("/api/v1", (_req, res) => {
    res.json({
      name: "sWallet API",
      phase: "fase_3_clients_projects",
      modules: domainModules
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/clients", clientsRouter);
  app.use("/api/v1/projects", projectsRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/payments", paymentsRouter);
  app.use("/api/v1/movements", movementsRouter);
  app.use("/api/v1/tasks", tasksRouter);
  app.use("/api/v1/goals", goalsRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/audit", auditRouter);
}
