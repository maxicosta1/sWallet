import { Router } from "express";

export function createPlaceholderRouter(moduleName: string) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(501).json({
      module: moduleName,
      status: "not_implemented",
      message: "Module scaffold exists. Domain endpoints will be implemented in later phases."
    });
  });

  return router;
}
