import { getDb } from "../../infrastructure/database/mongo.js";
import type { AboutContent } from "./about.schema.js";

const COLLECTION = "about";

export function findAbout(): Promise<AboutContent | null> {
  return getDb().collection<AboutContent>(COLLECTION).findOne({}, { projection: { _id: 0 } });
}
