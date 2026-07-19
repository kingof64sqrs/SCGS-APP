import { z } from "zod";

/** A banner image stored inline in MongoDB (base64-encoded bytes). */
export interface EventBanner {
  contentType: string;
  base64: string;
}

/** Stored event document. */
export interface EventDoc {
  title: string;
  description: string;
  location?: string;
  /** Free-form date/time label, e.g. "15 Aug 2026, 6:00 PM". */
  eventDate?: string;
  active: boolean;
  createdAt: string;
  banner?: EventBanner;
}

/** Public event shape (no banner blob; hasBanner flag instead). */
export interface EventPublic {
  id: string;
  title: string;
  description: string;
  location?: string;
  eventDate?: string;
  active: boolean;
  createdAt: string;
  hasBanner: boolean;
}

export const eventCreateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  location: z.string().trim().optional().default(""),
  eventDate: z.string().trim().optional().default(""),
  active: z.boolean().optional().default(true),
  banner: z
    .object({ contentType: z.string().min(1), base64: z.string().min(1) })
    .optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
