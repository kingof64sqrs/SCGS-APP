import type { Collection, Filter } from "mongodb";

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

// --- Mutations (admin + self-service) ---

/** Next sequential samajId, e.g. "SCGS-0026". */
export async function nextSamajId(): Promise<string> {
  const [last] = await membersCollection()
    .find({}, { projection: { _id: 0, samajId: 1 } })
    .sort({ samajId: -1 })
    .limit(1)
    .toArray();
  const lastNum = last ? Number.parseInt(last.samajId.replace(/\D/g, ""), 10) || 0 : 0;
  return `SCGS-${String(lastNum + 1).padStart(4, "0")}`;
}

export async function insertMember(doc: MemberDoc): Promise<void> {
  await membersCollection().insertOne(doc);
}

export async function updateMember(samajId: string, patch: Partial<Member>): Promise<boolean> {
  const result = await membersCollection().updateOne({ samajId }, { $set: patch });
  return result.matchedCount > 0;
}

export async function deleteMember(samajId: string): Promise<boolean> {
  const result = await membersCollection().deleteOne({ samajId });
  return result.deletedCount > 0;
}

export async function setMemberPassword(samajId: string, passwordHash: string): Promise<boolean> {
  const result = await membersCollection().updateOne({ samajId }, { $set: { passwordHash } });
  return result.matchedCount > 0;
}

export async function updateMemberPhoto(samajId: string, photo: MemberPhoto): Promise<boolean> {
  const result = await membersCollection().updateOne({ samajId }, { $set: { photo } });
  return result.matchedCount > 0;
}

export async function emailExists(email: string, exceptSamajId?: string): Promise<boolean> {
  const filter: Filter<MemberDoc> = { email };
  if (exceptSamajId) filter.samajId = { $ne: exceptSamajId };
  return (await membersCollection().countDocuments(filter)) > 0;
}
