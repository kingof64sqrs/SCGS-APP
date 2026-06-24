import { NotFoundError } from "../../core/errors/http-error.js";
import {
  findAllMembers,
  findMemberById,
  findMemberPhoto,
  findMembersPage,
} from "./member.model.js";
import type { Member, MemberPhoto } from "./member.schema.js";

export interface PagedMembers {
  items: Member[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function listMembers(): Promise<Member[]> {
  return findAllMembers();
}

/** Paginated, optionally filtered listing for the directory + admin table. */
export async function listMembersPaged(opts: {
  page: number;
  limit: number;
  q?: string;
}): Promise<PagedMembers> {
  const { items, total } = await findMembersPage(opts);
  return {
    items,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
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
