import { z } from "zod";

import type { Member } from "../members/member.schema.js";

const REQUIRED = "Phone (or email) and password are required";

/** Validation schema for POST /api/auth/login. The identifier may be a phone or email. */
export const loginSchema = z.object({
  identifier: z
    .string({ required_error: REQUIRED, invalid_type_error: REQUIRED })
    .trim()
    .min(1, REQUIRED),
  password: z
    .string({ required_error: REQUIRED, invalid_type_error: REQUIRED })
    .min(1, REQUIRED),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Authenticated user profile (the member who logged in). */
/** The authenticated member's full profile (all fields they can see/edit). */
export interface AuthUser extends Member {
  /** Force the client to push the user through a "set new password" flow. */
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface DemoAccount {
  name: string;
  phone: string;
}
