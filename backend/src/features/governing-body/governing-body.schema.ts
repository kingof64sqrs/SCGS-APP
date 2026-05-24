import { z } from "zod";

/** A stored governing-body member document (includes the grouping label). */
export const governingBodyMemberSchema = z.object({
  name: z.string(),
  position: z.string(),
  photoUrl: z.string(),
  group: z.string(),
});

export type GoverningBodyMember = z.infer<typeof governingBodyMemberSchema>;

/** Grouped shape returned by the API (group omitted from each member). */
export interface GoverningBodyGroup {
  group: string;
  members: Array<Pick<GoverningBodyMember, "name" | "position" | "photoUrl">>;
}
