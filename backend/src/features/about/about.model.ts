import { getDb } from "../../infrastructure/database/mongo.js";
import type { AboutContent } from "./about.schema.js";

const COLLECTION = "about";

export function findAbout(): Promise<AboutContent | null> {
  return getDb().collection<AboutContent>(COLLECTION).findOne({}, { projection: { _id: 0 } });
}

/** Replace the single about document (admin edit). */
export async function updateAbout(doc: AboutContent): Promise<void> {
  await getDb().collection<AboutContent>(COLLECTION).replaceOne({}, doc, { upsert: true });
}
