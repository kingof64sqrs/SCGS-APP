import { Router } from "express";
import { z } from "zod";

import { BadRequestError, NotFoundError } from "../../core/errors/http-error.js";
import { asyncHandler } from "../../core/middleware/async-handler.js";
import { requireAdmin } from "../../core/middleware/require-admin.js";
import { hashPassword } from "../../core/security/password.js";
import { validateBody } from "../../core/validation/validate.js";
import { findAbout, updateAbout } from "../about/about.model.js";
import { aboutSchema } from "../about/about.schema.js";
import {
  createFacility,
  deleteFacility,
  listFacilityDocs,
  updateFacility,
} from "../facilities/facilities.model.js";
import { facilitySchema } from "../facilities/facilities.schema.js";
import {
  createGoverningBody,
  deleteGoverningBody,
  listGoverningBodyDocs,
  updateGoverningBody,
} from "../governing-body/governing-body.model.js";
import {
  deleteMember,
  emailExists,
  findAllMembers,
  insertMember,
  nextSamajId,
  setMemberPassword,
  updateMember,
} from "../members/member.model.js";

export const adminRouter = Router();

// Everything here requires the admin key.
adminRouter.use(requireAdmin);

/** GET /api/admin/verify -> confirms the admin key is valid. */
adminRouter.get("/verify", (_req, res) => {
  res.json({ ok: true });
});

// ----------------------------- Members -----------------------------

const memberCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  bloodGroup: z.string().trim().min(1),
  password: z.string().min(1).optional(),
});
const memberUpdateSchema = memberCreateSchema.partial();
const passwordSchema = z.object({ password: z.string().min(1) });

adminRouter.get(
  "/members",
  asyncHandler(async (_req, res) => {
    res.json(await findAllMembers());
  }),
);

adminRouter.post(
  "/members",
  validateBody(memberCreateSchema),
  asyncHandler(async (req, res) => {
    const { password, ...fields } = req.body as z.infer<typeof memberCreateSchema>;
    const email = fields.email.toLowerCase();
    if (await emailExists(email)) {
      throw new BadRequestError("A member with this email already exists");
    }
    const samajId = await nextSamajId();
    await insertMember({
      samajId,
      name: fields.name,
      email,
      phone: fields.phone,
      address: fields.address,
      bloodGroup: fields.bloodGroup,
      passwordHash: hashPassword(password ?? "test123"),
    });
    res.status(201).json({ samajId });
  }),
);

adminRouter.put(
  "/members/:samajId",
  validateBody(memberUpdateSchema),
  asyncHandler(async (req, res) => {
    const { password: _ignored, ...patch } = req.body as z.infer<typeof memberUpdateSchema>;
    if (patch.email) {
      patch.email = patch.email.toLowerCase();
      if (await emailExists(patch.email, req.params.samajId)) {
        throw new BadRequestError("Email already in use by another member");
      }
    }
    const ok = await updateMember(req.params.samajId, patch);
    if (!ok) throw new NotFoundError("Member not found");
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  "/members/:samajId",
  asyncHandler(async (req, res) => {
    const ok = await deleteMember(req.params.samajId);
    if (!ok) throw new NotFoundError("Member not found");
    res.json({ ok: true });
  }),
);

adminRouter.put(
  "/members/:samajId/password",
  validateBody(passwordSchema),
  asyncHandler(async (req, res) => {
    const ok = await setMemberPassword(req.params.samajId, hashPassword(req.body.password));
    if (!ok) throw new NotFoundError("Member not found");
    res.json({ ok: true });
  }),
);

// ------------------------- Governing Body --------------------------

const gbCreateSchema = z.object({
  name: z.string().trim().min(1),
  position: z.string().trim().min(1),
  photoUrl: z.string().trim().default(""),
  group: z.string().trim().min(1),
});

adminRouter.get(
  "/governing-body",
  asyncHandler(async (_req, res) => {
    res.json(await listGoverningBodyDocs());
  }),
);

adminRouter.post(
  "/governing-body",
  validateBody(gbCreateSchema),
  asyncHandler(async (req, res) => {
    await createGoverningBody(req.body);
    res.status(201).json({ ok: true });
  }),
);

adminRouter.put(
  "/governing-body/:id",
  validateBody(gbCreateSchema.partial()),
  asyncHandler(async (req, res) => {
    const ok = await updateGoverningBody(req.params.id, req.body);
    if (!ok) throw new NotFoundError("Governing body member not found");
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  "/governing-body/:id",
  asyncHandler(async (req, res) => {
    const ok = await deleteGoverningBody(req.params.id);
    if (!ok) throw new NotFoundError("Governing body member not found");
    res.json({ ok: true });
  }),
);

// ------------------------------ About ------------------------------

adminRouter.get(
  "/about",
  asyncHandler(async (_req, res) => {
    res.json(await findAbout());
  }),
);

adminRouter.put(
  "/about",
  validateBody(aboutSchema),
  asyncHandler(async (req, res) => {
    await updateAbout(req.body);
    res.json({ ok: true });
  }),
);

// ---------------------------- Facilities ---------------------------

adminRouter.get(
  "/facilities",
  asyncHandler(async (_req, res) => {
    res.json(await listFacilityDocs());
  }),
);

adminRouter.post(
  "/facilities",
  validateBody(facilitySchema),
  asyncHandler(async (req, res) => {
    await createFacility(req.body);
    res.status(201).json({ ok: true });
  }),
);

adminRouter.put(
  "/facilities/:id",
  validateBody(facilitySchema.partial()),
  asyncHandler(async (req, res) => {
    const ok = await updateFacility(req.params.id, req.body);
    if (!ok) throw new NotFoundError("Facility not found");
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  "/facilities/:id",
  asyncHandler(async (req, res) => {
    const ok = await deleteFacility(req.params.id);
    if (!ok) throw new NotFoundError("Facility not found");
    res.json({ ok: true });
  }),
);
