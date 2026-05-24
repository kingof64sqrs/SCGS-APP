import { hashPassword } from "../core/security/password.js";
import type { AboutContent } from "../features/about/about.schema.js";
import { aboutSchema } from "../features/about/about.schema.js";
import type { Facility } from "../features/facilities/facilities.schema.js";
import { facilitySchema } from "../features/facilities/facilities.schema.js";
import type { GoverningBodyMember } from "../features/governing-body/governing-body.schema.js";
import { governingBodyMemberSchema } from "../features/governing-body/governing-body.schema.js";
import type { MemberDoc, MemberPhoto } from "../features/members/member.schema.js";
import { memberSchema } from "../features/members/member.schema.js";
import { close, connect, getDb } from "../infrastructure/database/mongo.js";
import { about } from "./data/about.data.js";
import { facilities } from "./data/facilities.data.js";
import { governingBody } from "./data/governing-body.data.js";
import { emailFromName, generateMembers, randomContact } from "./data/members.data.js";

/** Shared demo password for every seeded member. */
const DEMO_PASSWORD = "test123";

/** Download a portrait and return it base64-encoded for inline storage in Mongo. */
async function fetchPhoto(index: number): Promise<MemberPhoto | undefined> {
  try {
    const res = await fetch(`https://i.pravatar.cc/300?img=${index}`);
    if (!res.ok) return undefined;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return { contentType, base64 };
  } catch {
    return undefined;
  }
}

async function seed(): Promise<void> {
  await connect();
  const db = getDb();
  console.log("Connected to MongoDB for seeding.");

  // 1) Ten random directory members.
  const baseMembers = generateMembers(10).map((m) => memberSchema.parse(m));
  const randomMembers: MemberDoc[] = await Promise.all(
    baseMembers.map(async (m, i) => {
      const photo = await fetchPhoto(i + 1);
      return { ...m, passwordHash: hashPassword(DEMO_PASSWORD), ...(photo ? { photo } : {}) };
    }),
  );

  // 2) Governing-body people also appear in the directory (dedup by name) with dummy details.
  const governing: GoverningBodyMember[] = governingBody.map((g) =>
    governingBodyMemberSchema.parse(g),
  );
  const seen = new Set<string>();
  const uniqueGB = governing.filter((g) => (seen.has(g.name) ? false : (seen.add(g.name), true)));
  const gbMembers: MemberDoc[] = await Promise.all(
    uniqueGB.map(async (g, i) => {
      const samajNum = 10 + i + 1;
      const contact = randomContact();
      const photo = await fetchPhoto(samajNum);
      return {
        samajId: `SCGS-${String(samajNum).padStart(4, "0")}`,
        name: g.name,
        email: emailFromName(g.name, samajNum),
        phone: contact.phone,
        address: contact.address,
        bloodGroup: contact.bloodGroup,
        passwordHash: hashPassword(DEMO_PASSWORD),
        ...(photo ? { photo } : {}),
      };
    }),
  );

  const members = [...randomMembers, ...gbMembers];
  const photosStored = members.filter((m) => m.photo).length;

  const aboutDoc: AboutContent = aboutSchema.parse(about);
  const facilityDocs: Facility[] = facilities.map((f) => facilitySchema.parse(f));

  // Wipe existing data.
  await Promise.all([
    db.collection("members").deleteMany({}),
    db.collection("governingBody").deleteMany({}),
    db.collection("about").deleteMany({}),
    db.collection("facilities").deleteMany({}),
  ]);

  // Insert fresh data.
  const membersResult = await db.collection<MemberDoc>("members").insertMany(members);
  const gbResult = await db.collection<GoverningBodyMember>("governingBody").insertMany(governing);
  await db.collection<AboutContent>("about").insertOne(aboutDoc);
  const facilitiesResult = await db.collection<Facility>("facilities").insertMany(facilityDocs);

  // Indexes: unique samajId, plus email for login lookups.
  await db.collection<MemberDoc>("members").createIndex({ samajId: 1 }, { unique: true });
  await db.collection<MemberDoc>("members").createIndex({ email: 1 });

  console.log("Seed complete:");
  console.log(
    `  members:        ${membersResult.insertedCount} (${randomMembers.length} random + ${gbMembers.length} governing-body; password "${DEMO_PASSWORD}")`,
  );
  console.log(`  member photos:  ${photosStored}/${members.length} stored in MongoDB`);
  console.log(`  governingBody:  ${gbResult.insertedCount}`);
  console.log(`  about:          1`);
  console.log(`  facilities:     ${facilitiesResult.insertedCount}`);
  console.log("  indexes:        unique members.samajId, members.email");
}

seed()
  .then(async () => {
    await close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await close();
    process.exit(1);
  });
