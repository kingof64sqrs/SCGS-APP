import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { getAbout } from "./about.service.js";

export const aboutRouter = Router();

/** GET /api/about -> AboutContent */
aboutRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getAbout());
  }),
);
