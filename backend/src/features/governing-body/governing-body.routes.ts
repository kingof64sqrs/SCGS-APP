import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { listGoverningBody } from "./governing-body.service.js";

export const governingBodyRouter = Router();

/** GET /api/governing-body -> GoverningBodyGroup[] */
governingBodyRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listGoverningBody());
  }),
);
