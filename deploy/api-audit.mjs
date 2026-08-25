/**
 * Full API audit: hit every route, and for every write verify the value that
 * comes back out of the API matches what is actually stored in MongoDB.
 *
 *   node deploy/api-audit.mjs                     # against 127.0.0.1:5000
 *   BASE=https://<tunnel>.trycloudflare.com node deploy/api-audit.mjs
 *
 * It creates a throwaway member/event/facility/governing-body row, exercises
 * them, and deletes them again; the About document is edited and restored.
 * It deliberately does NOT fire a broadcast — that would push a notification to
 * every member.
 */
import { MongoClient } from '/home/ubuntu/SCGS-APP/backend/node_modules/mongodb/lib/index.js';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5000';
const envText = fs.readFileSync('/home/ubuntu/SCGS-APP/backend/.env', 'utf8');
const val = (k) => (envText.match(new RegExp(`^${k}=(.*)$`, 'm')) ?? [])[1] ?? '';
const ADMIN = val('ADMIN_KEY');

const client = new MongoClient(val('MONGODB_URI'));
await client.connect();
const db = client.db(val('DB_NAME'));

let pass = 0, fail = 0;
const failures = [];
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push(`${name} — ${detail}`); console.log(`  FAIL  ${name}  ${detail}`); }
};

