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
  deleteEvent,
  findEvent,
  insertEvent,
  listAllEvents,
  updateEvent,
} from "../events/events.model.js";
import { eventCreateSchema, eventUpdateSchema } from "../events/events.schema.js";
import { dispatchNotification } from "../notifications/notifications.service.js";
import { sendWhatsAppBulk, whatsappConfigured } from "../notifications/whatsapp.service.js";
import {
  createGoverningBody,
  deleteGoverningBody,
  listGoverningBodyDocs,
  updateGoverningBody,
} from "../governing-body/governing-body.model.js";
import {
  deleteMember,
  emailExists,
  findMemberById,
  findMembersPage,
  insertMember,
  membersCollection,
  nextSamajId,
  normalizePhone,
  phoneExists,
  setMemberPassword,
  updateMember,
  updateMemberPhoto,
} from "../members/member.model.js";
import {
  getAdminKeyOverride,
  setAdminKeyOverride,
} from "../settings/settings.model.js";
import { governingBodyCollection } from "../governing-body/governing-body.model.js";

export const adminRouter = Router();

// Everything here requires the admin key.
adminRouter.use(requireAdmin);

/** GET /api/admin/verify -> confirms the admin key is valid. */
adminRouter.get("/verify", (_req, res) => {
  res.json({ ok: true });
});

// ----------------------------- Stats & Settings -----------------------------

/** GET /api/admin/stats -> high-level counts for the dashboard. */
adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [members, governingBody] = await Promise.all([
      membersCollection().countDocuments(),
      governingBodyCollection().countDocuments(),
    ]);
    const withPhoto = await membersCollection().countDocuments({ photo: { $exists: true } });
    const pendingPasswordChange = await membersCollection().countDocuments({
      mustChangePassword: true,
    });
    res.json({
      members,
      governingBody,
      membersWithPhoto: withPhoto,
      pendingPasswordChange,
    });
  }),
);

/** GET /api/admin/settings -> indicates whether a DB admin-key override is set. */
adminRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const override = await getAdminKeyOverride();
    res.json({ adminKeyOverridden: !!override });
  }),
);

const changeAdminKeySchema = z
  .object({
    newKey: z.string().min(4, "Admin key must be at least 4 characters"),
    confirmKey: z.string().min(1, "Confirm the new key"),
  })
  .refine((v) => v.newKey === v.confirmKey, {
    message: "Keys do not match",
    path: ["confirmKey"],
  });

/**
 * PUT /api/admin/settings/admin-key
 * Persists a new admin key in Mongo (overrides ADMIN_KEY env). The current
 * key has already been verified by `requireAdmin`.
 */
adminRouter.put(
  "/settings/admin-key",
  validateBody(changeAdminKeySchema),
  asyncHandler(async (req, res) => {
    const { newKey } = req.body as z.infer<typeof changeAdminKeySchema>;
    await setAdminKeyOverride(newKey);
    res.json({ ok: true });
  }),
);

// ----------------------------- Members -----------------------------

const memberCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(1),
  address: z.string().trim().optional().default(""),
  bloodGroup: z.string().trim().optional().default(""),
  password: z.string().min(1).optional(),
});
const memberUpdateSchema = memberCreateSchema.partial();
const passwordSchema = z.object({ password: z.string().min(1) });
const photoSchema = z.object({ contentType: z.string().min(1), base64: z.string().min(1) });

const memberListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().optional(),
});

