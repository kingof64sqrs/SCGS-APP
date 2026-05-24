import { MongoClient, type Db } from "mongodb";

import { env } from "../../config/env.js";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect once at startup. A single pooled MongoClient is reused across all
 * requests (the native driver pools connections internally — maxPoolSize: 100).
 */
export async function connect(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(env.mongoUri, { maxPoolSize: 100 });
  await client.connect();
  db = client.db(env.dbName);
  return db;
}

/** Return the shared Db. Throws if connect() has not been called yet. */
export function getDb(): Db {
  if (!db) {
    throw new Error("Database not connected. Call connect() first.");
  }
  return db;
}

/** Close the shared client (graceful shutdown and the seed script). */
export async function close(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
