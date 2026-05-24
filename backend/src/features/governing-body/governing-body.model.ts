import type { Collection } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import type { GoverningBodyMember } from "./governing-body.schema.js";

const COLLECTION = "governingBody";

export function governingBodyCollection(): Collection<GoverningBodyMember> {
  return getDb().collection<GoverningBodyMember>(COLLECTION);
}

export function findAllGoverningBody(): Promise<GoverningBodyMember[]> {
  return governingBodyCollection()
    .find({}, { projection: { _id: 0, name: 1, position: 1, photoUrl: 1, group: 1 } })
    .toArray();
}
