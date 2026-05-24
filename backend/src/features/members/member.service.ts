import { NotFoundError } from "../../core/errors/http-error.js";
import { findAllMembers, findMemberById, findMemberPhoto } from "./member.model.js";
import type { Member, MemberPhoto } from "./member.schema.js";

export function listMembers(): Promise<Member[]> {
  return findAllMembers();
}

export async function getMember(samajId: string): Promise<Member> {
  const member = await findMemberById(samajId);
  if (!member) {
    throw new NotFoundError("Member not found");
  }
  return member;
}

export async function getMemberPhoto(samajId: string): Promise<MemberPhoto> {
  const photo = await findMemberPhoto(samajId);
  if (!photo) {
    throw new NotFoundError("Photo not found");
  }
  return photo;
}
