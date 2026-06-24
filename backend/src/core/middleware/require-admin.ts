import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { getAdminKeyOverride } from "../../features/settings/settings.model.js";
import { UnauthorizedError } from "../errors/http-error.js";

/**
 * Requires the admin key in the `x-admin-key` header. Accepts an override
 * stored in Mongo if set, otherwise the env-configured ADMIN_KEY.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const key = req.headers["x-admin-key"];
  if (typeof key !== "string" || !key) {
    next(new UnauthorizedError("Invalid admin key"));
    return;
  }
  try {
    const override = await getAdminKeyOverride();
    const accepted = override ?? env.adminKey;
    if (key !== accepted) {
      next(new UnauthorizedError("Invalid admin key"));
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
}
