import { NotFoundError } from "../../core/errors/http-error.js";
import { findAllMembers, findMemberById } from "./member.model.js";
import type { Member } from "./member.schema.js";

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
