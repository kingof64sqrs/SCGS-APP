import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { getMember, listMembers } from "./member.service.js";

export const membersRouter = Router();

/** GET /api/members -> Member[] (sorted by samajId) */
membersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listMembers());
  }),
);

/** GET /api/members/:samajId -> Member (404 if not found) */
membersRouter.get(
  "/:samajId",
  asyncHandler(async (req, res) => {
    res.json(await getMember(req.params.samajId));
  }),
);
