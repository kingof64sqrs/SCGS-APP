import { type Collection, ObjectId } from "mongodb";

import { getDb } from "../../infrastructure/database/mongo.js";
import { membersCollection } from "../members/member.model.js";

const COLLECTION = "notifications";

export type NotificationType = "event" | "broadcast";

export interface NotificationDoc {
  title: string;
  body: string;
  type: NotificationType;
  /** Optional linked resource (e.g. event id). */
  refId?: string;
  createdAt: string;
  /** samajIds that have read this notification. */
  readBy: string[];
}

export interface NotificationPublic {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  refId?: string;
  createdAt: string;
  read: boolean;
}

function notificationsCollection(): Collection<NotificationDoc> {
  return getDb().collection<NotificationDoc>(COLLECTION);
}

export async function insertNotification(
  doc: Omit<NotificationDoc, "readBy">,
): Promise<string> {
  const res = await notificationsCollection().insertOne({ ...doc, readBy: [] });
  return res.insertedId.toString();
}

/** Latest notifications with a per-member read flag. */
export async function listNotificationsForMember(
  samajId: string,
  limit = 50,
): Promise<{ items: NotificationPublic[]; unread: number }> {
  const docs = await notificationsCollection()
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const items = docs.map((d) => ({
    id: (d._id as ObjectId).toString(),
    title: d.title,
    body: d.body,
    type: d.type,
    refId: d.refId,
    createdAt: d.createdAt,
    read: (d.readBy ?? []).includes(samajId),
  }));

  const unread = await notificationsCollection().countDocuments({
    readBy: { $ne: samajId },
  });

  return { items, unread };
}

/** Mark one or all notifications read for a member. */
export async function markRead(samajId: string, id?: string): Promise<void> {
  if (id) {
    if (!ObjectId.isValid(id)) return;
    await notificationsCollection().updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { readBy: samajId } },
    );
  } else {
    await notificationsCollection().updateMany(
      { readBy: { $ne: samajId } },
      { $addToSet: { readBy: samajId } },
    );
  }
}

// --- Push token registry (stored on member docs) ---

/** Add an Expo push token to a member (dedup via $addToSet). */
export async function addPushToken(samajId: string, token: string): Promise<void> {
  await membersCollection().updateOne(
    { samajId },
    { $addToSet: { pushTokens: token } },
  );
}

export async function removePushToken(samajId: string, token: string): Promise<void> {
  await membersCollection().updateOne(
    { samajId },
    { $pull: { pushTokens: token } },
  );
}

/** All registered push tokens across every member. */
export async function allPushTokens(): Promise<string[]> {
  const docs = await membersCollection()
    .find({ pushTokens: { $exists: true, $ne: [] } }, { projection: { _id: 0, pushTokens: 1 } })
    .toArray();
  const tokens: string[] = [];
  for (const d of docs) {
    const list = (d as { pushTokens?: string[] }).pushTokens;
    if (Array.isArray(list)) tokens.push(...list);
  }
  return tokens;
}
