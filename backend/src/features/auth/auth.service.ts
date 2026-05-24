import { UnauthorizedError } from "../../core/errors/http-error.js";
import { verifyPassword } from "../../core/security/password.js";
import { createToken } from "../../core/security/token.js";
import { findAllMembers, findMemberByEmail } from "../members/member.model.js";
import type { AuthUser, DemoAccount, LoginInput, LoginResponse } from "./auth.schema.js";

/**
 * Authenticate a member by email + password. Every member shares the demo
 * password "test123" (see the seed). Returns a token plus the member profile.
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const member = await findMemberByEmail(input.email.toLowerCase());
  if (!member || !verifyPassword(input.password, member.passwordHash)) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const user: AuthUser = {
    samajId: member.samajId,
    name: member.name,
    email: member.email,
    phone: member.phone,
    address: member.address,
    bloodGroup: member.bloodGroup,
  };

  return { token: createToken(member.samajId), user };
}

/** Demo helper: list member accounts (name + email) for the login screen. */
export async function listDemoAccounts(): Promise<DemoAccount[]> {
  const members = await findAllMembers();
  return members.map((m) => ({ name: m.name, email: m.email }));
}
