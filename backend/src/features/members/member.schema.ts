import { z } from "zod";

/** Public member directory entry (what the API returns). */
export const memberSchema = z.object({
  samajId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  bloodGroup: z.string(),
});

export type Member = z.infer<typeof memberSchema>;

/** A member photo stored inline in MongoDB (base64-encoded image bytes). */
export interface MemberPhoto {
  contentType: string;
  base64: string;
}

/** Stored member document — adds credentials + photo, never sent verbatim to clients. */
export interface MemberDoc extends Member {
  passwordHash: string;
  photo?: MemberPhoto;
}
