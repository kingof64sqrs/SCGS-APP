import { hashPassword } from "../core/security/password.js";
import type { AboutContent } from "../features/about/about.schema.js";
import { aboutSchema } from "../features/about/about.schema.js";
import type { Facility } from "../features/facilities/facilities.schema.js";
import { facilitySchema } from "../features/facilities/facilities.schema.js";
import type { GoverningBodyMember } from "../features/governing-body/governing-body.schema.js";
import { governingBodyMemberSchema } from "../features/governing-body/governing-body.schema.js";
import type { MemberDoc } from "../features/members/member.schema.js";
import { memberSchema } from "../features/members/member.schema.js";
import { close, connect, getDb } from "../infrastructure/database/mongo.js";
import { about } from "./data/about.data.js";
import { facilities } from "./data/facilities.data.js";
import { governingBody } from "./data/governing-body.data.js";
import { generateMembers } from "./data/members.data.js";

/** Shared demo password for every seeded member. */
const DEMO_PASSWORD = "test123";

async function seed(): Promise<void> {
  await connect();
  const db = getDb();
  console.log("Connected to MongoDB for seeding.");

  // Validate seed data against the feature schemas, then attach credentials.
  const members: MemberDoc[] = generateMembers(10).map((m) => ({
    ...memberSchema.parse(m),
    passwordHash: hashPassword(DEMO_PASSWORD),
  }));
  const governing: GoverningBodyMember[] = governingBody.map((g) =>
    governingBodyMemberSchema.parse(g),
  );
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
  console.log(`  members:        ${membersResult.insertedCount} (password for all: "${DEMO_PASSWORD}")`);
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
