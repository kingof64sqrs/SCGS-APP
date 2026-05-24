import { findAllGoverningBody } from "./governing-body.model.js";
import type { GoverningBodyGroup } from "./governing-body.schema.js";

/** Stable display order for the groups. */
const GROUP_ORDER = [
  "Office Bearers",
  "Members of the Governing Body",
  "S.B.K.V Trustees (Represented by SCGS)",
];

function rank(group: string): number {
  const i = GROUP_ORDER.indexOf(group);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/** Fetch all governing-body members and group them for the client (photo via samajId). */
export async function listGoverningBody(): Promise<GoverningBodyGroup[]> {
  const docs = await findAllGoverningBody();

  const byGroup = new Map<string, GoverningBodyGroup["members"]>();
  for (const doc of docs) {
    if (!byGroup.has(doc.group)) byGroup.set(doc.group, []);
    byGroup.get(doc.group)!.push({
      name: doc.name,
      position: doc.position,
      samajId: doc.samajId,
    });
  }

  return [...byGroup.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map((group) => ({ group, members: byGroup.get(group)! }));
}
