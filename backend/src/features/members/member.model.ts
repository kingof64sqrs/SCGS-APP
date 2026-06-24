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

/** Normalize a phone string to its last-10 digits (drops country code, spaces, hyphens). */
export function normalizePhone(input: unknown): string {
  if (input == null) return "";
  const digits = String(input).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
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

/** Auth lookup by email — keeps passwordHash + mustChangePassword, drops photo blob. */
export function findMemberByEmail(email: string): Promise<MemberDoc | null> {
  return membersCollection().findOne({ email }, { projection: { _id: 0, photo: 0 } });
}

/** Auth lookup by normalized phone — keeps passwordHash + mustChangePassword, drops photo blob. */
export function findMemberByPhone(phone: string): Promise<MemberDoc | null> {
  return membersCollection().findOne({ phone }, { projection: { _id: 0, photo: 0 } });
}

/** Just the stored photo for a member (or null if none). */
export async function findMemberPhoto(samajId: string): Promise<MemberPhoto | null> {
  const doc = await membersCollection().findOne({ samajId }, { projection: { _id: 0, photo: 1 } });
  return doc?.photo ?? null;
}

// --- Mutations (admin + self-service) ---

/** Next sequential samajId for admin-created members, e.g. "SCGS-0026". */
export async function nextSamajId(): Promise<string> {
  const [last] = await membersCollection()
    .find({ samajId: { $regex: /^SCGS-\d+/ } }, { projection: { _id: 0, samajId: 1 } })
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

/** Set a member's password hash, with an explicit mustChangePassword flag. */
export async function setMemberPassword(
  samajId: string,
  passwordHash: string,
  mustChangePassword: boolean,
): Promise<boolean> {
  const result = await membersCollection().updateOne(
    { samajId },
    { $set: { passwordHash, mustChangePassword } },
  );
  return result.matchedCount > 0;
}

export async function updateMemberPhoto(samajId: string, photo: MemberPhoto): Promise<boolean> {
  const result = await membersCollection().updateOne({ samajId }, { $set: { photo } });
  return result.matchedCount > 0;
}

export async function emailExists(email: string, exceptSamajId?: string): Promise<boolean> {
  if (!email) return false;
  const filter: Filter<MemberDoc> = { email };
  if (exceptSamajId) filter.samajId = { $ne: exceptSamajId };
  return (await membersCollection().countDocuments(filter)) > 0;
}

export async function phoneExists(phone: string, exceptSamajId?: string): Promise<boolean> {
  if (!phone) return false;
  const filter: Filter<MemberDoc> = { phone };
  if (exceptSamajId) filter.samajId = { $ne: exceptSamajId };
  return (await membersCollection().countDocuments(filter)) > 0;
}
