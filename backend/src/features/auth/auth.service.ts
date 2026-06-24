import { UnauthorizedError } from "../../core/errors/http-error.js";
import { verifyPassword } from "../../core/security/password.js";
import { createToken } from "../../core/security/token.js";
import {
  findAllMembers,
  findMemberByEmail,
  findMemberByPhone,
  normalizePhone,
} from "../members/member.model.js";
import type { AuthUser, DemoAccount, LoginInput, LoginResponse } from "./auth.schema.js";

/**
 * Authenticate a member by phone or email + password. After the Excel import
 * every member's default password is their own phone number; the response sets
 * `mustChangePassword=true` until the member sets their own.
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const id = input.identifier.trim();
  const normalized = normalizePhone(id);

  const member =
    (normalized ? await findMemberByPhone(normalized) : null) ??
    (id.includes("@") ? await findMemberByEmail(id.toLowerCase()) : null);

  if (!member || !verifyPassword(input.password, member.passwordHash)) {
    throw new UnauthorizedError("Invalid phone/email or password");
  }

  const user: AuthUser = {
    samajId: member.samajId,
    name: member.name,
    email: member.email ?? "",
    phone: member.phone ?? "",
    address: member.address ?? "",
    bloodGroup: member.bloodGroup ?? "",
    mustChangePassword: !!member.mustChangePassword,
  };

  return { token: createToken(member.samajId), user };
}

/**
 * Demo helper: list a small sample of accounts (name + phone) so testers can
 * see real phone-based logins in the login screen.
 */
export async function listDemoAccounts(): Promise<DemoAccount[]> {
  const members = await findAllMembers();
  return members
    .filter((m) => m.phone)
    .slice(0, 12)
    .map((m) => ({ name: m.name, phone: m.phone }));
}
