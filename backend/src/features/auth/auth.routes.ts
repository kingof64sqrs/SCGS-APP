import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { validateBody } from "../../core/validation/validate.js";
import { loginSchema } from "./auth.schema.js";
import { login } from "./auth.service.js";

export const authRouter = Router();

/** POST /api/auth/login */
authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    res.json(login(req.body));
  }),
);
