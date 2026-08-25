/**
 * Import members from the SCGS Excel roster.
 *
 * Every data row in the sheet becomes a member. The phone number is the
 * member's login identifier and (initially) their password, and every imported
 * member has mustChangePassword=true so they're forced through the
 * change-password flow at first login.
 *
 * Rows in the roster that have no usable phone number are still imported — they
 * belong in the directory — but they get an unguessable random password, so
 * they simply cannot log in until an admin adds their phone.
 *
 *   npm run import           # uses samaj_members_template.xlsx in repo root
 *   npm run import path.xlsx # custom file path
 *
 * NOTE: this replaces the whole members collection. Portraits of governing-body
 * members are carried across, since the app resolves their photo through the
 * members collection (governingBody.samajId -> member.photo).
 */

import crypto from "node:crypto";

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
  return String(v).trim().replace(/\s+/g, " ");
}

/**
 * Loose key for matching the same person across the roster and the existing
 * database: case/punctuation-insensitive, and order-insensitive because the
 * roster writes "Sejpal Praful H" where the governing-body list writes
 * "Praful H. Sejpal". Single-letter initials are dropped — they are the part
 * that differs most between the two spellings.
 */
function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .sort()
    .join(" ");
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
          // "Phone Number" and "Whatsapp Number" both start with a digit-ish
          // word, so match them explicitly rather than by prefix.
          phone: cells.findIndex((c) => c.includes("phone")),
          whatsapp: cells.findIndex((c) => c.includes("whatsapp")),
          email: cells.findIndex((c) => c.includes("email")),
          bloodGroup: cells.findIndex((c) => c.includes("blood")),
          address: cells.findIndex((c) => c.includes("address")),
        },
      };
    }
  }
  throw new Error("Could not locate the Samaj_Id/Name header row in the spreadsheet.");
}

/** How much real content a row carries — used to pick the better of two rows sharing an id. */
function richness(m: MemberDoc): number {
  return [m.phone, m.email, m.address, m.bloodGroup, m.whatsapp].filter(Boolean).length;
}

/**
 * Fill the next free id in the same series as `previous` ("L A-78" -> "L A-79").
 * The roster has occasional rows whose Samaj_Id cell was left blank.
 */
