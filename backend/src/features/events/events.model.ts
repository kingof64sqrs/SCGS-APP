import { type Collection, ObjectId } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import type { EventBanner, EventDoc, EventPublic } from "./events.schema.js";

const COLLECTION = "events";

export function eventsCollection(): Collection<EventDoc> {
  return getDb().collection<EventDoc>(COLLECTION);
}

/**
 * Projection that returns every public field plus a computed `hasBanner`
 * flag — WITHOUT pulling the (large) banner blob into memory.
 */
const PUBLIC_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  location: 1,
  eventDate: 1,
  active: 1,
  createdAt: 1,
  hasBanner: { $cond: [{ $ifNull: ["$banner", false] }, true, false] },
} as const;

type PublicRow = Omit<EventPublic, "id"> & { _id: ObjectId };

function toPublic(row: PublicRow): EventPublic {
  const { _id, ...rest } = row;
  return { id: _id.toString(), ...rest };
}

/** Public: active events, newest first. */
export async function listActiveEvents(): Promise<EventPublic[]> {
  const rows = await eventsCollection()
    .aggregate<PublicRow>([
      { $match: { active: true } },
      { $sort: { createdAt: -1 } },
      { $project: PUBLIC_PROJECTION },
    ])
    .toArray();
  return rows.map(toPublic);
}

/** Admin: all events, newest first. */
export async function listAllEvents(): Promise<EventPublic[]> {
  const rows = await eventsCollection()
    .aggregate<PublicRow>([{ $sort: { createdAt: -1 } }, { $project: PUBLIC_PROJECTION }])
    .toArray();
  return rows.map(toPublic);
}

export async function findEvent(id: string): Promise<EventPublic | null> {
  if (!ObjectId.isValid(id)) return null;
  const rows = await eventsCollection()
    .aggregate<PublicRow>([
      { $match: { _id: new ObjectId(id) } },
      { $project: PUBLIC_PROJECTION },
    ])
    .toArray();
  return rows[0] ? toPublic(rows[0]) : null;
}

export async function findEventBanner(id: string): Promise<EventBanner | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await eventsCollection().findOne(
    { _id: new ObjectId(id) },
    { projection: { banner: 1 } },
  );
  return doc?.banner ?? null;
}

export async function insertEvent(doc: EventDoc): Promise<string> {
  const res = await eventsCollection().insertOne(doc);
  return res.insertedId.toString();
}

export async function updateEvent(
  id: string,
  patch: Partial<EventDoc>,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const res = await eventsCollection().updateOne({ _id: new ObjectId(id) }, { $set: patch });
  return res.matchedCount > 0;
}

export async function deleteEvent(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const res = await eventsCollection().deleteOne({ _id: new ObjectId(id) });
  return res.deletedCount > 0;
}
