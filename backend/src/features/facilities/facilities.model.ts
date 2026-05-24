import { ObjectId } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import type { Facility } from "./facilities.schema.js";

const COLLECTION = "facilities";

function collection() {
  return getDb().collection<Facility>(COLLECTION);
}

export function findAllFacilities(): Promise<Facility[]> {
  return collection()
    .find({}, { projection: { _id: 0, name: 1, description: 1 } })
    .toArray();
}

/** Admin: list including document id. */
export async function listFacilityDocs(): Promise<(Facility & { id: string })[]> {
  const docs = await collection().find({}).toArray();
  return docs.map((d) => ({ id: d._id.toString(), name: d.name, description: d.description }));
}

export async function createFacility(doc: Facility): Promise<void> {
  await collection().insertOne(doc);
}

export async function updateFacility(id: string, patch: Partial<Facility>): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().updateOne({ _id: new ObjectId(id) }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteFacility(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
