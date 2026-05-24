import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash a password with scrypt + a random per-password salt.
 * Stored format: "<saltHex>:<hashHex>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Verify a plaintext password against a stored "salt:hash" value. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const computed = scryptSync(password, salt, 64);
  return hashBuffer.length === computed.length && timingSafeEqual(hashBuffer, computed);
}
