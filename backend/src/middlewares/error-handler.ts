import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid request payload.",
      issues: error.flatten()
    });
    return;
  }

  const status = typeof error?.status === "number" ? error.status : 500;

  res.status(status).json({
    error: status >= 500 ? "INTERNAL_SERVER_ERROR" : String(error?.code ?? "REQUEST_ERROR"),
    message: status >= 500 ? "Unexpected backend error." : String(error?.message ?? "Request failed."),
    detail: env.nodeEnv === "development" ? String(error?.stack ?? error) : undefined
  });
};
