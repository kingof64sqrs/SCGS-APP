import { z } from "zod";

/** Fields a member may edit on their own profile. */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    address: z.string().trim().min(1).optional(),
    bloodGroup: z.string().trim().min(1).optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** A new profile photo (base64-encoded image). */
export const updatePhotoSchema = z.object({
  contentType: z.string().min(1),
  base64: z.string().min(1),
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>;
