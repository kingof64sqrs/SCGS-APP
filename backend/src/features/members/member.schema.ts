import { z } from "zod";

/** A Samaj member directory entry. */
export const memberSchema = z.object({
  samajId: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  bloodGroup: z.string(),
});

export type Member = z.infer<typeof memberSchema>;
