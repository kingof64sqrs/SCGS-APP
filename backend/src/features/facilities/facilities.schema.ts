import { z } from "zod";

export const facilitySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type Facility = z.infer<typeof facilitySchema>;
