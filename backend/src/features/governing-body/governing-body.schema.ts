import { z } from "zod";

/** A stored governing-body member document. Links to a directory member via samajId. */
export const governingBodyMemberSchema = z.object({
  name: z.string(),
  position: z.string(),
  photoUrl: z.string(),
  group: z.string(),
  samajId: z.string().optional(),
});

export type GoverningBodyMember = z.infer<typeof governingBodyMemberSchema>;

/** Grouped shape returned by the API. Photo comes from the member endpoint via samajId. */
export interface GoverningBodyGroup {
  group: string;
  members: Array<{ name: string; position: string; samajId?: string }>;
}
