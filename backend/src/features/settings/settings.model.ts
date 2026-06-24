import { getDb } from "../../infrastructure/database/mongo.js";

const COLLECTION = "settings";
const SINGLETON_KEY = "app";

interface SettingsDoc {
  key: string;
  adminKey?: string;
}

function collection() {
  return getDb().collection<SettingsDoc>(COLLECTION);
}

/** Get the admin-key override stored in Mongo (if any). */
export async function getAdminKeyOverride(): Promise<string | null> {
  const doc = await collection().findOne({ key: SINGLETON_KEY });
  return doc?.adminKey ?? null;
}

/** Store an admin-key override. Passing null clears it. */
export async function setAdminKeyOverride(value: string | null): Promise<void> {
  if (value === null) {
    await collection().updateOne({ key: SINGLETON_KEY }, { $unset: { adminKey: "" } });
    return;
  }
  await collection().updateOne(
    { key: SINGLETON_KEY },
    { $set: { adminKey: value } },
    { upsert: true },
  );
}
