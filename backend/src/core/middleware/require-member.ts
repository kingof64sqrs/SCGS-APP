import type { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../errors/http-error.js";
import { verifyToken } from "../security/token.js";

/**
 * Requires a valid member session token (Authorization: Bearer <token>).
 * On success the member's samajId is stored on res.locals.samajId.
 */
export function requireMember(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const samajId = token ? verifyToken(token) : null;

  if (!samajId) {
    next(new UnauthorizedError("Authentication required"));
    return;
  }

  res.locals.samajId = samajId;
  next();
}
