/**
 * Import members from the SCGS Excel roster.
 *
 * Source rows must have a Samaj_Id, Name and Phone Number; the phone is the
 * member's login identifier and (initially) password. Every imported member
 * has mustChangePassword=true so they're forced through the change-password
 * flow at first login.
 *
 *   npm run import           # uses samaj_members_template.xlsx in repo root
 *   npm run import path.xlsx # custom file path
 */

import XLSX from "xlsx";

import { hashPassword } from "../core/security/password.js";
import {
  findAllGoverningBody,
  governingBodyCollection,
} from "../features/governing-body/governing-body.model.js";
import {
  normalizePhone,
  membersCollection,
} from "../features/members/member.model.js";
import type { MemberDoc } from "../features/members/member.schema.js";
import { close, connect } from "../infrastructure/database/mongo.js";

const DEFAULT_FILE = "/home/ubuntu/SCGS-APP/samaj_members_template.xlsx";

type Row = (string | number | null)[];

function asString(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function findHeader(rows: Row[]): { index: number; cols: Record<string, number> } {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const cells = rows[i].map((c) => asString(c).toLowerCase());
    const samajCol = cells.findIndex((c) => c === "samaj_id");
    const nameCol = cells.findIndex((c) => c === "name");
    if (samajCol >= 0 && nameCol >= 0) {
      return {
        index: i,
        cols: {
          samajId: samajCol,
          name: nameCol,
          phone: cells.findIndex((c) => c.startsWith("phone")),
          email: cells.findIndex((c) => c.includes("email")),
          bloodGroup: cells.findIndex((c) => c.includes("blood")),
          address: cells.findIndex((c) => c.includes("address")),
        },
      };
    }
  }
  throw new Error("Could not locate the Samaj_Id/Name header row in the spreadsheet.");
}

async function main(): Promise<void> {
  const file = process.argv[2] ?? DEFAULT_FILE;
  console.log(`Reading ${file}`);
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null, raw: true });

  const { index: headerRow, cols } = findHeader(rows);
  const at = (r: Row, key: keyof typeof cols) => (cols[key] >= 0 ? r[cols[key]] : null);

  const members: MemberDoc[] = [];
  const usedSamajIds = new Set<string>();
  const usedPhones = new Set<string>();

  let totalConsidered = 0;
  let skippedNoPhone = 0;
  let skippedDupSamajId = 0;
  let skippedDupPhone = 0;

  for (let i = headerRow + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const samajId = asString(at(r, "samajId")).replace(/\s+/g, " ").trim();
    const name = asString(at(r, "name"));
    // Skip section title / blank rows.
    if (!samajId || !name) continue;
    totalConsidered++;

    const phone = normalizePhone(at(r, "phone"));
    if (!phone) {
      skippedNoPhone++;
      continue;
    }
    if (usedSamajIds.has(samajId)) {
      skippedDupSamajId++;
      continue;
    }
    if (usedPhones.has(phone)) {
      skippedDupPhone++;
      continue;
    }
    usedSamajIds.add(samajId);
    usedPhones.add(phone);

    members.push({
      samajId,
      name,
      phone,
      email: asString(at(r, "email")).toLowerCase(),
      address: asString(at(r, "address")),
      bloodGroup: asString(at(r, "bloodGroup")),
      passwordHash: hashPassword(phone),
      mustChangePassword: true,
    });
  }

  await connect();
  const members$ = membersCollection();
  await members$.deleteMany({});
  if (members.length > 0) {
    // Bulk insert in chunks (mongo limits ~16MB per batch — we're far under that).
    const CHUNK = 500;
    for (let i = 0; i < members.length; i += CHUNK) {
      await members$.insertMany(members.slice(i, i + CHUNK));
    }
  }
  await members$.createIndex({ samajId: 1 }, { unique: true });
  await members$.createIndex({ phone: 1 });
  await members$.createIndex({ email: 1 });

  // Re-link governing-body docs to the imported members by name (best-effort).
  const lookup = new Map<string, string>();
  for (const m of members) lookup.set(m.name.toLowerCase(), m.samajId);
  const gbDocs = await findAllGoverningBody();
  let linked = 0;
  let unlinked = 0;
  for (const g of gbDocs) {
    const match = lookup.get(g.name.toLowerCase());
    await governingBodyCollection().updateOne(
      { name: g.name, position: g.position, group: g.group },
      match ? { $set: { samajId: match } } : { $unset: { samajId: "" } },
    );
    if (match) linked++;
    else unlinked++;
  }

  console.log("\nImport complete:");
  console.log(`  rows considered:    ${totalConsidered}`);
  console.log(`  inserted members:   ${members.length}`);
  console.log(`  skipped (no phone): ${skippedNoPhone}`);
  console.log(`  skipped (dup id):   ${skippedDupSamajId}`);
  console.log(`  skipped (dup ph):   ${skippedDupPhone}`);
  console.log(`  governing-body:     ${linked} linked, ${unlinked} unlinked`);
  console.log(`  password:           each member's phone (mustChangePassword=true)`);
}

main()
  .then(async () => {
    await close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Import failed:", err);
    await close();
    process.exit(1);
  });