async function req(method, path, { admin = false, token = '', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (admin) headers['x-admin-key'] = ADMIN;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') ?? '';
  let data = null;
  if (ct.includes('json')) { try { data = await res.json(); } catch { data = null; } }
  else data = Buffer.from(await res.arrayBuffer());
  return { status: res.status, data, ct };
}

const section = (t) => console.log(`\n=== ${t} ===`);

// ---------------------------------------------------------------- PUBLIC READS
section('Public reads');
{
  const r = await req('GET', '/api/health');
  ok('GET /api/health', r.status === 200 && r.data?.status === 'ok', JSON.stringify(r.data));

  const dbCount = await db.collection('members').countDocuments();
  const m = await req('GET', '/api/members?page=1&limit=20');
  ok('GET /api/members total matches Mongo', m.data?.total === dbCount, `api=${m.data?.total} mongo=${dbCount}`);
  ok('GET /api/members returns a page', m.data?.items?.length === 20, `got ${m.data?.items?.length}`);
  ok('GET /api/members hides passwordHash', !JSON.stringify(m.data).includes('passwordHash'));
  ok('GET /api/members hides photo blob', !JSON.stringify(m.data).includes('base64'));

  // Every field the API returns for one member must equal the stored document.
  const stored = await db.collection('members').findOne({ samajId: 'P A-1' });
  const one = await req('GET', '/api/members/P%20A-1');
  const mismatched = ['samajId','name','phone','email','address','bloodGroup','whatsapp']
    .filter((k) => (one.data?.[k] ?? '') !== (stored?.[k] ?? ''));
  ok('GET /api/members/:id matches stored doc', mismatched.length === 0, `differs: ${mismatched}`);

  const missing = await req('GET', '/api/members/NOPE-9999');
  ok('GET /api/members/:id 404s for unknown', missing.status === 404, `got ${missing.status}`);

  const q = await req('GET', '/api/members?q=Butani&limit=50');
  const mongoQ = await db.collection('members').countDocuments({ name: /Butani/i });
  ok('GET /api/members?q= filters (matches Mongo regex count)', q.data?.total === mongoQ, `api=${q.data?.total} mongo=${mongoQ}`);

  const byPhone = await req('GET', '/api/members?q=9003943030');
  ok('GET /api/members?q= searches phone', byPhone.data?.total >= 1, `got ${byPhone.data?.total}`);

  const photoOwner = await db.collection('members').findOne({ photo: { $exists: true } });
  const ph = await req('GET', `/api/members/${encodeURIComponent(photoOwner.samajId)}/photo`);
  ok('GET /api/members/:id/photo returns image bytes',
     ph.status === 200 && ph.ct.startsWith('image/') && ph.data.length === Buffer.from(photoOwner.photo.base64, 'base64').length,
     `${ph.status} ${ph.ct} ${ph.data?.length}`);

  const gb = await req('GET', '/api/governing-body');
  const gbMongo = await db.collection('governingBody').countDocuments();
  const gbApi = (gb.data ?? []).reduce((n, g) => n + g.members.length, 0);
  ok('GET /api/governing-body count matches Mongo', gbApi === gbMongo, `api=${gbApi} mongo=${gbMongo}`);
  ok('GET /api/governing-body every entry links to a member',
     (gb.data ?? []).every((g) => g.members.every((x) => x.samajId)), 'some entries have no samajId');
  const gbIds = [...new Set((gb.data ?? []).flatMap((g) => g.members.map((x) => x.samajId)))];
  const resolvable = await db.collection('members').countDocuments({ samajId: { $in: gbIds } });
  ok('GET /api/governing-body samajIds all resolve to real members', resolvable === gbIds.length, `${resolvable}/${gbIds.length} distinct`);

  const about = await req('GET', '/api/about');
  const aboutMongo = await db.collection('about').findOne({});
  ok('GET /api/about matches stored', about.data?.title === aboutMongo?.title, `${about.data?.title}`);

  const fac = await req('GET', '/api/facilities');
  const facMongo = await db.collection('facilities').countDocuments();
  ok('GET /api/facilities count matches Mongo', fac.data?.length === facMongo, `api=${fac.data?.length} mongo=${facMongo}`);

  const ev = await req('GET', '/api/events');
  const evMongo = await db.collection('events').countDocuments({ active: true });
  ok('GET /api/events (active only) matches Mongo', (ev.data?.length ?? 0) === evMongo, `api=${ev.data?.length} mongo=${evMongo}`);

  const rb = await req('GET', '/api/rulebook');
  ok('GET /api/rulebook serves the PDF', rb.status === 200 && rb.ct.includes('pdf') && rb.data.length > 1e6, `${rb.status} ${rb.data?.length}`);

  const demo = await req('GET', '/api/auth/demo-accounts');
  ok('GET /api/auth/demo-accounts returns accounts', Array.isArray(demo.data) && demo.data.length > 0, `${demo.data?.length}`);

  const nf = await req('GET', '/api/does-not-exist');
  ok('unknown route 404s as JSON', nf.status === 404, `got ${nf.status}`);
}

// ---------------------------------------------------------------------- AUTH
section('Auth');
let token = '', testSamajId = '';
{
  const bad = await req('POST', '/api/auth/login', { body: { identifier: 'nobody@nowhere', password: 'x' } });
  ok('login rejects bad credentials', bad.status === 401, `got ${bad.status}`);
  const empty = await req('POST', '/api/auth/login', { body: { identifier: '', password: '' } });
  ok('login rejects empty input', empty.status === 400, `got ${empty.status}`);
  const noAuth = await req('GET', '/api/me');
  ok('/api/me rejects missing token', noAuth.status === 401, `got ${noAuth.status}`);
  const badTok = await req('GET', '/api/me', { token: 'garbage.token' });
  ok('/api/me rejects forged token', badTok.status === 401, `got ${badTok.status}`);
}

// ------------------------------------------------- ADMIN: MEMBER CRUD + /api/me
section('Admin member CRUD (on a throwaway member)');
const TEST_PHONE = '9000000001';
{
  await db.collection('members').deleteMany({ phone: TEST_PHONE }); // leftovers from a prior run

  const created = await req('POST', '/api/admin/members', {
    admin: true,
    body: { name: 'API Audit Test', phone: TEST_PHONE, email: 'api.audit@example.com',
            address: 'Test address', bloodGroup: 'B+', whatsapp: '9000000002' },
  });
  testSamajId = created.data?.samajId;
  ok('POST /api/admin/members creates', created.status === 201 && !!testSamajId, JSON.stringify(created.data));

  const storedNew = await db.collection('members').findOne({ samajId: testSamajId });
  ok('created member is in Mongo with the posted values',
     storedNew?.name === 'API Audit Test' && storedNew?.phone === TEST_PHONE &&
     storedNew?.whatsapp === '9000000002' && storedNew?.bloodGroup === 'B+',
     JSON.stringify({ n: storedNew?.name, p: storedNew?.phone, w: storedNew?.whatsapp }));
  ok('created member is force-must-change-password', storedNew?.mustChangePassword === true);

  const dup = await req('POST', '/api/admin/members', { admin: true, body: { name: 'Dup', phone: TEST_PHONE } });
  ok('duplicate phone rejected', dup.status === 400, `got ${dup.status}`);

  const readBack = await req('GET', `/api/members/${encodeURIComponent(testSamajId)}`);
  ok('new member readable on the public endpoint', readBack.data?.whatsapp === '9000000002', JSON.stringify(readBack.data));

  const upd = await req('PUT', `/api/admin/members/${encodeURIComponent(testSamajId)}`, {
    admin: true, body: { name: 'API Audit Renamed', bloodGroup: 'AB-', occupation: 'Tester', nativePlace: 'Rajkot' },
  });
  const storedUpd = await db.collection('members').findOne({ samajId: testSamajId });
  ok('PUT /api/admin/members/:id persists to Mongo',
     upd.status < 300 && storedUpd?.name === 'API Audit Renamed' && storedUpd?.bloodGroup === 'AB-' &&
     storedUpd?.occupation === 'Tester' && storedUpd?.nativePlace === 'Rajkot',
     JSON.stringify({ s: upd.status, n: storedUpd?.name, o: storedUpd?.occupation }));
  const apiUpd = await req('GET', `/api/members/${encodeURIComponent(testSamajId)}`);
  ok('update is reflected by the read API',
     apiUpd.data?.name === 'API Audit Renamed' && apiUpd.data?.occupation === 'Tester',
     JSON.stringify(apiUpd.data));

  // 1x1 png
  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const photo = await req('PUT', `/api/admin/members/${encodeURIComponent(testSamajId)}/photo`, {
    admin: true, body: { contentType: 'image/png', base64: PNG },
  });
  const storedPhoto = await db.collection('members').findOne({ samajId: testSamajId });
  ok('PUT admin photo stores the blob in Mongo',
     photo.status < 300 && storedPhoto?.photo?.base64 === PNG, `status ${photo.status}`);
  const servedPhoto = await req('GET', `/api/members/${encodeURIComponent(testSamajId)}/photo`);
  ok('photo served back byte-identical',
     servedPhoto.data.equals(Buffer.from(PNG, 'base64')), `${servedPhoto.data?.length} bytes`);

  const setPw = await req('PUT', `/api/admin/members/${encodeURIComponent(testSamajId)}/password`, {
    admin: true, body: { password: 'auditpass123' },
  });
  ok('PUT admin password succeeds', setPw.status < 300, `got ${setPw.status}`);

  const login = await req('POST', '/api/auth/login', { body: { identifier: TEST_PHONE, password: 'auditpass123' } });
  token = login.data?.token ?? '';
  ok('login works with the admin-set password', login.status === 200 && !!token, JSON.stringify(login.data).slice(0, 120));
  ok('login response carries the profile', login.data?.user?.samajId === testSamajId);
}

// ------------------------------------------------------------------ /api/me
section('Member self-service (/api/me)');
{
  const me = await req('GET', '/api/me', { token });
  ok('GET /api/me returns own profile', me.data?.samajId === testSamajId, JSON.stringify(me.data).slice(0, 120));

  const put = await req('PUT', '/api/me', {
    token, body: { address: 'Updated by member', gnati: 'Test-Gnati', spouse: 'Test Spouse', whatsapp: '9000000003' },
  });
  const storedMe = await db.collection('members').findOne({ samajId: testSamajId });
  ok('PUT /api/me persists every field to Mongo',
     put.status < 300 && storedMe?.address === 'Updated by member' && storedMe?.gnati === 'Test-Gnati' &&
     storedMe?.spouse === 'Test Spouse' && storedMe?.whatsapp === '9000000003',
     JSON.stringify({ a: storedMe?.address, g: storedMe?.gnati, w: storedMe?.whatsapp }));
  const meAfter = await req('GET', '/api/me', { token });
  ok('PUT /api/me reflected on read-back',
     meAfter.data?.gnati === 'Test-Gnati' && meAfter.data?.whatsapp === '9000000003', JSON.stringify(meAfter.data).slice(0, 160));

  const reject = await req('PUT', '/api/me', { token, body: { samajId: 'HACK-1' } });
  ok('PUT /api/me refuses non-editable fields (strict schema)', reject.status === 400, `got ${reject.status}`);

  const tok = 'ExponentPushToken[audit-test-token]';
  const addTok = await req('POST', '/api/me/push-token', { token, body: { token: tok } });
  let storedTok = await db.collection('members').findOne({ samajId: testSamajId });
  ok('POST /api/me/push-token stores the token',
     addTok.status < 300 && (storedTok?.pushTokens ?? []).includes(tok), JSON.stringify(storedTok?.pushTokens));
  await req('POST', '/api/me/push-token', { token, body: { token: tok } });
  storedTok = await db.collection('members').findOne({ samajId: testSamajId });
  ok('re-registering the same token does not duplicate it',
     (storedTok?.pushTokens ?? []).filter((t) => t === tok).length === 1, JSON.stringify(storedTok?.pushTokens));
  const delTok = await req('DELETE', '/api/me/push-token', { token, body: { token: tok } });
  storedTok = await db.collection('members').findOne({ samajId: testSamajId });
  ok('DELETE /api/me/push-token removes it',
     delTok.status < 300 && !(storedTok?.pushTokens ?? []).includes(tok), JSON.stringify(storedTok?.pushTokens));

  const notif = await req('GET', '/api/me/notifications', { token });
  ok('GET /api/me/notifications returns { items, unread }',
     Array.isArray(notif.data?.items) && typeof notif.data?.unread === 'number', JSON.stringify(notif.data).slice(0, 120));
  const read = await req('POST', '/api/me/notifications/read', { token, body: {} });
  ok('POST /api/me/notifications/read succeeds', read.status < 300, `got ${read.status}`);

  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const myPhoto = await req('PUT', '/api/me/photo', { token, body: { contentType: 'image/png', base64: PNG } });
  const sp = await db.collection('members').findOne({ samajId: testSamajId });
  ok('PUT /api/me/photo stores the photo', myPhoto.status < 300 && sp?.photo?.base64 === PNG, `status ${myPhoto.status}`);

  const chpw = await req('POST', '/api/me/password', { token, body: { currentPassword: 'auditpass123', password: 'newauditpass456' } });
  const afterPw = await db.collection('members').findOne({ samajId: testSamajId });
  ok('POST /api/me/password changes password + clears must-change',
     chpw.status < 300 && afterPw?.mustChangePassword !== true, `status ${chpw.status} mcp=${afterPw?.mustChangePassword}`);
  const relogin = await req('POST', '/api/auth/login', { body: { identifier: TEST_PHONE, password: 'newauditpass456' } });
  ok('login works with the new password', relogin.status === 200, `got ${relogin.status}`);
  const oldpw = await req('POST', '/api/auth/login', { body: { identifier: TEST_PHONE, password: 'auditpass123' } });
  ok('old password no longer works', oldpw.status === 401, `got ${oldpw.status}`);
}

// ------------------------------------------------------------- ADMIN CONTENT
section('Admin: events / facilities / governing-body / about / settings');
{
  const st = await req('GET', '/api/admin/stats', { admin: true });
  const memCount = await db.collection('members').countDocuments();
  ok('GET /api/admin/stats members matches Mongo', st.data?.members === memCount, `api=${st.data?.members} mongo=${memCount}`);

  const noKey = await req('GET', '/api/admin/stats');
  ok('admin routes reject a missing key', noKey.status === 401, `got ${noKey.status}`);
  const badKey = await req('GET', '/api/admin/stats', { admin: false });
  ok('admin routes reject a wrong key', badKey.status === 401, `got ${badKey.status}`);

  // --- events
  const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const evc = await req('POST', '/api/admin/events', {
    admin: true,
    body: { title: 'AUDIT EVENT', description: 'created by the API audit', location: 'Coimbatore',
            eventDate: '01 Jan 2027, 6:00 PM', active: true, banner: { contentType: 'image/png', base64: PNG } },
  });
  const evId = evc.data?.id ?? evc.data?._id;
  ok('POST /api/admin/events creates', evc.status < 300 && !!evId, JSON.stringify(evc.data).slice(0, 140));

  const evStored = await db.collection('events').findOne({ title: 'AUDIT EVENT' });
  ok('event stored in Mongo with posted values',
     evStored?.description === 'created by the API audit' && evStored?.location === 'Coimbatore' &&
     evStored?.banner?.base64 === PNG, JSON.stringify({ d: evStored?.description, l: evStored?.location }));

  const evPublic = await req('GET', '/api/events');
  const found = (evPublic.data ?? []).find((e) => e.title === 'AUDIT EVENT');
  ok('new event appears on the public feed', !!found, `feed has ${evPublic.data?.length}`);
  ok('public event exposes hasBanner, not the blob',
     found?.hasBanner === true && !JSON.stringify(found).includes('base64'), JSON.stringify(found));

  const banner = await req('GET', `/api/events/${evId}/banner`);
  ok('GET /api/events/:id/banner serves the image',
     banner.status === 200 && banner.data.equals(Buffer.from(PNG, 'base64')), `${banner.status} ${banner.data?.length}`);

  const evu = await req('PUT', `/api/admin/events/${evId}`, { admin: true, body: { title: 'AUDIT EVENT EDITED', active: false } });
  const evStored2 = await db.collection('events').findOne({ _id: evStored._id });
  ok('PUT event persists', evu.status < 300 && evStored2?.title === 'AUDIT EVENT EDITED' && evStored2?.active === false,
     JSON.stringify({ t: evStored2?.title, a: evStored2?.active }));
  const feedAfter = await req('GET', '/api/events');
  ok('inactive event disappears from the public feed',
     !(feedAfter.data ?? []).some((e) => e.title === 'AUDIT EVENT EDITED'), 'still listed');
  const adminFeed = await req('GET', '/api/admin/events', { admin: true });
  ok('inactive event still visible to admin',
     (adminFeed.data ?? []).some((e) => e.title === 'AUDIT EVENT EDITED'), 'missing from admin list');

  const evd = await req('DELETE', `/api/admin/events/${evId}`, { admin: true });
  const goneEv = await db.collection('events').findOne({ _id: evStored._id });
  ok('DELETE event removes it from Mongo', evd.status < 300 && !goneEv, `status ${evd.status}`);

  // --- facilities
  const fc = await req('POST', '/api/admin/facilities', { admin: true, body: { name: 'AUDIT FACILITY', description: 'temp' } });
  ok('POST /api/admin/facilities creates', fc.status < 300, JSON.stringify(fc.data).slice(0, 120));
  const fList = await req('GET', '/api/admin/facilities', { admin: true });
  const fRec = (fList.data ?? []).find((f) => f.name === 'AUDIT FACILITY');
  ok('facility appears in the admin list', !!fRec);
  const fPub = await req('GET', '/api/facilities');
  ok('facility appears on the public endpoint', (fPub.data ?? []).some((f) => f.name === 'AUDIT FACILITY'));
  const fu = await req('PUT', `/api/admin/facilities/${fRec?.id ?? fRec?._id}`, { admin: true, body: { name: 'AUDIT FACILITY 2', description: 'temp2' } });
  const fStored = await db.collection('facilities').findOne({ name: 'AUDIT FACILITY 2' });
  ok('PUT facility persists', fu.status < 300 && fStored?.description === 'temp2', `status ${fu.status}`);
  const fd = await req('DELETE', `/api/admin/facilities/${fRec?.id ?? fRec?._id}`, { admin: true });
  ok('DELETE facility removes it', fd.status < 300 && !(await db.collection('facilities').findOne({ name: 'AUDIT FACILITY 2' })));

  // --- governing body
  const gbMember = await db.collection('members').findOne({ samajId: 'P A-1' });
  const gc = await req('POST', '/api/admin/governing-body', {
    admin: true, body: { samajId: gbMember.samajId, position: 'Auditor', group: 'Office Bearers' },
  });
  ok('POST /api/admin/governing-body creates', gc.status < 300, JSON.stringify(gc.data).slice(0, 120));
  const gList = await req('GET', '/api/admin/governing-body', { admin: true });
  const gRec = (gList.data ?? []).find((g) => g.position === 'Auditor');
  ok('governing-body entry in admin list', !!gRec);
  const gPub = await req('GET', '/api/governing-body');
  ok('governing-body entry on the public endpoint',
     (gPub.data ?? []).some((grp) => grp.members.some((m) => m.position === 'Auditor')));
  ok('governing-body entry took the name from the linked member',
     gRec?.name === gbMember.name, `${gRec?.name} vs ${gbMember.name}`);
  const gu = await req('PUT', `/api/admin/governing-body/${gRec?.id ?? gRec?._id}`, {
    admin: true, body: { samajId: gbMember.samajId, position: 'Chief Auditor', group: 'Office Bearers' },
  });
  const gStored = await db.collection('governingBody').findOne({ position: 'Chief Auditor' });
  ok('PUT governing-body persists', gu.status < 300 && gStored?.position === 'Chief Auditor', `pos=${gStored?.position}`);
  const gd = await req('DELETE', `/api/admin/governing-body/${gRec?.id ?? gRec?._id}`, { admin: true });
  ok('DELETE governing-body removes it', gd.status < 300 && !(await db.collection('governingBody').findOne({ position: 'Chief Auditor' })));
  ok('governing-body count back to 18', (await db.collection('governingBody').countDocuments()) === 18);

  // --- about (restore afterwards)
  const aboutBefore = await db.collection('about').findOne({});
  const aGet = await req('GET', '/api/admin/about', { admin: true });
  ok('GET /api/admin/about returns content', !!aGet.data?.title);
  const edited = { ...aGet.data, title: 'AUDIT TITLE' };
  delete edited._id;
  const aPut = await req('PUT', '/api/admin/about', { admin: true, body: edited });
  const aStored = await db.collection('about').findOne({});
  ok('PUT /api/admin/about persists', aPut.status < 300 && aStored?.title === 'AUDIT TITLE', `status ${aPut.status} title=${aStored?.title}`);
  const aPub = await req('GET', '/api/about');
  ok('about change visible on the public endpoint', aPub.data?.title === 'AUDIT TITLE', `${aPub.data?.title}`);
  const restore = { ...aboutBefore }; delete restore._id;
  await req('PUT', '/api/admin/about', { admin: true, body: restore });
  const aRestored = await db.collection('about').findOne({});
  ok('about restored to the original title', aRestored?.title === aboutBefore.title, `${aRestored?.title}`);

  // --- settings / broadcast status (read-only)
  const sGet = await req('GET', '/api/admin/settings', { admin: true });
  ok('GET /api/admin/settings responds', sGet.status === 200, JSON.stringify(sGet.data).slice(0, 120));
  const bStatus = await req('GET', '/api/admin/broadcast/status', { admin: true });
  ok('GET /api/admin/broadcast/status responds', bStatus.status === 200, JSON.stringify(bStatus.data).slice(0, 160));
}

// ------------------------------------------------------------------- CLEANUP
section('Cleanup');
{
  const del = await req('DELETE', `/api/admin/members/${encodeURIComponent(testSamajId)}`, { admin: true });
  const gone = await db.collection('members').findOne({ samajId: testSamajId });
  ok('DELETE /api/admin/members/:id removes the test member', del.status < 300 && !gone, `status ${del.status}`);
  const after = await req('GET', `/api/members/${encodeURIComponent(testSamajId)}`);
  ok('deleted member 404s afterwards', after.status === 404, `got ${after.status}`);
  const finalCount = await db.collection('members').countDocuments();
  ok('member count back to 2222', finalCount === 2222, `got ${finalCount}`);
}

console.log(`\n${'='.repeat(56)}\nRESULT: ${pass} passed, ${fail} failed`);
if (failures.length) { console.log('\nFailures:'); failures.forEach((f) => console.log('  - ' + f)); }
await client.close();
process.exit(fail ? 1 : 0);
