import { z } from "zod";

const optionalText = () => z.string().trim().max(500).optional();

/** Fields a member may edit on their own profile. */
export const updateProfileSchema = z
  .object({
    // Core (name required if present).
    name: z.string().trim().min(1).optional(),
    whatsapp: optionalText(),
    email: optionalText(),
    address: optionalText(),
    bloodGroup: optionalText(),
    // Extended / optional profile.
    dateOfBirth: optionalText(),
    weddingAnniversary: optionalText(),
    nativePlace: optionalText(),
    gnati: optionalText(),
    maritalStatus: optionalText(),
    occupation: optionalText(),
    occupationDetails: optionalText(),
    officeAddress: optionalText(),
    father: optionalText(),
    mother: optionalText(),
    spouse: optionalText(),
    children: optionalText(),
    siblings: optionalText(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** A new profile photo (base64-encoded image). */
export const updatePhotoSchema = z.object({
  contentType: z.string().min(1),
  base64: z.string().min(1),
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;

/**
 * First-time or self-initiated password change.
 * - `currentPassword` is required for voluntary changes (when mustChangePassword=false).
 * - It is ignored on the forced first-login flow (when the user's mustChangePassword=true).
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  password: z.string().min(6, "Use at least 6 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
