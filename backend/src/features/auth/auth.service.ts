import { randomBytes } from "node:crypto";

import type { LoginInput, LoginResponse } from "./auth.schema.js";

/** Derive a display name from the local-part of an email, title-cased. */
function deriveName(email: string): string {
  const localPart = email.split("@")[0] ?? email;
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * DUMMY auth: the input has already been validated (non-empty email + password),
 * so we simply mint a token and echo back a derived user profile.
 */
export function login(input: LoginInput): LoginResponse {
  return {
    token: randomBytes(24).toString("hex"),
    user: {
      name: deriveName(input.email),
      email: input.email,
    },
  };
}
