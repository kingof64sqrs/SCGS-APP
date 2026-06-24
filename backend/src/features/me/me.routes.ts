import { Router } from "express";

import { asyncHandler } from "../../core/middleware/async-handler.js";
import { requireMember } from "../../core/middleware/require-member.js";
import { validateBody } from "../../core/validation/validate.js";
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
