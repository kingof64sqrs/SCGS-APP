import { getDb } from "../../infrastructure/database/mongo.js";
import type { Facility } from "./facilities.schema.js";

const COLLECTION = "facilities";

export function findAllFacilities(): Promise<Facility[]> {
  return getDb()
    .collection<Facility>(COLLECTION)
    .find({}, { projection: { _id: 0, name: 1, description: 1 } })
    .toArray();
}
