import { z } from "zod";

/** Public member directory entry (what the API returns). */
export const memberSchema = z.object({
  samajId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
  bloodGroup: z.string().optional().default(""),
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
  /** True until the member has set their own password (default after import / admin reset). */
  mustChangePassword?: boolean;
  photo?: MemberPhoto;
  /** Registered Expo push tokens for this member's devices. */
  pushTokens?: string[];
}
