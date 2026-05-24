import { NotFoundError } from "../../core/errors/http-error.js";
import { findMemberById, updateMember, updateMemberPhoto } from "../members/member.model.js";
import type { Member } from "../members/member.schema.js";
import type { UpdatePhotoInput, UpdateProfileInput } from "./me.schema.js";

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
