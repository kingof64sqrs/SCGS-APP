import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/http-error.js";

/** Requires the admin key in the `x-admin-key` header. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers["x-admin-key"];
  if (typeof key !== "string" || key !== env.adminKey) {
    next(new UnauthorizedError("Invalid admin key"));
    return;
  }
  next();
}
