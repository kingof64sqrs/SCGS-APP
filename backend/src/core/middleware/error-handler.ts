import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { HttpError } from "../errors/http-error.js";

/** Global error middleware: turns any thrown/async error into a JSON response. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? "Invalid request";
    res.status(400).json({ error: message, details: err.flatten() });
    return;
  }

  console.error("Unhandled error:", err);
  const detail = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: "Internal Server Error", detail });
}
