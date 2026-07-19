import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { requireMember } from "../../core/middleware/require-member.js";
import { validateBody } from "../../core/validation/validate.js";
import {
  getMemberNotifications,
  markMemberNotificationRead,
  registerPushToken,
  unregisterPushToken,
} from "../notifications/notifications.service.js";
import { changePasswordSchema, updatePhotoSchema, updateProfileSchema } from "./me.schema.js";
import { changeMyPassword, getMe, updateMe, updateMyPhoto } from "./me.service.js";

export const meRouter = Router();

// Every /api/me route requires a valid member token.
meRouter.use(requireMember);

/** GET /api/me -> own profile */
meRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getMe(res.locals.samajId as string));
  }),
);

/** PUT /api/me -> update own profile fields */
meRouter.put(
  "/",
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateMe(res.locals.samajId as string, req.body));
  }),
);

/** PUT /api/me/photo -> replace own photo */
meRouter.put(
  "/photo",
  validateBody(updatePhotoSchema),
  asyncHandler(async (req, res) => {
    await updateMyPhoto(res.locals.samajId as string, req.body);
    res.json({ ok: true });
  }),
);

/** POST /api/me/password -> set own password (clears the must-change flag) */
meRouter.post(
  "/password",
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await changeMyPassword(res.locals.samajId as string, req.body);
    res.json({ ok: true });
  }),
);

// --- Push notifications ---

const pushTokenSchema = z.object({ token: z.string().min(1) });

/** POST /api/me/push-token -> register this device's Expo push token */
meRouter.post(
  "/push-token",
  validateBody(pushTokenSchema),
  asyncHandler(async (req, res) => {
    await registerPushToken(res.locals.samajId as string, req.body.token);
    res.json({ ok: true });
  }),
);

/** DELETE /api/me/push-token -> unregister a token (e.g. on logout) */
meRouter.delete(
  "/push-token",
  validateBody(pushTokenSchema),
  asyncHandler(async (req, res) => {
    await unregisterPushToken(res.locals.samajId as string, req.body.token);
    res.json({ ok: true });
  }),
);

// --- In-app notifications ---

/** GET /api/me/notifications -> { items, unread } */
meRouter.get(
  "/notifications",
  asyncHandler(async (_req, res) => {
    res.json(await getMemberNotifications(res.locals.samajId as string));
  }),
);

const readSchema = z.object({ id: z.string().optional() });

/** POST /api/me/notifications/read -> mark one (by id) or all read */
meRouter.post(
  "/notifications/read",
  validateBody(readSchema),
  asyncHandler(async (req, res) => {
    await markMemberNotificationRead(res.locals.samajId as string, req.body.id);
    res.json({ ok: true });
  }),
);
