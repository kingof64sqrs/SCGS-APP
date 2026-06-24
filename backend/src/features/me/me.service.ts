import { BadRequestError, NotFoundError, UnauthorizedError } from "../../core/errors/http-error.js";
import { hashPassword, verifyPassword } from "../../core/security/password.js";
import {
  findMemberById,
  findMemberDocById,
  setMemberPassword,
  updateMember,
  updateMemberPhoto,
} from "../members/member.model.js";
import type { Member } from "../members/member.schema.js";
import type { ChangePasswordInput, UpdatePhotoInput, UpdateProfileInput } from "./me.schema.js";

export async function getMe(samajId: string): Promise<Member> {
  const member = await findMemberById(samajId);
  if (!member) throw new NotFoundError("Member not found");
  return member;
}

export async function updateMe(samajId: string, patch: UpdateProfileInput): Promise<Member> {
  const ok = await updateMember(samajId, patch);
  if (!ok) throw new NotFoundError("Member not found");
  return getMe(samajId);
}

export async function updateMyPhoto(samajId: string, photo: UpdatePhotoInput): Promise<void> {
  const ok = await updateMemberPhoto(samajId, photo);
  if (!ok) throw new NotFoundError("Member not found");
}

/**
 * Self-service password change.
 * - Forced flow (mustChangePassword=true): no current-password check.
 * - Voluntary flow (mustChangePassword=false): currentPassword must match.
 * Either way, the flag is cleared on success.
 */
export async function changeMyPassword(
  samajId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const doc = await findMemberDocById(samajId);
  if (!doc) throw new NotFoundError("Member not found");

  if (!doc.mustChangePassword) {
    if (!input.currentPassword) {
      throw new BadRequestError("Current password is required");
    }
    if (!verifyPassword(input.currentPassword, doc.passwordHash)) {
      throw new UnauthorizedError("Current password is incorrect");
    }
  }

  await setMemberPassword(samajId, hashPassword(input.password), false);
}
