import type { Collection } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import type { Member, MemberDoc } from "./member.schema.js";

const COLLECTION = "members";

/** Public fields only — drops Mongo's _id and the passwordHash. */
const PUBLIC_PROJECTION = {
  _id: 0,
  samajId: 1,
  name: 1,
  phone: 1,
  email: 1,
  address: 1,
  bloodGroup: 1,
} as const;

export function membersCollection(): Collection<MemberDoc> {
  return getDb().collection<MemberDoc>(COLLECTION);
}

export function findAllMembers(): Promise<Member[]> {
  return membersCollection()
    .find({}, { projection: PUBLIC_PROJECTION })
    .sort({ samajId: 1 })
    .toArray();
}

export function findMemberById(samajId: string): Promise<Member | null> {
  return membersCollection().findOne({ samajId }, { projection: PUBLIC_PROJECTION });
}

/** Includes the passwordHash — used only for authentication. */
export function findMemberByEmail(email: string): Promise<MemberDoc | null> {
  return membersCollection().findOne({ email }, { projection: { _id: 0 } });
}
