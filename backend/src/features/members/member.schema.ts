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

/** Stored member document — adds the credentials, never sent to clients. */
export interface MemberDoc extends Member {
  passwordHash: string;
}
