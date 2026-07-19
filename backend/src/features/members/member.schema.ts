import { z } from "zod";

/** Defaults to "" when absent (type stays `string`). */
const withDefault = () => z.string().optional().default("");
/** Truly optional (type is `string | undefined`) — safe to omit when constructing. */
const opt = () => z.string().optional();

/** Member directory / profile entry (what the API returns). */
export const memberSchema = z.object({
  // Core (membership no = samajId).
  samajId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: withDefault(),
  address: withDefault(),
  bloodGroup: withDefault(),
  // Extended profile — all optional, filled by the member over time.
  whatsapp: opt(),
  dateOfBirth: opt(),
  nativePlace: opt(),
  gnati: opt(),
  maritalStatus: opt(),
  occupation: opt(),
  occupationDetails: opt(),
  officeAddress: opt(),
  father: opt(),
  mother: opt(),
  spouse: opt(),
  children: opt(),
  siblings: opt(),
});

export type Member = z.infer<typeof memberSchema>;

/** Optional profile field keys (everything a member may fill beyond the core). */
export const OPTIONAL_PROFILE_KEYS = [
  "dateOfBirth",
  "nativePlace",
  "gnati",
  "maritalStatus",
  "occupation",
  "occupationDetails",
  "officeAddress",
  "father",
  "mother",
  "spouse",
  "children",
  "siblings",
] as const;

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
