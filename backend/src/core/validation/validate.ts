import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { BadRequestError } from "../errors/http-error.js";

/**
 * Middleware factory that validates `req.body` against a zod schema.
 * On success the parsed (typed, trimmed) value replaces `req.body`.
 * On failure a BadRequestError (HTTP 400) is forwarded to the error handler.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "Invalid request body";
      next(new BadRequestError(message, result.error.flatten()));
      return;
    }
    req.body = result.data;
    next();
  };
}
