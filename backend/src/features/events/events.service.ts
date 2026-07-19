import { NotFoundError } from "../../core/errors/http-error.js";
import { findEvent, findEventBanner, listActiveEvents } from "./events.model.js";
import type { EventBanner, EventPublic } from "./events.schema.js";

export function listEvents(): Promise<EventPublic[]> {
  return listActiveEvents();
}

/** Single active event for the public detail screen. */
export async function getPublicEvent(id: string): Promise<EventPublic> {
  const ev = await findEvent(id);
  if (!ev || !ev.active) throw new NotFoundError("Event not found");
  return ev;
}

export async function getEventBanner(id: string): Promise<EventBanner> {
  const banner = await findEventBanner(id);
  if (!banner) throw new NotFoundError("Banner not found");
  return banner;
}
