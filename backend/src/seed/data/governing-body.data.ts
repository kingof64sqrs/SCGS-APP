import type { GoverningBodyMember } from "../../features/governing-body/governing-body.schema.js";

const BASE = "https://gujaratisamajcoimbatore.org/data/uploads";

export const governingBody: GoverningBodyMember[] = [
  { name: "Praful H. Sejpal", position: "President", photoUrl: `${BASE}/president.jpg`, group: "Office Bearers" },
  { name: "Rajesh Kumar B. Modi", position: "Secretary", photoUrl: `${BASE}/m-5.jpg`, group: "Office Bearers" },
  { name: "Yashwant N. Dave", position: "Treasurer", photoUrl: `${BASE}/j-2.jpg`, group: "Office Bearers" },
  { name: "Vijay H. Patel", position: "1st Vice President & Hall Administration Wing Chairman", photoUrl: `${BASE}/m-7.jpg`, group: "Office Bearers" },
  { name: "Manish M. Vyas", position: "2nd Vice President & Legal Wing Chairman", photoUrl: `${BASE}/m-2.jpg`, group: "Office Bearers" },
  { name: "Vipul S. Joshi", position: "1st Joint Secretary & Medical Wing Chairman", photoUrl: `${BASE}/m-8.jpg`, group: "Office Bearers" },
  { name: "Rajan D. Shah", position: "2nd Joint Secretary & Atiti Griha Maintenance Chairman", photoUrl: `${BASE}/m-4.jpg`, group: "Office Bearers" },
  { name: "Harshad J. Joshi", position: "Joint Treasurer & Medical Aid Chairman", photoUrl: `${BASE}/c-2.jpg`, group: "Office Bearers" },
  { name: "Chandrakant H. Patel", position: "Fund Raising Chairman", photoUrl: `${BASE}/sec-2.jpg`, group: "Members of the Governing Body" },
  { name: "Dilip N. Shah", position: "Catering & Kitchen Wing Chairman", photoUrl: `${BASE}/g1.jpg`, group: "Members of the Governing Body" },
  { name: "Hemant J. Shah", position: "External Affairs Wing Chairman", photoUrl: `${BASE}/g2.jpg`, group: "Members of the Governing Body" },
  { name: "Hiren J. Thakker", position: "Educational Aid & General Charity Wing Chairman", photoUrl: `${BASE}/sec-1.jpg`, group: "Members of the Governing Body" },
  { name: "Nainesh M. Tanna", position: "Sports Wing Chairman", photoUrl: `${BASE}/g3.jpg`, group: "Members of the Governing Body" },
  { name: "Rajesh H. Shah", position: "Cultural & Entertainment Wing Chairman", photoUrl: `${BASE}/m-6.jpg`, group: "Members of the Governing Body" },
  { name: "Sachin S. Kotecha", position: "IT Wing Chairman", photoUrl: `${BASE}/j-1.jpg`, group: "Members of the Governing Body" },
  { name: "Dilip N. Shah", position: "Trustee", photoUrl: `${BASE}/g1.jpg`, group: "S.B.K.V Trustees (Represented by SCGS)" },
  { name: "Rajan D. Shah", position: "Trustee", photoUrl: `${BASE}/m-4.jpg`, group: "S.B.K.V Trustees (Represented by SCGS)" },
  { name: "Vijay H. Patel", position: "Trustee", photoUrl: `${BASE}/m-7.jpg`, group: "S.B.K.V Trustees (Represented by SCGS)" },
];
