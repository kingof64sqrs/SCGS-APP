import type { Collection } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import type { Member, MemberDoc, MemberPhoto } from "./member.schema.js";

const COLLECTION = "members";

/** Public fields only — drops _id, passwordHash and the (large) photo blob. */
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

/** Auth lookup — keeps passwordHash, excludes _id and the photo blob. */
export function findMemberByEmail(email: string): Promise<MemberDoc | null> {
  return membersCollection().findOne({ email }, { projection: { _id: 0, photo: 0 } });
}

/** Just the stored photo for a member (or null if none). */
export async function findMemberPhoto(samajId: string): Promise<MemberPhoto | null> {
  const doc = await membersCollection().findOne({ samajId }, { projection: { _id: 0, photo: 1 } });
  return doc?.photo ?? null;
}
