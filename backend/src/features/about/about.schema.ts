import { z } from "zod";

export const aboutSchema = z.object({
  title: z.string(),
  paragraphs: z.array(z.string()),
  facts: z.array(z.object({ label: z.string(), value: z.string() })),
  contact: z.object({
    address: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  facilities: z.array(z.string()),
  services: z.array(z.string()),
});

export type AboutContent = z.infer<typeof aboutSchema>;
