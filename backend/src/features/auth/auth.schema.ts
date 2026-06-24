import { z } from "zod";

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
export interface AuthUser {
  samajId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  bloodGroup: string;
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