adminRouter.get(
  "/members",
  asyncHandler(async (req, res) => {
    const { page, limit, q } = memberListQuery.parse(req.query);
    const { items, total } = await findMembersPage({ page, limit, q });
    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

adminRouter.post(
  "/members",
  validateBody(memberCreateSchema),
  asyncHandler(async (req, res) => {
    const { password, ...fields } = req.body as z.infer<typeof memberCreateSchema>;
    const email = (fields.email ?? "").toLowerCase();
    if (email && (await emailExists(email))) {
      throw new BadRequestError("A member with this email already exists");
    }
    const phone = normalizePhone(fields.phone);
    if (!phone) throw new BadRequestError("Phone number must have at least 10 digits");
    if (await phoneExists(phone)) {
      throw new BadRequestError("A member with this phone already exists");
    }
    const samajId = await nextSamajId();
    // Default password = phone number, with mustChangePassword=true.
    // If the admin supplied an explicit password, honour it (still must-change).
    const initialPassword = password ?? phone;
    await insertMember({
      samajId,
      name: fields.name,
      email,
      phone,
      address: fields.address ?? "",
      bloodGroup: fields.bloodGroup ?? "",
      passwordHash: hashPassword(initialPassword),
      mustChangePassword: true,
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
    if (patch.phone) {
      const normalized = normalizePhone(patch.phone);
      if (!normalized) throw new BadRequestError("Phone number must have at least 10 digits");
      if (await phoneExists(normalized, req.params.samajId)) {
        throw new BadRequestError("Phone already in use by another member");
      }
      patch.phone = normalized;
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
    // Admin reset → member must change at next login.
    const ok = await setMemberPassword(req.params.samajId, hashPassword(req.body.password), true);
    if (!ok) throw new NotFoundError("Member not found");
    res.json({ ok: true });
  }),
);

adminRouter.put(
  "/members/:samajId/photo",
  validateBody(photoSchema),
  asyncHandler(async (req, res) => {
    const ok = await updateMemberPhoto(req.params.samajId, req.body);
    if (!ok) throw new NotFoundError("Member not found");
    res.json({ ok: true });
  }),
);

// ------------------------- Governing Body --------------------------

// Governing body entries are derived from existing members — the admin picks a
// samajId and the server stores the linked member's name on the GB doc.
const gbCreateSchema = z.object({
  samajId: z.string().trim().min(1, "Pick a member"),
  position: z.string().trim().min(1),
  group: z.string().trim().min(1),
});

const gbUpdateSchema = z.object({
  samajId: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
  group: z.string().trim().min(1).optional(),
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
    const { samajId, position, group } = req.body as z.infer<typeof gbCreateSchema>;
    const member = await findMemberById(samajId);
    if (!member) throw new BadRequestError("Selected member does not exist");
    await createGoverningBody({
      name: member.name,
      position,
      group,
      photoUrl: "",
      samajId,
    });
    res.status(201).json({ ok: true });
  }),
);

adminRouter.put(
  "/governing-body/:id",
  validateBody(gbUpdateSchema),
  asyncHandler(async (req, res) => {
    const patch = req.body as z.infer<typeof gbUpdateSchema>;
    // If the admin switched to a different member, refresh the stored name.
    const finalPatch: Record<string, unknown> = { ...patch };
    if (patch.samajId) {
      const member = await findMemberById(patch.samajId);
      if (!member) throw new BadRequestError("Selected member does not exist");
      finalPatch.name = member.name;
    }
    const ok = await updateGoverningBody(req.params.id, finalPatch);
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

// ------------------------------ Events -----------------------------

adminRouter.get(
  "/events",
  asyncHandler(async (_req, res) => {
    res.json(await listAllEvents());
  }),
);

const eventCreateBody = eventCreateSchema.extend({
  notify: z.boolean().optional().default(true),
});

/** Create an event. If `notify` (default true), push + in-app alert everyone. */
adminRouter.post(
  "/events",
  validateBody(eventCreateBody),
  asyncHandler(async (req, res) => {
    const { notify, ...event } = req.body as z.infer<typeof eventCreateBody>;
    const id = await insertEvent({
      title: event.title,
      description: event.description,
      location: event.location ?? "",
      eventDate: event.eventDate ?? "",
      active: event.active ?? true,
      createdAt: new Date().toISOString(),
      ...(event.banner ? { banner: event.banner } : {}),
    });

    let dispatch = null;
    if (notify) {
      dispatch = await dispatchNotification({
        title: `New event: ${event.title}`,
        body: event.eventDate ? `${event.eventDate} — ${event.description}` : event.description,
        type: "event",
        refId: id,
      });
    }
    res.status(201).json({ id, notified: dispatch });
  }),
);

adminRouter.put(
  "/events/:id",
  validateBody(eventUpdateSchema),
  asyncHandler(async (req, res) => {
    const ok = await updateEvent(req.params.id, req.body);
    if (!ok) throw new NotFoundError("Event not found");
    res.json({ ok: true });
  }),
);

adminRouter.delete(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const ok = await deleteEvent(req.params.id);
    if (!ok) throw new NotFoundError("Event not found");
    res.json({ ok: true });
  }),
);

/** GET /api/admin/events/:id -> single event (admin view) */
adminRouter.get(
  "/events/:id",
  asyncHandler(async (req, res) => {
    const ev = await findEvent(req.params.id);
    if (!ev) throw new NotFoundError("Event not found");
    res.json(ev);
  }),
);

// ---------------------------- Broadcast ----------------------------

const broadcastSchema = z.object({
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  /** Also send via WhatsApp Cloud API (if configured). */
  whatsapp: z.boolean().optional().default(false),
});

/** GET /api/admin/broadcast/status -> whether WhatsApp is configured. */
adminRouter.get("/broadcast/status", (_req, res) => {
  res.json({ whatsappConfigured: whatsappConfigured() });
});

/**
 * POST /api/admin/broadcast
 * Sends an in-app notification + Expo push to everyone. Optionally also fans
 * out over WhatsApp Cloud API (best effort, only if configured).
 */
adminRouter.post(
  "/broadcast",
  validateBody(broadcastSchema),
  asyncHandler(async (req, res) => {
    const { title, message, whatsapp } = req.body as z.infer<typeof broadcastSchema>;

    const dispatch = await dispatchNotification({
      title,
      body: message,
      type: "broadcast",
    });

    let whatsappSent = 0;
    let whatsappAttempted = false;
    if (whatsapp && whatsappConfigured()) {
      whatsappAttempted = true;
      const docs = await membersCollection()
        .find({ phone: { $exists: true, $ne: "" } }, { projection: { _id: 0, phone: 1 } })
        .toArray();
      const phones = docs
        .map((d) => (d as { phone?: string }).phone)
        .filter((p): p is string => !!p);
      whatsappSent = await sendWhatsAppBulk(phones, `*${title}*\n\n${message}`);
    }

    res.json({
      notificationId: dispatch.notificationId,
      pushAccepted: dispatch.pushAccepted,
      tokenCount: dispatch.tokenCount,
      whatsappConfigured: whatsappConfigured(),
      whatsappAttempted,
      whatsappSent,
    });
  }),
);
