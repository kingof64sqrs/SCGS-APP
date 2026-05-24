import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { validateBody } from "../../core/validation/validate.js";
import { loginSchema } from "./auth.schema.js";
import { listDemoAccounts, login } from "./auth.service.js";

export const authRouter = Router();

/** POST /api/auth/login -> { token, user } (401 on bad credentials) */
authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    res.json(await login(req.body));
  }),
);

/** GET /api/auth/demo-accounts -> [{ name, email }] (demo login helper) */
authRouter.get(
  "/demo-accounts",
  asyncHandler(async (_req, res) => {
    res.json(await listDemoAccounts());
  }),
);
