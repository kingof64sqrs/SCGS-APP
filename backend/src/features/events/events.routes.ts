import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { getEventBanner, getPublicEvent, listEvents } from "./events.service.js";

export const eventsRouter = Router();

/** GET /api/events -> active events (newest first) */
eventsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listEvents());
  }),
);

/** GET /api/events/:id -> single active event */
eventsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    res.json(await getPublicEvent(req.params.id));
  }),
);

/** GET /api/events/:id/banner -> raw banner image bytes (from MongoDB) */
eventsRouter.get(
  "/:id/banner",
  asyncHandler(async (req, res) => {
    const banner = await getEventBanner(req.params.id);
    res.setHeader("Content-Type", banner.contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(Buffer.from(banner.base64, "base64"));
  }),
);
