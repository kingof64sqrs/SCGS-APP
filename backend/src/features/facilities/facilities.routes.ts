import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { listFacilities } from "./facilities.service.js";

export const facilitiesRouter = Router();

/** GET /api/facilities -> Facility[] */
facilitiesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listFacilities());
  }),
);
