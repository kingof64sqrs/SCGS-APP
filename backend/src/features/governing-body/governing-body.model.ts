import { type Collection, ObjectId } from "mongodb";

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

/** Admin: flat list including the document id. */
export async function listGoverningBodyDocs(): Promise<(GoverningBodyMember & { id: string })[]> {
  const docs = await governingBodyCollection().find({}).toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    position: d.position,
    photoUrl: d.photoUrl,
    group: d.group,
  }));
}

export async function createGoverningBody(doc: GoverningBodyMember): Promise<void> {
  await governingBodyCollection().insertOne(doc);
}

export async function updateGoverningBody(
  id: string,
  patch: Partial<GoverningBodyMember>,
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await governingBodyCollection().updateOne({ _id: new ObjectId(id) }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteGoverningBody(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await governingBodyCollection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
