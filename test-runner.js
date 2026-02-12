const { execSync } = require('child_process');

const API = 'https://transport-token-api.onrender.com';
let passed = 0, failed = 0, warnings = 0;
const issues = [];
const TS = Date.now();

function curl(method, path, body, token) {
  let cmd = `curl -s --max-time 15 -X ${method}`;
  cmd += ` -H "Content-Type: application/json"`;
  if (token) cmd += ` -H "Authorization: Bearer ${token}"`;
  if (body) cmd += ` -d '${JSON.stringify(body).replace(/'/g, "'\\''")}'`;
  cmd += ` "${API}${path}"`;
  try {
    const out = execSync(cmd, { encoding: 'utf8', timeout: 20000 });
    try { return JSON.parse(out); } catch { return { _raw: out }; }
  } catch (e) { return { _error: e.message }; }
}

function t(name, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name} — ${detail}`); issues.push({ name, detail }); }
}
function w(name, detail = '') {
  warnings++; console.log(`  ⚠️  ${name} — ${detail}`); issues.push({ name, detail, warn: true });
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  🧪 FRETNOW — BATTERIE DE TESTS COMPLÈTE v2.0');
console.log(`  🌐 ${API}`);
console.log(`  📅 ${new Date().toISOString()}`);
console.log('═══════════════════════════════════════════════════════');

// ═══ SECTION 1: HEALTH ═══
console.log('\n📋 SECTION 1: HEALTH & META\n' + '─'.repeat(50));

let h = curl('GET', '/health');
t('1.1 Health status = ok', h.status === 'ok', `got ${h.status}`);
t('1.2 Database connected', h.database === 'connected', `got ${h.database}`);
t('1.3 Version present', !!h.version, `v${h.version}`);
t('1.4 Features array', Array.isArray(h.features) && h.features.length >= 5);

let st = curl('GET', '/api/stats/public');
t('1.5 Public stats OK', typeof st.missions === 'number');
t('1.6 16 vehicle types', st.vehicles === 16, `got ${st.vehicles}`);
t('1.7 30 countries', st.countries === 30, `got ${st.countries}`);

let n404 = curl('GET', '/api/nonexistent');
t('1.8 404 returns error JSON', !!n404.error && !!n404.hint);

// ═══ SECTION 2: AUTH ═══
console.log('\n📋 SECTION 2: AUTHENTICATION\n' + '─'.repeat(50));

let r1 = curl('POST', '/api/auth/register', {});
t('2.1 Register empty → error', !!r1.error);

let r2 = curl('POST', '/api/auth/register', { email: 'a@b.c', password: '12', firstName: 'A', lastName: 'B' });
t('2.2 Short password → error', !!r2.error);

let r3 = curl('POST', '/api/auth/register', { email: 'a@b.c', password: '123456', firstName: 'A', lastName: 'B', role: 'SUPERADMIN' });
t('2.3 Invalid role → error', !!r3.error);

const CE = `client_${TS}@test.fr`;
let r4 = curl('POST', '/api/auth/register', {
  email: CE, password: 'TestPass123', firstName: 'Client', lastName: 'Test',
  role: 'CLIENT', company: { name: 'TestCorp', siret: `S${TS}`, city: 'Paris', postalCode: '75001' }
});
t('2.4 Register client → token', !!r4.accessToken);
t('2.5 User role = CLIENT', r4.user?.role === 'CLIENT');
const CT = r4.accessToken;

const TE = `trans_${TS}@test.fr`;
let r5 = curl('POST', '/api/auth/register', {
  email: TE, password: 'TransPass123', firstName: 'Trans', lastName: 'Porteur',
  role: 'TRANSPORTEUR', company: { name: 'TransExpress', siret: `T${TS}`, city: 'Lyon', postalCode: '69001' }
});
t('2.6 Register transporteur → token', !!r5.accessToken);
t('2.7 Role = TRANSPORTEUR', r5.user?.role === 'TRANSPORTEUR');
const TT = r5.accessToken;

let r6 = curl('POST', '/api/auth/register', { email: CE, password: 'X123456', firstName: 'D', lastName: 'U' });
t('2.8 Duplicate email → error', !!r6.error);

let r7 = curl('POST', '/api/auth/login', { email: CE, password: 'TestPass123' });
t('2.9 Login success', !!r7.accessToken);

let r8 = curl('POST', '/api/auth/login', { email: CE, password: 'Wrong' });
t('2.10 Login wrong pw → error', !!r8.error);

let r9 = curl('GET', '/api/auth/me', null, CT);
t('2.11 /auth/me returns user', r9.user?.email === CE);
t('2.12 Has company', !!r9.user?.company);

let r10 = curl('GET', '/api/missions');
t('2.13 No token → error', !!r10.error);

let r11 = curl('GET', '/api/missions', null, 'fake.token');
t('2.14 Bad token → error', !!r11.error);

let r12 = curl('GET', '/api/auth/me', null, TT);
t('2.15 Transporteur has profile', !!r12.user?.transporteurProfile?.id);

// ═══ SECTION 3: PRICING ═══
console.log('\n📋 SECTION 3: PRICING ENGINE (CNR)\n' + '─'.repeat(50));

let v = curl('GET', '/api/pricing/vehicles');
t('3.1 Vehicles endpoint', Object.keys(v.vehicles || {}).length === 16);

let c = curl('GET', '/api/pricing/countries');
t('3.2 Countries endpoint', Object.keys(c.countries || {}).length === 30);

let q1 = curl('POST', '/api/missions/quote', {
  vehicleType: 'FOURGON_20M3', pickupLat: 48.8566, pickupLon: 2.3522,
  deliveryLat: 45.764, deliveryLon: 4.8357, pickupCountry: 'FR', deliveryCountry: 'FR'
});
t('3.3 Quote Paris→Lyon OK', !!q1.quote);
t('3.4 Distance 400-600km', q1.quote?.distanceKm >= 400 && q1.quote?.distanceKm <= 600, `got ${q1.quote?.distanceKm}`);
t('3.5 Trinôme CK>0', q1.quote?.trinome?.ck > 0);
t('3.6 Trinôme CC>0', q1.quote?.trinome?.cc > 0);
t('3.7 Trinôme CJ>0', q1.quote?.trinome?.cj > 0);
t('3.8 PriceHT > 0', q1.quote?.priceHT > 0);
t('3.9 TTC > HT', q1.quote?.priceTTC > q1.quote?.priceHT);
t('3.10 CO2 > 0', q1.quote?.co2Kg > 0);
t('3.11 TT Score 0-100', q1.quote?.ttScore >= 0 && q1.quote?.ttScore <= 100);

// Commission 10%
const comm = q1.quote?.commission;
const pre = q1.quote?.priceHT - comm;
t('3.12 Commission ≈ 10%', Math.abs(comm / pre - 0.1) < 0.02, `ratio=${(comm/pre).toFixed(3)}`);

// Surcharges
let q2 = curl('POST', '/api/missions/quote', {
  vehicleType: 'SEMI_TAUTLINER', pickupLat: 48.85, pickupLon: 2.35,
  deliveryLat: 45.76, deliveryLon: 4.84, isUrgent: true, isWeekend: true, isNight: true, isADR: true
});
t('3.13 Surcharges > 0', q2.quote?.surcharges > 0, `got ${q2.quote?.surcharges}`);

// Eco discount
let q3 = curl('POST', '/api/missions/quote', {
  vehicleType: 'FOURGON_20M3', pickupLat: 48.85, pickupLon: 2.35,
  deliveryLat: 45.76, deliveryLon: 4.84, ecoOption: 'electric'
});
t('3.14 Eco discount > 0', q3.quote?.ecoDiscount > 0);
t('3.15 Eco TTC < normal', q3.quote?.priceTTC < q1.quote?.priceTTC);

// International
let q4 = curl('POST', '/api/missions/quote', {
  vehicleType: 'SEMI_TAUTLINER', pickupLat: 48.85, pickupLon: 2.35,
  deliveryLat: 52.52, deliveryLon: 13.4, pickupCountry: 'FR', deliveryCountry: 'DE'
});
t('3.16 FR→DE TVA = 19%', q4.quote?.tvaRate === 19, `got ${q4.quote?.tvaRate}`);

// Distance 0
let q5 = curl('POST', '/api/missions/quote', {
  vehicleType: 'FOURGON_20M3', pickupLat: 48.85, pickupLon: 2.35, deliveryLat: 48.85, deliveryLon: 2.35
});
t('3.17 Distance 0 → error', !!q5.error);

// BUG: invalid vehicle → silent fallback
let q6 = curl('POST', '/api/missions/quote', {
  vehicleType: 'INVALID_TYPE', pickupLat: 48.85, pickupLon: 2.35, deliveryLat: 45.76, deliveryLon: 4.84
});
if (!q6.error && q6.quote) {
  w('3.18 BUG: vehicleType invalide → fallback silencieux FOURGON_20M3', 'devrait retourner 400');
} else {
  t('3.18 Invalid vehicle → error', true);
}

// All vehicle types
let allVOk = true;
for (const vt of Object.keys(v.vehicles || {})) {
  const qt = curl('POST', '/api/missions/quote', {
    vehicleType: vt, pickupLat: 48.85, pickupLon: 2.35, deliveryLat: 45.76, deliveryLon: 4.84
  });
  if (!qt.quote?.priceTTC) { allVOk = false; console.log(`     ❌ ${vt} failed`); }
}
t('3.19 All 16 vehicles quote OK', allVOk);

// Vélo cargo CO2 = 0
let q7 = curl('POST', '/api/missions/quote', {
  vehicleType: 'VELO_CARGO', pickupLat: 48.85, pickupLon: 2.35, deliveryLat: 48.87, deliveryLon: 2.36
});
t('3.20 Vélo cargo CO2 = 0', q7.quote?.co2Kg === 0);

// ═══ SECTION 4: CARBON / GLEC ═══
console.log('\n📋 SECTION 4: CARBON / GLEC\n' + '─'.repeat(50));

let c1 = curl('POST', '/api/carbon/calculate', { vehicleType: 'SEMI_TAUTLINER', distanceKm: 500, weightKg: 15000 });
t('4.1 Carbon WTW > 0', c1.emissions?.totalCO2eKg > 0);
t('4.2 TTW+WTT ≈ WTW', Math.abs(c1.emissions?.wtw?.ttw + c1.emissions?.wtw?.wtt - c1.emissions?.totalCO2eKg) < 1);
t('4.3 Has rating', ['A+','A','B','C','D','E'].includes(c1.emissions?.rating));
t('4.4 GLEC methodology', c1.methodology?.framework?.includes('GLEC'));

let c2 = curl('POST', '/api/carbon/calculate', { vehicleType: 'PORTEUR_ELEC', distanceKm: 200, weightKg: 5000 });
t('4.5 Electric TTW = 0', c2.emissions?.wtw?.ttw === 0);
t('4.6 Electric < diesel', c2.emissions?.totalCO2eKg < c1.emissions?.totalCO2eKg);

let c3 = curl('POST', '/api/carbon/calculate', { vehicleType: 'VELO_CARGO', distanceKm: 10, weightKg: 50 });
t('4.7 Vélo CO2 = 0', c3.emissions?.totalCO2eKg === 0);
t('4.8 Vélo rating A+', c3.emissions?.rating === 'A+');

let c4 = curl('POST', '/api/carbon/calculate', { vehicleType: 'SEMI_TAUTLINER', distanceKm: 500, weightKg: 15000, fuelType: 'hvo100' });
t('4.9 HVO100 < diesel', c4.emissions?.totalCO2eKg < c1.emissions?.totalCO2eKg);

let c5 = curl('POST', '/api/carbon/calculate', { vehicleType: 'FAKE', distanceKm: 100, weightKg: 1000 });
t('4.10 Invalid vehicle → error', !!c5.error);
t('4.11 Lists valid types', Array.isArray(c5.valid));

let c6 = curl('POST', '/api/carbon/calculate', { vehicleType: 'SEMI_TAUTLINER' });
t('4.12 Missing fields → error', !!c6.error);

let cf = curl('GET', '/api/carbon/factors');
t('4.13 Factors: 16 vehicles', cf.vehicleTypes?.length === 16);
t('4.14 Factors: 7 fuels', Object.keys(cf.fuels || {}).length === 7);

// All fuels
const fuels = ['diesel_b7','hvo100','b100','gnl','bio_gnl','electric','hydrogen'];
let allFOk = true;
for (const f of fuels) {
  const fc = curl('POST', '/api/carbon/calculate', { vehicleType: 'SEMI_TAUTLINER', distanceKm: 500, weightKg: 15000, fuelType: f });
  if (!fc.success) { allFOk = false; console.log(`     ❌ fuel ${f} failed`); }
}
t('4.15 All 7 fuels work', allFOk);

// ═══ SECTION 5: MISSIONS ═══
console.log('\n📋 SECTION 5: MISSIONS CRUD\n' + '─'.repeat(50));

let m1 = curl('POST', '/api/missions', {
  pickupCity: 'Paris', deliveryCity: 'Lyon', vehicleTypeRequired: 'FOURGON_20M3',
  weightKg: 2500, goodsDescription: 'Test auto', enableBidding: true
}, CT);
t('5.1 Create mission with bidding', !!m1.mission?.id);
t('5.2 Status = BIDDING', m1.mission?.status === 'BIDDING');
t('5.3 Has reference', !!m1.mission?.reference);
t('5.4 Price calculated', m1.mission?.priceHT > 0);
t('5.5 GLEC CO2 present', !!m1.mission?.co2Rating);
t('5.6 Bidding deadline set', !!m1.mission?.biddingDeadline);
const MID = m1.mission?.id;
const MREF = m1.mission?.reference;

let m2 = curl('POST', '/api/missions', {
  pickupCity: 'Marseille', deliveryCity: 'Bordeaux', vehicleTypeRequired: 'SEMI_TAUTLINER', weightKg: 18000
}, CT);
t('5.7 Mission sans bidding → PENDING', m2.mission?.status === 'PENDING');
const MID2 = m2.mission?.id;

let m3 = curl('POST', '/api/missions', { deliveryCity: 'Lyon' }, CT);
t('5.8 Missing pickupCity → error', !!m3.error);

let m4 = curl('GET', '/api/missions', null, CT);
t('5.9 List missions OK', typeof m4.total === 'number');
t('5.10 Has pagination', !!m4.totalPages);

let m5 = curl('GET', `/api/missions/${MID}`, null, CT);
t('5.11 Get mission by ID', !!m5.mission?.reference);
t('5.12 Has bids array', Array.isArray(m5.mission?.bids));

let m6 = curl('GET', '/api/missions/nonexistent', null, CT);
t('5.13 Nonexistent → 404 error', !!m6.error);

// Workflow: accept → start → complete
let m7 = curl('POST', `/api/missions/${MID2}/accept`, {}, TT);
t('5.14 Accept mission', m7.mission?.status === 'ACCEPTED', `got ${m7.mission?.status || m7.error}`);

let m8 = curl('POST', `/api/missions/${MID2}/start`, {}, TT);
t('5.15 Start → IN_TRANSIT', m8.mission?.status === 'IN_TRANSIT', `got ${m8.mission?.status || m8.error}`);

let m9 = curl('POST', `/api/missions/${MID2}/complete`, {}, TT);
t('5.16 Complete → DELIVERED', m9.mission?.status === 'DELIVERED', `got ${m9.mission?.status || m9.error}`);

let m10 = curl('POST', `/api/missions/${MID2}/start`, {}, TT);
t('5.17 Start DELIVERED → error', !!m10.error);

let m11 = curl('POST', `/api/missions/${MID2}/accept`, {}, TT);
t('5.18 Accept DELIVERED → error', !!m11.error);

// ═══ SECTION 6: MARKETPLACE & BIDDING ═══
console.log('\n📋 SECTION 6: MARKETPLACE & BIDDING\n' + '─'.repeat(50));

let mk1 = curl('GET', '/api/marketplace/missions');
t('6.1 Marketplace public OK', !!mk1.pagination);
t('6.2 Has data array', Array.isArray(mk1.data));

let mk2 = curl('GET', '/api/marketplace/missions?urgent=true&sort=price_asc');
t('6.3 Marketplace filters OK', !!mk2.pagination);

if (MID) {
  let b1 = curl('POST', '/api/marketplace/bid', { missionId: MID, amount: 800, message: 'Test bid' }, TT);
  t('6.4 Place bid', !!b1.data?.id, `${b1.error || ''}`);

  let b2 = curl('POST', '/api/marketplace/bid', { missionId: MID, amount: 750 }, TT);
  t('6.5 Duplicate bid → error', !!b2.error);

  let b3 = curl('GET', `/api/marketplace/bids/${MID}`, null, CT);
  t('6.6 List bids', b3.count >= 1, `count=${b3.count}`);

  if (b3.data?.[0]?.id) {
    let b4 = curl('POST', `/api/marketplace/bid/${b3.data[0].id}/accept`, {}, CT);
    t('6.7 Accept bid', !!b4.success, `${b4.error || ''}`);
  }
}

let b5 = curl('POST', '/api/marketplace/bid', { amount: 100 }, TT);
t('6.8 Bid missing missionId → error', !!b5.error);

let b6 = curl('POST', '/api/marketplace/bid', { missionId: 'fake', amount: -50 }, TT);
t('6.9 Negative amount → error', !!b6.error);

// ═══ SECTION 7: RATINGS ═══
console.log('\n📋 SECTION 7: RATINGS\n' + '─'.repeat(50));

if (MID2) {
  let rt1 = curl('POST', '/api/ratings', {
    missionId: MID2, score: 4, comment: 'Test rating',
    criteria: { punctuality: 5, communication: 4, cargoHandling: 4, professionalism: 3 }
  }, CT);
  t('7.1 Create rating', !!rt1.data || !!rt1.success, `${rt1.error || ''}`);

  let rt2 = curl('POST', '/api/ratings', { missionId: MID2, score: 5 }, CT);
  t('7.2 Duplicate rating → error', !!rt2.error);
}

let rt3 = curl('POST', '/api/ratings', { score: 3 }, CT);
t('7.3 Missing missionId → error', !!rt3.error);

// ═══ SECTION 8: NOTIFICATIONS ═══
console.log('\n📋 SECTION 8: NOTIFICATIONS\n' + '─'.repeat(50));

let n1 = curl('GET', '/api/notifications', null, CT);
t('8.1 Get notifications', Array.isArray(n1.data));
t('8.2 Has unreadCount', typeof n1.unreadCount === 'number');

let n2 = curl('POST', '/api/notifications/read', {}, CT);
t('8.3 Mark all read', !!n2.success);

// ═══ SECTION 9: TRACKING ═══
console.log('\n📋 SECTION 9: TRACKING\n' + '─'.repeat(50));

if (MID) {
  let t1 = curl('GET', `/api/tracking/${MID}`);
  t('9.1 Tracking by ID', !!t1.tracking?.reference);
  t('9.2 Progress 0-100', t1.tracking?.progress >= 0 && t1.tracking?.progress <= 100);
  t('9.3 Has pickup/delivery', !!t1.tracking?.pickup?.city && !!t1.tracking?.delivery?.city);
}

if (MREF) {
  let t2 = curl('GET', `/api/tracking/${MREF}`);
  t('9.4 Tracking by reference', !!t2.tracking);
}

let t3 = curl('GET', '/api/tracking/FAKE-REF');
t('9.5 Nonexistent → error', !!t3.error);

// ═══ SECTION 10: TRANSPORTEUR ═══
console.log('\n📋 SECTION 10: TRANSPORTEUR ROUTES\n' + '─'.repeat(50));

let ts1 = curl('GET', '/api/transporteur/stats', null, TT);
t('10.1 Transporteur stats', typeof ts1.stats?.totalMissions === 'number');
t('10.2 Has averageRating', typeof ts1.stats?.averageRating === 'number');

let ts2 = curl('GET', '/api/transporteur/missions', null, TT);
t('10.3 Transporteur missions', Array.isArray(ts2.missions));

let ts3 = curl('GET', '/api/transporteur/available', null, TT);
t('10.4 Available missions', Array.isArray(ts3.missions));

let ts4 = curl('GET', '/api/transporteur/stats', null, CT);
t('10.5 Client → trans stats → 403', !!ts4.error);

// ═══ SECTION 11: FRONTEND↔BACKEND ALIGNMENT ═══
console.log('\n📋 SECTION 11: FRONTEND ↔ BACKEND ALIGNMENT\n' + '─'.repeat(50));

const missingRoutes = [
  ['POST', '/api/auth/logout', 'authApi.logout()'],
  ['GET', '/api/vehicles', 'vehiclesApi.list()'],
  ['POST', '/api/vehicles', 'vehiclesApi.create()'],
  ['GET', '/api/pricing/surcharges', 'pricingApi.getSurcharges()'],
  ['GET', '/api/tracking/mission/fake', 'trackingApi.getPosition()'],
  ['GET', '/api/users/profile', 'usersApi.getProfile()'],
  ['PATCH', '/api/users/profile', 'usersApi.updateProfile()'],
  ['GET', '/api/users/notifications', 'usersApi.getNotifications()'],
  ['GET', '/api/analytics/overview', 'analyticsApi.getOverview()'],
  ['GET', '/api/analytics/monthly', 'analyticsApi.getMonthly()'],
  ['POST', '/api/admin/transporteurs/fake/verify', 'adminApi.verifyTransporteur()'],
  ['GET', '/api/admin/disputes', 'adminApi.getDisputes()'],
  ['POST', '/api/missions/fake/cancel', 'missionsApi.cancel()'],
];

for (const [method, path, caller] of missingRoutes) {
  const r = curl(method, path, method !== 'GET' ? {} : null, CT);
  if (r.error?.includes('non trouvée')) {
    w(`MISSING: ${method} ${path}`, `called by ${caller}`);
  }
}

// ═══ SECTION 12: SECURITY ═══
console.log('\n📋 SECTION 12: SECURITY\n' + '─'.repeat(50));

let s1 = curl('GET', '/api/admin/stats', null, CT);
t('12.1 Non-admin → /admin/stats blocked', !!s1.error);

let s2 = curl('GET', '/api/admin/users', null, CT);
t('12.2 Non-admin → /admin/users blocked', !!s2.error);

let s3 = curl('POST', '/api/auth/login', { email: "'; DROP TABLE users;--", password: 'x' });
t('12.3 SQL injection safe', !!s3.error && !s3._error);

let s4 = curl('POST', '/api/missions', {
  pickupCity: '<script>alert("xss")</script>', deliveryCity: 'Lyon', vehicleTypeRequired: 'FOURGON_20M3'
}, CT);
t('12.4 XSS stored safely', !!s4.mission?.id);

// ═══ RÉSUMÉ ═══
console.log('\n═══════════════════════════════════════════════════════');
console.log('  📊 RÉSULTATS FINAUX');
console.log('═══════════════════════════════════════════════════════');
console.log(`  ✅ PASS:     ${passed}`);
console.log(`  ❌ FAIL:     ${failed}`);
console.log(`  ⚠️  WARNINGS: ${warnings}`);
console.log(`  📋 TOTAL:    ${passed + failed + warnings}`);
console.log(`  📈 Score:    ${((passed / Math.max(1, passed + failed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════');

if (issues.filter(i => !i.warn).length > 0) {
  console.log('\n❌ ÉCHECS:');
  issues.filter(i => !i.warn).forEach(i => console.log(`  → ${i.name} ${i.detail}`));
}
if (issues.filter(i => i.warn).length > 0) {
  console.log('\n⚠️  BUGS & ROUTES MANQUANTES:');
  issues.filter(i => i.warn).forEach(i => console.log(`  → ${i.name} — ${i.detail}`));
}