function nextIdInSeries(previous: string, taken: Set<string>): string | null {
  const m = previous.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  for (let n = Number(m[2]) + 1; n < Number(m[2]) + 50; n++) {
    const candidate = `${m[1]}${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return null;
}

async function main(): Promise<void> {
  const file = process.argv[2] ?? DEFAULT_FILE;
  console.log(`Reading ${file}`);
  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null, raw: true });

  const { index: headerRow, cols } = findHeader(rows);
  const at = (r: Row, key: keyof typeof cols) => (cols[key] >= 0 ? r[cols[key]] : null);

  /** samajId -> member, so a repeated id resolves to the better-populated row. */
  const byId = new Map<string, MemberDoc>();
  const taken = new Set<string>();

  let dataRows = 0;
  let sectionRows = 0;
  let mergedDuplicates = 0;
  let splitDuplicates = 0;
  let generatedIds = 0;
  let withoutPhone = 0;
  let lastId = "";

  for (let i = headerRow + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    let samajId = asString(at(r, "samajId"));
    const name = asString(at(r, "name"));

    // Section banners ("LIFE MEMBER") and the header row repeated mid-sheet.
    if (!name || samajId.toLowerCase() === "samaj_id") {
      if (name || samajId) sectionRows++;
      continue;
    }
    dataRows++;

    if (!samajId) {
      const generated = nextIdInSeries(lastId, taken);
      if (!generated) {
        console.warn(`  ! row ${i + 1}: no Samaj_Id and no series to continue — skipped (${name})`);
        continue;
      }
      samajId = generated;
      generatedIds++;
      console.log(`  · row ${i + 1}: blank Samaj_Id -> ${samajId} (${name})`);
    }

    const phone = normalizePhone(at(r, "phone"));
    const member: MemberDoc = {
      samajId,
      name,
      phone,
      email: asString(at(r, "email")).toLowerCase(),
      address: asString(at(r, "address")),
      bloodGroup: asString(at(r, "bloodGroup")),
      whatsapp: normalizePhone(at(r, "whatsapp")),
      // Phone doubles as the initial password. No phone -> no way in until an
      // admin sets one; a random secret keeps the account unusable meanwhile.
      passwordHash: hashPassword(phone || crypto.randomBytes(24).toString("hex")),
      mustChangePassword: true,
    };
    if (!phone) withoutPhone++;

    const existing = byId.get(samajId);
    if (existing) {
      if (nameKey(existing.name) === nameKey(name)) {
        // Same person listed twice — keep whichever row carries more detail.
        mergedDuplicates++;
        if (richness(member) > richness(existing)) byId.set(samajId, member);
      } else {
        // Two different people sharing an id (roster typo) — keep both.
        let suffixed = `${samajId}-2`;
        for (let n = 3; taken.has(suffixed); n++) suffixed = `${samajId}-${n}`;
        member.samajId = suffixed;
        byId.set(suffixed, member);
        taken.add(suffixed);
        splitDuplicates++;
        console.log(`  · row ${i + 1}: duplicate id ${samajId} for a different person -> ${suffixed} (${name})`);
      }
    } else {
      byId.set(samajId, member);
      taken.add(samajId);
    }
    lastId = samajId;
  }

  const members = [...byId.values()];

  await connect();
  const members$ = membersCollection();

  // Governing-body portraits live on the member doc; keep them across the wipe.
  const gbDocs = await findAllGoverningBody();
  const gbSamajIds = gbDocs.map((g) => g.samajId).filter((id): id is string => !!id);
  const preserved = await members$
    .find({ samajId: { $in: gbSamajIds }, photo: { $exists: true } })
    .toArray();

  await members$.deleteMany({});
  if (members.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < members.length; i += CHUNK) {
      await members$.insertMany(members.slice(i, i + CHUNK));
    }
  }

  // Re-attach preserved portraits to the imported member of the same name;
  // if that person is not in the roster at all, keep their original record.
  const importedByName = new Map<string, MemberDoc>();
  for (const m of members) importedByName.set(nameKey(m.name), m);

  let photosMatched = 0;
  let photosKept = 0;
  for (const old of preserved) {
    const match = importedByName.get(nameKey(old.name));
    if (match) {
      await members$.updateOne({ samajId: match.samajId }, { $set: { photo: old.photo } });
      photosMatched++;
    } else if (!taken.has(old.samajId)) {
      await members$.insertOne(old);
      taken.add(old.samajId);
      importedByName.set(nameKey(old.name), old);
      photosKept++;
    }
  }

  await members$.createIndex({ samajId: 1 }, { unique: true });
  // Phone is NOT unique: families in the roster share a landline/mobile.
  await members$.createIndex({ phone: 1 });
  await members$.createIndex({ email: 1 });

  // Re-link governing-body docs to the imported members by name (best-effort).
  let linked = 0;
  let unlinked = 0;
  for (const g of gbDocs) {
    const match = importedByName.get(nameKey(g.name));
    await governingBodyCollection().updateOne(
      { name: g.name, position: g.position, group: g.group },
      match ? { $set: { samajId: match.samajId } } : { $unset: { samajId: "" } },
    );
    if (match) linked++;
    else unlinked++;
  }

  const total = await members$.countDocuments();
  console.log("\nImport complete:");
  console.log(`  data rows read:      ${dataRows}`);
  console.log(`  section/banner rows: ${sectionRows} (ignored)`);
  console.log(`  duplicate ids merged:${mergedDuplicates}`);
  console.log(`  duplicate ids split: ${splitDuplicates}`);
  console.log(`  blank ids generated: ${generatedIds}`);
  console.log(`  members in database: ${total}`);
  console.log(`  without a phone:     ${withoutPhone} (in the directory, cannot log in yet)`);
  console.log(`  portraits:           ${photosMatched} re-attached, ${photosKept} records kept`);
  console.log(`  governing-body:      ${linked} linked, ${unlinked} unlinked`);
  console.log(`  password:            each member's phone (mustChangePassword=true)`);
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
