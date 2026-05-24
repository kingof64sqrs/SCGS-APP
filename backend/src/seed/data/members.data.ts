import type { Member } from "../../features/members/member.schema.js";

const firstNames = [
  "Praful", "Rajesh", "Yashwant", "Vijay", "Manish", "Vipul", "Rajan", "Harshad",
  "Chandrakant", "Dilip", "Hemant", "Hiren", "Nainesh", "Sachin", "Amit", "Bhavesh",
  "Jignesh", "Ketan", "Mehul", "Nilesh", "Paresh", "Tushar", "Kiran", "Falguni",
  "Hetal", "Jyoti", "Nisha", "Rekha", "Sejal", "Trupti",
];

const lastNames = [
  "Patel", "Shah", "Modi", "Dave", "Vyas", "Joshi", "Thakker", "Tanna",
  "Kotecha", "Sejpal", "Mehta", "Desai", "Trivedi", "Parikh", "Gandhi",
];

const addresses = [
  "No. 662, Mettupalayam Rd, R.S. Puram, Coimbatore - 641002",
  "12, Cross Cut Rd, Gandhipuram, Coimbatore - 641012",
  "45, DB Road, R.S. Puram, Coimbatore - 641002",
  "8, Avinashi Rd, Peelamedu, Coimbatore - 641004",
  "23, Trichy Rd, Ramanathapuram, Coimbatore - 641045",
  "5, Bharathi Park Rd, Saibaba Colony, Coimbatore - 641011",
  "19, Thadagam Rd, Edayarpalayam, Coimbatore - 641025",
  "77, 100 Feet Rd, Gandhipuram, Coimbatore - 641012",
];

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

/** Generate `count` random members with sequential samajIds (SCGS-0001 ...). */
export function generateMembers(count: number): Member[] {
  const members: Member[] = [];
  for (let i = 1; i <= count; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    members.push({
      samajId: `SCGS-${String(i).padStart(4, "0")}`,
      name: `${first} ${last}`,
      phone: `+91 9${randomDigits(9)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${10 + Math.floor(Math.random() * 90)}@gmail.com`,
      address: pick(addresses),
      bloodGroup: pick(bloodGroups),
    });
  }
  return members;
}

/** Random dummy contact details (for governing-body members added to the directory). */
export function randomContact(): { phone: string; address: string; bloodGroup: string } {
  return {
    phone: `+91 9${randomDigits(9)}`,
    address: pick(addresses),
    bloodGroup: pick(bloodGroups),
  };
}

/** Derive a unique login email from a person's name + a numeric suffix. */
export function emailFromName(name: string, suffix: number): string {
  const local =
    name
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(".") || "member";
  return `${local}${suffix}@scgs.org`;
}
