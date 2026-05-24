import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { getMember, getMemberPhoto, listMembers } from "./member.service.js";

export const membersRouter = Router();

/** GET /api/members -> Member[] (sorted by samajId) */
membersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listMembers());
  }),
);

/** GET /api/members/:samajId/photo -> raw image bytes (from MongoDB) */
membersRouter.get(
  "/:samajId/photo",
  asyncHandler(async (req, res) => {
    const photo = await getMemberPhoto(req.params.samajId);
    res.setHeader("Content-Type", photo.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(photo.base64, "base64"));
  }),
);

/** GET /api/members/:samajId -> Member (404 if not found) */
membersRouter.get(
  "/:samajId",
  asyncHandler(async (req, res) => {
    res.json(await getMember(req.params.samajId));
  }),
);
