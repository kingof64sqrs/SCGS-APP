import { z } from "zod";

const REQUIRED = "Email and password are required";

/** Validation schema for POST /api/auth/login. */
export const loginSchema = z.object({
  email: z
    .string({ required_error: REQUIRED, invalid_type_error: REQUIRED })
    .trim()
    .min(1, REQUIRED),
  password: z
    .string({ required_error: REQUIRED, invalid_type_error: REQUIRED })
    .min(1, REQUIRED),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface LoginUser {
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: LoginUser;
}
