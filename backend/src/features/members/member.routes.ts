import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { getMember, getMemberPhoto, listMembersPaged } from "./member.service.js";

export const membersRouter = Router();

/** Query parameters for listing members. */
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().optional(),
});

/** GET /api/members?page=&limit=&q= -> { items, page, limit, total, totalPages } */
membersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, q } = listQuerySchema.parse(req.query);
    res.json(await listMembersPaged({ page, limit, q }));
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
