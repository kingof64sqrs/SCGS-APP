import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../../config/env.js";

function sign(payload: string): string {
  return createHmac("sha256", env.tokenSecret).update(payload).digest("base64url");
}

/**
 * Stateless session token that ties a login to a member's samajId.
 * Format: "<base64url(samajId)>.<hmac>". Survives restarts (no server state).
 */
export function createToken(samajId: string): string {
  const payload = Buffer.from(samajId, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verify a token and return the samajId it belongs to, or null if invalid. */
export function verifyToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return Buffer.from(payload, "base64url").toString("utf8");
}
