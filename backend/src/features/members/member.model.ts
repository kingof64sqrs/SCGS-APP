import type { Collection } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import type { Member } from "./member.schema.js";

const COLLECTION = "members";

/** Fields returned to clients (drops Mongo's internal _id). */
const PROJECTION = {
  _id: 0,
  samajId: 1,
  name: 1,
  phone: 1,
  email: 1,
  address: 1,
  bloodGroup: 1,
} as const;

export function membersCollection(): Collection<Member> {
  return getDb().collection<Member>(COLLECTION);
}

export function findAllMembers(): Promise<Member[]> {
  return membersCollection()
    .find({}, { projection: PROJECTION })
    .sort({ samajId: 1 })
    .toArray();
}

export function findMemberById(samajId: string): Promise<Member | null> {
  return membersCollection().findOne({ samajId }, { projection: PROJECTION });
}
