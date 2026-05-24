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

/** Download an image from a URL and return it base64-encoded for inline storage in Mongo. */
async function fetchImage(url: string): Promise<MemberPhoto | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return undefined;
    const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return { contentType, base64 };
  } catch {
    return undefined;
  }
}

const pravatar = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

async function seed(): Promise<void> {
  await connect();
  const db = getDb();
  console.log("Connected to MongoDB for seeding.");

  // 1) Ten random directory members (placeholder portraits).
  const baseMembers = generateMembers(10).map((m) => memberSchema.parse(m));
  const randomMembers: MemberDoc[] = await Promise.all(
    baseMembers.map(async (m, i) => {
      const photo = await fetchImage(pravatar(i + 1));
      return { ...m, passwordHash: hashPassword(DEMO_PASSWORD), ...(photo ? { photo } : {}) };
    }),
  );

  // 2) Governing-body people are also directory members — with their REAL photos
  //    downloaded from the SCGS site and stored in MongoDB (no external URL at runtime).
  const firstByName = new Map<string, GoverningBodyMember>();
  for (const g of governingBody) if (!firstByName.has(g.name)) firstByName.set(g.name, g);
  const uniqueGB = [...firstByName.values()];

  const nameToSamajId = new Map<string, string>();
  const gbMembers: MemberDoc[] = await Promise.all(
    uniqueGB.map(async (g, i) => {
      const num = 10 + i + 1;
      const samajId = `SCGS-${String(num).padStart(4, "0")}`;
      nameToSamajId.set(g.name, samajId);
      const contact = randomContact();
      const photo = (await fetchImage(g.photoUrl)) ?? (await fetchImage(pravatar(num)));
      return {
        samajId,
        name: g.name,
        email: emailFromName(g.name, num),
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

  // 3) Governing-body docs, each linked to its member via samajId.
  const governing: GoverningBodyMember[] = governingBody.map((g) => ({
    ...governingBodyMemberSchema.parse(g),
    samajId: nameToSamajId.get(g.name),
  }));

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
  console.log(`  governingBody:  ${gbResult.insertedCount} (linked to members via samajId)`);
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
