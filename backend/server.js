// ═══════════════════════════════════════════════════════════════════════════
// 🚛 TRANSPORT TOKEN API v3.1 — PRODUCTION-GRADE
// ═══════════════════════════════════════════════════════════════════════════
// Fixes: input validation, rate limiting, graceful shutdown, error logging,
// proper HTTP codes, pagination, CORS security, request sanitization
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── CONFIG ───────────────────────────────────────────────────────────────

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
});
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'transport-token-secret-key-2025';
const NODE_ENV = process.env.NODE_ENV || 'development';
const VERSION = '3.1.0';

// ── MIDDLEWARE ────────────────────────────────────────────────────────────

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : ['*'];

app.use(cors({
  origin: allowedOrigins.includes('*') ? '*' : (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '5mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (NODE_ENV !== 'test') {
      const icon = res.statusCode < 400 ? '✅' : res.statusCode < 500 ? '⚠️' : '❌';
      console.log(`${icon} ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
    }
  });
  next();
});

// Simple in-memory rate limiter
const rateLimits = {};
function rateLimit(windowMs = 60000, max = 100) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    if (!rateLimits[key] || rateLimits[key].reset < now) {
      rateLimits[key] = { count: 1, reset: now + windowMs };
    } else {
      rateLimits[key].count++;
    }
    if (rateLimits[key].count > max) {
      return res.status(429).json({ error: 'Trop de requêtes, réessayez plus tard' });
    }
    next();
  };
}

// Apply rate limiting to auth routes
const authLimiter = rateLimit(60000, 20); // 20 req/min for auth

// ═══════════════════════════════════════════════════════════════════════════
// PRICING ENGINE — TRINÔME CNR (Comité National Routier)
// ═══════════════════════════════════════════════════════════════════════════

const VEHICLES = {
  VELO_CARGO:         { ck: 0.10, cc: 15, cj: 50,  co2: 0,   speed: 20, capacityKg: 150,   label: 'Vélo cargo' },
  SCOOTER_ELEC:       { ck: 0.15, cc: 15, cj: 50,  co2: 0,   speed: 30, capacityKg: 50,    label: 'Scooter électrique' },
  VUL_ELECTRIQUE:     { ck: 0.55, cc: 26, cj: 125, co2: 0,   speed: 60, capacityKg: 1200,  label: 'VUL électrique' },
  FOURGONNETTE:       { ck: 0.52, cc: 24, cj: 95,  co2: 184, speed: 55, capacityKg: 800,   label: 'Fourgonnette' },
  FOURGON_12M3:       { ck: 0.65, cc: 26, cj: 115, co2: 276, speed: 60, capacityKg: 1200,  label: 'Fourgon 12m³' },
  FOURGON_20M3:       { ck: 0.78, cc: 28, cj: 135, co2: 322, speed: 65, capacityKg: 1800,  label: 'Fourgon 20m³' },
  PORTEUR_7T5:        { ck: 0.92, cc: 32, cj: 185, co2: 414, speed: 70, capacityKg: 4500,  label: 'Porteur 7.5T' },
  PORTEUR_12T:        { ck: 1.05, cc: 35, cj: 215, co2: 506, speed: 70, capacityKg: 7500,  label: 'Porteur 12T' },
  PORTEUR_19T:        { ck: 1.18, cc: 38, cj: 245, co2: 580, speed: 70, capacityKg: 12000, label: 'Porteur 19T' },
  PORTEUR_ELEC:       { ck: 0.90, cc: 32, cj: 180, co2: 0,   speed: 65, capacityKg: 7000,  label: 'Porteur électrique' },
  SEMI_TAUTLINER:     { ck: 1.35, cc: 42, cj: 295, co2: 736, speed: 80, capacityKg: 24000, label: 'Semi tautliner' },
  SEMI_FRIGO:         { ck: 1.75, cc: 48, cj: 365, co2: 874, speed: 80, capacityKg: 22000, label: 'Semi frigorifique' },
  SEMI_BENNE:         { ck: 1.40, cc: 43, cj: 305, co2: 750, speed: 75, capacityKg: 26000, label: 'Semi benne' },
  SEMI_CITERNE:       { ck: 1.50, cc: 45, cj: 325, co2: 780, speed: 75, capacityKg: 25000, label: 'Semi citerne' },
  MEGA_TRAILER:       { ck: 1.45, cc: 44, cj: 310, co2: 700, speed: 80, capacityKg: 25000, label: 'Méga trailer' },
  ELECTRIQUE_FOURGON: { ck: 0.55, cc: 26, cj: 125, co2: 0,   speed: 60, capacityKg: 1200,  label: 'Fourgon électrique' },
};

const COUNTRIES = {
  FR: { tva: 20, toll: 0.15, label: 'France' },       DE: { tva: 19, toll: 0.35, label: 'Allemagne' },
  BE: { tva: 21, toll: 0.12, label: 'Belgique' },      ES: { tva: 21, toll: 0.10, label: 'Espagne' },
  IT: { tva: 22, toll: 0.12, label: 'Italie' },         NL: { tva: 21, toll: 0.00, label: 'Pays-Bas' },
  GB: { tva: 20, toll: 0.05, label: 'Royaume-Uni' },   PL: { tva: 23, toll: 0.08, label: 'Pologne' },
  PT: { tva: 23, toll: 0.08, label: 'Portugal' },       AT: { tva: 20, toll: 0.20, label: 'Autriche' },
  CH: { tva: 7.7, toll: 0.25, label: 'Suisse' },       LU: { tva: 17, toll: 0.00, label: 'Luxembourg' },
  CZ: { tva: 21, toll: 0.10, label: 'Tchéquie' },      SE: { tva: 25, toll: 0.05, label: 'Suède' },
  DK: { tva: 25, toll: 0.10, label: 'Danemark' },      NO: { tva: 25, toll: 0.15, label: 'Norvège' },
  FI: { tva: 24, toll: 0.05, label: 'Finlande' },      RO: { tva: 19, toll: 0.06, label: 'Roumanie' },
  HU: { tva: 27, toll: 0.10, label: 'Hongrie' },       SK: { tva: 20, toll: 0.09, label: 'Slovaquie' },
  SI: { tva: 22, toll: 0.08, label: 'Slovénie' },      HR: { tva: 25, toll: 0.07, label: 'Croatie' },
  BG: { tva: 20, toll: 0.05, label: 'Bulgarie' },      GR: { tva: 24, toll: 0.06, label: 'Grèce' },
  IE: { tva: 23, toll: 0.05, label: 'Irlande' },       EE: { tva: 22, toll: 0.00, label: 'Estonie' },
  LV: { tva: 21, toll: 0.00, label: 'Lettonie' },      LT: { tva: 21, toll: 0.00, label: 'Lituanie' },
  MT: { tva: 18, toll: 0.00, label: 'Malte' },         CY: { tva: 19, toll: 0.00, label: 'Chypre' },
};

// ═══════════════════════════════════════════════════════════════════════════
// GLEC FRAMEWORK v3.2 / ISO 14083:2023 — Émissions carbone
// ═══════════════════════════════════════════════════════════════════════════

const GLEC = {
  road: {
    van_diesel:       { wtw: 299,  ttw: 245, wtt: 54 },
    van_electric:     { wtw: 24.8, ttw: 0,   wtt: 24.8 },
    rigid_7t5:        { wtw: 187,  ttw: 153, wtt: 34 },
    rigid_12t:        { wtw: 130,  ttw: 106, wtt: 24 },
    rigid_19t:        { wtw: 101,  ttw: 83,  wtt: 18 },
    rigid_electric:   { wtw: 18.6, ttw: 0,   wtt: 18.6 },
    artic_general:    { wtw: 62,   ttw: 51,  wtt: 11 },
    artic_frigo:      { wtw: 81,   ttw: 66,  wtt: 15 },
    artic_mega:       { wtw: 55,   ttw: 45,  wtt: 10 },
    cargo_bike:       { wtw: 0,    ttw: 0,   wtt: 0 },
    scooter_electric: { wtw: 0,    ttw: 0,   wtt: 0 },
  },
  fuels: {
    diesel_b7: { f: 1.00, label: 'Diesel B7' },
    hvo100:    { f: 0.10, label: 'HVO100' },
    b100:      { f: 0.35, label: 'Biodiesel B100' },
    gnl:       { f: 0.80, label: 'GNL' },
    bio_gnl:   { f: 0.15, label: 'Bio-GNL' },
    electric:  { f: 0.00, label: 'Électrique' },
    hydrogen:  { f: 0.05, label: 'Hydrogène vert' },
  },
  DAF: 1.05,
  elec: { FR:56, DE:385, BE:167, NL:386, IT:332, ES:206, PT:219, AT:107, CH:26, PL:700, SE:41, NO:19, DK:117, FI:97, CZ:421, GB:231, LU:100, EU:260 },
};

const V2G = {
  VELO_CARGO:'cargo_bike', SCOOTER_ELEC:'scooter_electric', VUL_ELECTRIQUE:'van_electric',
  FOURGONNETTE:'van_diesel', FOURGON_12M3:'van_diesel', FOURGON_20M3:'rigid_7t5',
  PORTEUR_7T5:'rigid_7t5', PORTEUR_12T:'rigid_12t', PORTEUR_19T:'rigid_19t',
  PORTEUR_ELEC:'rigid_electric', SEMI_TAUTLINER:'artic_general', SEMI_FRIGO:'artic_frigo',
  SEMI_BENNE:'artic_general', SEMI_CITERNE:'artic_general', MEGA_TRAILER:'artic_mega',
  ELECTRIQUE_FOURGON:'van_electric',
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const CITIES = {
  'Paris':{lat:48.8566,lon:2.3522},'Lyon':{lat:45.764,lon:4.8357},'Marseille':{lat:43.2965,lon:5.3698},
  'Toulouse':{lat:43.6047,lon:1.4442},'Bordeaux':{lat:44.8378,lon:-0.5792},'Lille':{lat:50.6292,lon:3.0573},
  'Nantes':{lat:47.2184,lon:-1.5536},'Strasbourg':{lat:48.5734,lon:7.7521},'Nice':{lat:43.7102,lon:7.262},
  'Rennes':{lat:48.1173,lon:-1.6778},'Milan':{lat:45.4642,lon:9.19},'Madrid':{lat:40.4168,lon:-3.7038},
  'Berlin':{lat:52.52,lon:13.405},'Bruxelles':{lat:50.8503,lon:4.3517},'Amsterdam':{lat:52.3676,lon:4.9041},
  'Londres':{lat:51.5074,lon:-0.1278},'Barcelone':{lat:41.3851,lon:2.1734},'Rome':{lat:41.9028,lon:12.4964},
  'Munich':{lat:48.1351,lon:11.582},'Varsovie':{lat:52.2297,lon:21.0122},'Prague':{lat:50.0755,lon:14.4378},
  'Vienne':{lat:48.2082,lon:16.3738},'Zurich':{lat:47.3769,lon:8.5417},'Lisbonne':{lat:38.7223,lon:-9.1393},
  'Porto':{lat:41.1579,lon:-8.6291},'Dublin':{lat:53.3498,lon:-6.2603},'Copenhague':{lat:55.6761,lon:12.5683},
  'Stockholm':{lat:59.3293,lon:18.0686},'Helsinki':{lat:60.1699,lon:24.9384},'Oslo':{lat:59.9139,lon:10.7522},
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(km * 1.3); // x1.3 = road factor
}

function calcPrice(p) {
  const v = VEHICLES[p.vehicleType] || VEHICLES.FOURGON_20M3;
  const d = p.distanceKm || haversine(p.pickupLat || 48.85, p.pickupLon || 2.35, p.deliveryLat || 45.76, p.deliveryLon || 4.84);
  if (d <= 0) return null;

  // Temps de conduite avec pauses réglementaires EU
  let h = d / v.speed;
  h += Math.floor(h / 4.5) * 0.75 + 2; // 45min/4h30 + 2h chargement
  const days = Math.ceil(h / 10); // 10h conduite/jour max

  // Trinôme CNR: CK (kilométrique) + CC (conduite) + CJ (journalier)
  const ck = v.ck * d;
  const cc = v.cc * h;
  const cj = v.cj * days;
  let base = ck + cc + cj;

  // Péages
  const pickupToll = (COUNTRIES[p.pickupCountry] || COUNTRIES.FR).toll;
  const deliveryToll = (COUNTRIES[p.deliveryCountry] || COUNTRIES.FR).toll;
  const tolls = d * ((pickupToll + deliveryToll) / 2);

  // Surcharges
  let sur = 0;
  if (p.isUrgent)  sur += base * 0.50;
  if (p.isWeekend) sur += base * 0.35;
  if (p.isNight)   sur += base * 0.20;
  if (p.isADR)     sur += base * 0.25;

  // Éco-discount
  let eco = 0;
  if (p.ecoOption === 'hvo')      eco = (base + sur) * 0.15;
  if (p.ecoOption === 'electric') eco = (base + sur) * 0.30;

  const preCommission = base + tolls + sur - eco;
  const commission = preCommission * 0.10; // 10% plateforme
  const ht = preCommission + commission;
  const tvaRate = (COUNTRIES[p.deliveryCountry] || COUNTRIES.FR).tva;
  const tva = ht * (tvaRate / 100);
  const ttc = ht + tva;
  const co2 = (v.co2 * d) / 1000;

  // TT Score (0-100, higher = greener)
  let tt = 50;
  if (p.ecoOption === 'electric') tt += 30;
  else if (p.ecoOption === 'hvo') tt += 15;
  tt -= Math.min(20, (co2 / Math.max(d, 1)) * 30);
  tt = Math.max(0, Math.min(100, Math.round(tt)));

  return {
    distanceKm: d,
    estimatedHours: Math.round(h * 10) / 10,
    estimatedDays: days,
    trinome: {
      ck: Math.round(ck * 100), cc: Math.round(cc * 100),
      cj: Math.round(cj * 100), total: Math.round(base * 100),
    },
    tolls: Math.round(tolls * 100),
    surcharges: Math.round(sur * 100),
    ecoDiscount: Math.round(eco * 100),
    commission: Math.round(commission * 100),
    priceHT: Math.round(ht * 100),
    tvaRate,
    tva: Math.round(tva * 100),
    priceTTC: Math.round(ttc * 100),
    co2Kg: Math.round(co2 * 10) / 10,
    ttScore: tt,
  };
}

function calcGLEC(vt, dist, wKg, fuel, country) {
  const gt = V2G[vt];
  if (!gt) return null;
  const ef = GLEC.road[gt];
  if (!ef) return null;

  const fu = GLEC.fuels[fuel || 'diesel_b7'];
  const wT = wKg / 1000;
  const ad = dist * GLEC.DAF;
  let ew = ef.wtw;

  if (fu) ew *= fu.f;
  if (gt.includes('electric') && country) {
    const cf = GLEC.elec[country] || GLEC.elec.EU;
    ew = ef.wtw * (cf / GLEC.elec.EU);
  }

  const tot = (ew * wT * ad) / 1000;
  const tR = ef.wtw > 0 ? ef.ttw / ef.wtw : 0;
  const wR = ef.wtw > 0 ? ef.wtt / ef.wtw : 0;
  const rat = tot < 10 ? 'A+' : tot < 50 ? 'A' : tot < 150 ? 'B' : tot < 300 ? 'C' : tot < 500 ? 'D' : 'E';

  return {
    total: Math.round(tot * 10) / 10,
    ttw: Math.round(tot * tR * 10) / 10,
    wtt: Math.round(tot * wR * 10) / 10,
    perTkm: Math.round(ew * 100) / 100,
    rating: rat,
  };
}

// Input validation helper
function validate(fields, body) {
  const missing = fields.filter(f => !body[f] && body[f] !== 0 && body[f] !== false);
  if (missing.length > 0) return `Champs requis: ${missing.join(', ')}`;
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

function optAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.split(' ')[1], JWT_SECRET); } catch (e) { /* ignore */ }
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: `Accès réservé aux rôles: ${roles.join(', ')}` });
    }
    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — HEALTH & META
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', async (req, res) => {
  let dbOk = false;
  try { await prisma.$queryRaw`SELECT 1`; dbOk = true; } catch (e) { /* db down */ }
  const status = dbOk ? 'ok' : 'degraded';
  res.status(dbOk ? 200 : 503).json({
    status,
    version: VERSION,
    platform: 'Transport Token',
    database: dbOk ? 'connected' : 'disconnected',
    features: ['CNR Pricing', 'GLEC Carbon', 'AI Matching', 'Bidding', 'Ratings', 'Notifications'],
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/stats/public', async (req, res) => {
  try {
    const [missions, transporteurs] = await Promise.all([
      prisma.mission.count(),
      prisma.transporteurProfile.count({ where: { isVerified: true } }),
    ]);
    return res.json({ missions, transporteurs, countries: Object.keys(COUNTRIES).length, vehicles: Object.keys(VEHICLES).length });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — AUTH
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, company } = req.body;
    const err = validate(['email', 'password', 'firstName', 'lastName'], req.body);
    if (err) return res.status(400).json({ error: err });
    if (password.length < 6) return res.status(400).json({ error: 'Mot de passe: 6 caractères minimum' });
    if (!['CLIENT', 'TRANSPORTEUR'].includes(role || 'CLIENT')) return res.status(400).json({ error: 'Rôle invalide' });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, 12);
    let companyRecord = null;
    if (company?.siret) {
      companyRecord = await prisma.company.upsert({
        where: { siret: company.siret },
        update: {},
        create: {
          name: company.name || 'Non renseigné',
          siret: company.siret,
          address: company.address, city: company.city,
          postalCode: company.postalCode, country: company.country || 'FR',
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(), passwordHash,
        firstName: firstName.trim(), lastName: lastName.trim(),
        role: role || 'CLIENT', status: 'ACTIVE',
        companyId: companyRecord?.id,
      },
    });

    if ((role || 'CLIENT') === 'TRANSPORTEUR') {
      await prisma.transporteurProfile.create({ data: { userId: user.id } });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      message: 'Inscription réussie',
      accessToken: token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  } catch (e) {
    console.error('Register error:', e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const err = validate(['email', 'password'], req.body);
    if (err) return res.status(400).json({ error: err });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { company: true },
    });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    if (user.status !== 'ACTIVE') return res.status(403).json({ error: 'Compte non actif' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return res.json({
      message: 'Connexion réussie',
      accessToken: token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, company: user.company },
    });
  } catch (e) {
    console.error('Login error:', e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, status: true, emailVerified: true, kycVerified: true,
        createdAt: true, lastLoginAt: true,
        company: true,
        transporteurProfile: { include: { vehicles: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    return res.json({ user });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — PRICING
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/pricing/vehicles', (req, res) => res.json({ vehicles: VEHICLES }));
app.get('/api/pricing/countries', (req, res) => res.json({ countries: COUNTRIES }));

app.post('/api/missions/quote', (req, res) => {
  try {
    const p = calcPrice(req.body);
    if (!p) return res.status(400).json({ error: 'Paramètres invalides (distance = 0?)' });
    return res.json({ quote: { ...p, priceHTEuros: p.priceHT / 100, priceTTCEuros: p.priceTTC / 100 } });
  } catch (e) { return res.status(500).json({ error: 'Erreur calcul' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — CARBON / GLEC
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/carbon/calculate', (req, res) => {
  try {
    const { vehicleType, distanceKm, weightKg, fuelType, departureCountry } = req.body;
    const err = validate(['vehicleType', 'distanceKm', 'weightKg'], req.body);
    if (err) return res.status(400).json({ error: err });

    const gt = V2G[vehicleType];
    if (!gt) return res.status(400).json({ error: `Type véhicule inconnu: ${vehicleType}`, valid: Object.keys(V2G) });

    const r = calcGLEC(vehicleType, distanceKm, weightKg, fuelType, departureCountry);
    if (!r) return res.status(400).json({ error: 'Calcul impossible' });

    return res.json({
      success: true,
      methodology: {
        framework: 'GLEC Framework v3.2',
        standard: 'ISO 14083:2023',
        scope: 'Well-to-Wheel',
        daf: GLEC.DAF,
        vehicleCategory: gt,
        fuelType: GLEC.fuels[fuelType || 'diesel_b7']?.label || 'Diesel B7',
      },
      emissions: {
        totalCO2eKg: r.total,
        wtw: { total: r.total, ttw: r.ttw, wtt: r.wtt },
        intensity: { perTkm: r.perTkm, unit: 'gCO2e/tkm' },
        rating: r.rating,
      },
      legal: {
        iso14083: 'ISO 14083:2023',
        glec: 'GLEC Framework v3.2',
        euRegulation: 'Règlement (UE) 2023/2832',
        frenchDecree: 'Décret n°2017-639',
      },
      calculatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('CO2 error:', e.message);
    return res.status(500).json({ error: 'Erreur calcul CO2' });
  }
});

app.get('/api/carbon/factors', (req, res) => {
  return res.json({
    vehicleTypes: Object.entries(V2G).map(([v, g]) => ({
      vehicleType: v, glecCategory: g, label: VEHICLES[v]?.label, ef: GLEC.road[g],
    })),
    fuels: GLEC.fuels,
    electricityFactors: GLEC.elec,
    daf: GLEC.DAF,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — MISSIONS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/missions', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user.role === 'CLIENT') where.clientId = req.user.id;
    else if (req.user.role === 'TRANSPORTEUR') {
      const profile = await prisma.transporteurProfile.findUnique({ where: { userId: req.user.id } });
      if (profile) where.transporteurId = profile.id;
      else return res.json({ missions: [], total: 0, page: 1, limit: 20 });
    }
    if (status) where.status = status;

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const take = Math.min(100, parseInt(limit));

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take,
        include: { client: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
                   bids: { select: { id: true } } },
      }),
      prisma.mission.count({ where }),
    ]);

    return res.json({ missions, total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) });
  } catch (e) {
    console.error('List missions error:', e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/missions', auth, async (req, res) => {
  try {
    const d = req.body;
    const err = validate(['pickupCity', 'deliveryCity'], d);
    if (err) return res.status(400).json({ error: err });

    const pc = CITIES[d.pickupCity] || { lat: 48.8566, lon: 2.3522 };
    const dc = CITIES[d.deliveryCity] || { lat: 45.4642, lon: 9.19 };
    const pLa = d.pickupLat || pc.lat, pLo = d.pickupLon || pc.lon;
    const dLa = d.deliveryLat || dc.lat, dLo = d.deliveryLon || dc.lon;

    const pr = calcPrice({
      pickupLat: pLa, pickupLon: pLo, pickupCountry: d.pickupCountry || 'FR',
      deliveryLat: dLa, deliveryLon: dLo, deliveryCountry: d.deliveryCountry || 'FR',
      vehicleType: d.vehicleTypeRequired || 'FOURGON_20M3',
      isUrgent: d.isUrgent || false, isWeekend: d.isWeekend || false,
      isNight: d.isNight || false, isADR: d.isADR || false,
      ecoOption: d.ecoOption || 'standard',
    });

    const gl = calcGLEC(d.vehicleTypeRequired || 'FOURGON_20M3', pr.distanceKm, d.weightKg || 1000, d.fuelType, d.pickupCountry || 'FR');

    const mission = await prisma.mission.create({
      data: {
        client: { connect: { id: req.user.id } },
        reference: `TT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        status: d.enableBidding ? 'BIDDING' : 'PENDING',
        pickupAddress: d.pickupAddress || d.pickupCity, pickupCity: d.pickupCity,
        pickupPostalCode: d.pickupPostalCode || '00000', pickupCountry: d.pickupCountry || 'FR',
        pickupLat: pLa, pickupLon: pLo, pickupContact: d.pickupContact || null, pickupPhone: d.pickupPhone || null,
        pickupDateRequested: d.pickupDateRequested ? new Date(d.pickupDateRequested) : null,
        deliveryAddress: d.deliveryAddress || d.deliveryCity, deliveryCity: d.deliveryCity,
        deliveryPostalCode: d.deliveryPostalCode || '00000', deliveryCountry: d.deliveryCountry || 'FR',
        deliveryLat: dLa, deliveryLon: dLo, deliveryContact: d.deliveryContact || null, deliveryPhone: d.deliveryPhone || null,
        deliveryDateRequested: d.deliveryDateRequested ? new Date(d.deliveryDateRequested) : null,
        goodsDescription: d.goodsDescription || null, weightKg: d.weightKg || 1000,
        volumeM3: d.volumeM3 || null, packagesCount: d.packagesCount || 1,
        vehicleTypeRequired: d.vehicleTypeRequired || 'FOURGON_20M3',
        isUrgent: d.isUrgent || false, isWeekend: d.isWeekend || false,
        isNight: d.isNight || false, isADR: d.isADR || false,
        isFragile: d.isFragile || false, ecoOption: d.ecoOption || 'standard',
        distanceKm: pr.distanceKm, estimatedDurationHours: pr.estimatedHours,
        priceBase: pr.trinome.total, priceTolls: pr.tolls, priceSurcharges: pr.surcharges,
        priceEcoDiscount: pr.ecoDiscount, priceCommission: pr.commission,
        priceHT: pr.priceHT, priceTVA: pr.tva, priceTTC: pr.priceTTC, tvaRate: pr.tvaRate,
        co2Estimated: pr.co2Kg, ttScore: pr.ttScore,
        co2GlecWTW: gl?.total || null, co2GlecTTW: gl?.ttw || null,
        co2GlecWTT: gl?.wtt || null, co2Rating: gl?.rating || null,
        co2Methodology: gl ? 'GLEC v3 / ISO 14083' : null,
        biddingDeadline: d.enableBidding ? new Date(Date.now() + 48 * 3600000) : null,
        clientNotes: d.clientNotes,
      },
    });

    return res.status(201).json({ mission, price: pr, glec: gl });
  } catch (e) {
    console.error('Create mission error:', e.message);
    return res.status(500).json({ error: 'Erreur création mission', details: NODE_ENV !== 'production' ? e.message : undefined });
  }
});

app.get('/api/missions/:id', auth, async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, email: true, firstName: true, lastName: true, company: true } },
        transporteur: { include: { user: { select: { firstName: true, lastName: true } } } },
        vehicle: true,
        bids: { include: { transporteur: { include: { user: { select: { firstName: true, lastName: true } } } } }, orderBy: { amount: 'asc' } },
        ratings: true,
        carbonReports: true,
      },
    });
    if (!mission) return res.status(404).json({ error: 'Mission non trouvée' });

    // Security: only owner, assigned transporteur, or admin can see
    const isOwner = mission.clientId === req.user.id;
    const isAssigned = mission.transporteur?.userId === req.user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    return res.json({ mission });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.post('/api/missions/:id/accept', auth, async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: 'Mission non trouvée' });
    if (!['PENDING', 'BIDDING'].includes(mission.status)) {
      return res.status(400).json({ error: `Mission en statut ${mission.status}, non disponible` });
    }

    const profile = await prisma.transporteurProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(403).json({ error: 'Profil transporteur requis' });

    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: { transporteurId: profile.id, vehicleId: req.body.vehicleId || null, status: 'ACCEPTED', acceptedAt: new Date() },
    });
    await prisma.transporteurProfile.update({ where: { id: profile.id }, data: { totalMissions: { increment: 1 } } });
    await prisma.notification.create({
      data: { userId: mission.clientId, missionId: mission.id, type: 'MISSION_UPDATE', title: 'Mission acceptée', message: `${mission.reference} acceptée par un transporteur` },
    });

    return res.json({ mission: updated, message: 'Mission acceptée' });
  } catch (e) {
    console.error('Accept mission error:', e.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/missions/:id/start', auth, async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: 'Mission non trouvée' });
    if (mission.status !== 'ACCEPTED') return res.status(400).json({ error: `Statut ${mission.status} — doit être ACCEPTED` });

    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: { status: 'IN_TRANSIT', pickupDateActual: new Date() },
    });
    await prisma.notification.create({
      data: { userId: mission.clientId, missionId: mission.id, type: 'MISSION_UPDATE', title: 'En transit', message: `${mission.reference} est en transit` },
    });
    return res.json({ mission: updated, message: 'Mission démarrée' });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.post('/api/missions/:id/complete', auth, async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: 'Mission non trouvée' });
    if (mission.status !== 'IN_TRANSIT') return res.status(400).json({ error: `Statut ${mission.status} — doit être IN_TRANSIT` });

    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED', deliveryDateActual: new Date(), completedAt: new Date() },
    });
    if (updated.transporteurId) {
      await prisma.transporteurProfile.update({ where: { id: updated.transporteurId }, data: { completedMissions: { increment: 1 } } });
    }
    await prisma.notification.create({
      data: { userId: updated.clientId, missionId: updated.id, type: 'DELIVERY_CONFIRMED', title: 'Livraison confirmée', message: `${updated.reference} livrée avec succès` },
    });
    return res.json({ mission: updated, message: 'Mission livrée' });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/marketplace/missions', optAuth, async (req, res) => {
  try {
    const {
      status = 'BIDDING', urgent, eco, adr, frigo,
      minDistance, maxDistance, minWeight, maxWeight,
      pickupCountry, deliveryCountry,
      sort = 'newest', page = 1, limit = 20, search,
    } = req.query;

    const where = { status };
    if (urgent === 'true') where.isUrgent = true;
    if (adr === 'true') where.isADR = true;
    if (frigo === 'true') where.vehicleTypeRequired = { contains: 'FRIGO' };
    if (eco === 'true') where.ecoOption = { not: 'standard' };
    if (minDistance) where.distanceKm = { ...(where.distanceKm || {}), gte: parseFloat(minDistance) };
    if (maxDistance) where.distanceKm = { ...(where.distanceKm || {}), lte: parseFloat(maxDistance) };
    if (minWeight) where.weightKg = { ...(where.weightKg || {}), gte: parseFloat(minWeight) };
    if (maxWeight) where.weightKg = { ...(where.weightKg || {}), lte: parseFloat(maxWeight) };
    if (pickupCountry) where.pickupCountry = pickupCountry;
    if (deliveryCountry) where.deliveryCountry = deliveryCountry;
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { pickupCity: { contains: search, mode: 'insensitive' } },
        { deliveryCity: { contains: search, mode: 'insensitive' } },
        { goodsDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderMap = {
      newest: { createdAt: 'desc' }, oldest: { createdAt: 'asc' },
      price_asc: { priceHT: 'asc' }, price_desc: { priceHT: 'desc' },
      distance: { distanceKm: 'asc' }, weight: { weightKg: 'desc' },
      urgent: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    };
    const orderBy = orderMap[sort] || { createdAt: 'desc' };

    const take = Math.min(50, parseInt(limit));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where, orderBy, skip, take,
        include: {
          client: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
          bids: { select: { id: true, amount: true, transporteurId: true, createdAt: true } },
        },
      }),
      prisma.mission.count({ where }),
    ]);

    const data = missions.map(m => ({
      ...m,
      co2Glec: m.co2GlecWTW ? { totalKg: m.co2GlecWTW, rating: m.co2Rating } : null,
      bidsCount: m.bids?.length || 0,
      bestBid: m.bids?.length ? Math.min(...m.bids.map(b => b.amount)) : null,
      timeLeft: m.biddingDeadline ? Math.max(0, new Date(m.biddingDeadline) - Date.now()) : null,
    }));

    return res.json({
      success: true, data,
      pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
    });
  } catch (e) {
    console.error('Marketplace error:', e.message);
    return res.status(500).json({ error: 'Erreur marketplace' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — BIDDING
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/marketplace/bid', auth, async (req, res) => {
  try {
    const { missionId, amount, message, vehicleId, estimatedPickupDate } = req.body;
    const err = validate(['missionId', 'amount'], req.body);
    if (err) return res.status(400).json({ error: err });
    if (amount <= 0) return res.status(400).json({ error: 'Montant doit être positif' });

    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    if (mission.status !== 'BIDDING') return res.status(400).json({ error: 'Mission non ouverte aux enchères' });
    if (mission.biddingDeadline && new Date(mission.biddingDeadline) < new Date()) {
      return res.status(400).json({ error: 'Deadline d\'enchères dépassée' });
    }

    const profile = await prisma.transporteurProfile.findUnique({ where: { userId: req.user.id }, include: { user: true } });
    if (!profile) return res.status(403).json({ error: 'Profil transporteur requis' });

    const bid = await prisma.bid.create({
      data: {
        missionId, transporteurId: profile.id, amount: parseInt(amount),
        message: message || null, vehicleId: vehicleId || null,
        estimatedPickupDate: estimatedPickupDate ? new Date(estimatedPickupDate) : null,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: mission.clientId, type: 'NEW_BID', missionId,
        title: 'Nouvelle enchère',
        message: `${profile.user?.firstName || 'Transporteur'} propose ${amount}€ sur ${mission.reference}`,
      },
    });

    return res.status(201).json({ success: true, data: bid, message: `Enchère de ${amount}€ placée` });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Vous avez déjà enchéri sur cette mission' });
    console.error('Bid error:', e.message);
    return res.status(500).json({ error: 'Erreur enchère' });
  }
});

app.post('/api/marketplace/bid/:bidId/accept', auth, async (req, res) => {
  try {
    const bid = await prisma.bid.findUnique({
      where: { id: req.params.bidId },
      include: { mission: true, transporteur: true },
    });
    if (!bid) return res.status(404).json({ error: 'Enchère introuvable' });
    if (bid.mission.clientId !== req.user.id) return res.status(403).json({ error: 'Seul le client peut accepter' });
    if (bid.status !== 'PENDING') return res.status(400).json({ error: `Enchère déjà ${bid.status}` });

    await prisma.$transaction([
      prisma.bid.update({ where: { id: bid.id }, data: { status: 'ACCEPTED', respondedAt: new Date() } }),
      prisma.mission.update({ where: { id: bid.missionId }, data: { status: 'ACCEPTED', transporteurId: bid.transporteurId, acceptedAt: new Date() } }),
      prisma.bid.updateMany({ where: { missionId: bid.missionId, id: { not: bid.id } }, data: { status: 'REJECTED', respondedAt: new Date() } }),
      prisma.transporteurProfile.update({ where: { id: bid.transporteurId }, data: { totalMissions: { increment: 1 } } }),
    ]);

    await prisma.notification.create({
      data: {
        userId: bid.transporteur.userId, missionId: bid.missionId,
        type: 'BID_ACCEPTED', title: 'Enchère acceptée !',
        message: `Votre enchère de ${bid.amount}€ sur ${bid.mission.reference} a été acceptée`,
      },
    });

    return res.json({ success: true, message: 'Enchère acceptée, mission assignée' });
  } catch (e) {
    console.error('Accept bid error:', e.message);
    return res.status(500).json({ error: 'Erreur' });
  }
});

app.get('/api/marketplace/bids/:missionId', auth, async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { missionId: req.params.missionId },
      include: {
        transporteur: {
          include: { user: { select: { firstName: true, lastName: true, company: { select: { name: true } } } } },
        },
        vehicle: true,
      },
      orderBy: { amount: 'asc' },
    });
    return res.json({ success: true, data: bids, count: bids.length });
  } catch (e) { return res.status(500).json({ error: 'Erreur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — AI MATCHING
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/marketplace/match', auth, async (req, res) => {
  try {
    const { missionId } = req.body;
    if (!missionId) return res.status(400).json({ error: 'missionId requis' });

    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });

    const carriers = await prisma.transporteurProfile.findMany({
      where: { isVerified: true },
      include: {
        vehicles: true,
        user: { select: { firstName: true, lastName: true, company: { select: { name: true, city: true } } } },
      },
    });

    const scored = carriers.map(c => {
      let score = 0;
      const factors = [];

      // 1. Capacité véhicule (25 pts)
      const hasCapacity = c.vehicles.some(v => (VEHICLES[v.type]?.capacityKg || 0) >= mission.weightKg);
      const capScore = hasCapacity ? 25 : 0;
      score += capScore;
      factors.push({ criterion: 'capacity', score: capScore, max: 25 });

      // 2. Proximité géographique (20 pts)
      let proxScore = 10;
      if (c.user?.company?.city && mission.pickupCity) {
        proxScore = c.user.company.city.toLowerCase() === mission.pickupCity.toLowerCase() ? 20
          : c.coverageRadius >= (mission.distanceKm || 500) ? 15 : 8;
      }
      score += proxScore;
      factors.push({ criterion: 'proximity', score: proxScore, max: 20 });

      // 3. Note moyenne (15 pts)
      const ratScore = Math.round((c.averageRating / 5) * 15);
      score += ratScore;
      factors.push({ criterion: 'rating', score: ratScore, max: 15 });

      // 4. Spécialisations (15 pts)
      let specScore = 15;
      if (mission.isADR && !c.hasADR) specScore = 0;
      if (mission.vehicleTypeRequired?.includes('FRIGO') && !c.hasFrigo) specScore = 0;
      score += specScore;
      factors.push({ criterion: 'specialization', score: specScore, max: 15 });

      // 5. Fiabilité (10 pts)
      const completionRate = c.totalMissions > 0 ? c.completedMissions / c.totalMissions : 0.5;
      const relScore = Math.round(completionRate * 10);
      score += relScore;
      factors.push({ criterion: 'reliability', score: relScore, max: 10 });

      // 6. Éco-responsabilité (10 pts)
      const hasEco = c.vehicles.some(v => ['electric', 'hvo100', 'hydrogen'].includes(v.fuelType));
      const ecoScore = hasEco ? 10 : 5;
      score += ecoScore;
      factors.push({ criterion: 'eco', score: ecoScore, max: 10 });

      // 7. Expérience (5 pts)
      const expScore = c.totalMissions >= 100 ? 5 : c.totalMissions >= 50 ? 4 : c.totalMissions >= 20 ? 3 : 1;
      score += expScore;
      factors.push({ criterion: 'experience', score: expScore, max: 5 });

      const tier = score >= 85 ? 'gold' : score >= 65 ? 'silver' : 'bronze';
      const badges = [
        c.averageRating >= 4.8 && '⭐ Top Rated',
        c.completedMissions >= 500 && '🏆 Expert',
        hasEco && '🌿 Éco',
        completionRate >= 0.98 && c.totalMissions >= 100 && '⚡ Fiable',
      ].filter(Boolean);

      return {
        transporteurId: c.id,
        name: c.user?.company?.name || `${c.user?.firstName} ${c.user?.lastName}`,
        matchScore: Math.min(100, score), tier, factors,
        rating: c.averageRating, totalMissions: c.totalMissions, badges,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      mission: { id: mission.id, reference: mission.reference, route: `${mission.pickupCity} → ${mission.deliveryCity}` },
      matches: scored.slice(0, 20), // Top 20
      algorithm: { version: 'v3.1', criteria: 7, maxScore: 100 },
    });
  } catch (e) {
    console.error('Match error:', e.message);
    return res.status(500).json({ error: 'Erreur matching' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — RATINGS
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/ratings', auth, async (req, res) => {
  try {
    const { missionId, score, comment, criteria } = req.body;
    if (!missionId || !score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'missionId requis, score entre 1 et 5' });
    }

    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return res.status(404).json({ error: 'Mission introuvable' });
    if (!mission.transporteurId) return res.status(400).json({ error: 'Mission sans transporteur assigné' });
    if (!['DELIVERED', 'COMPLETED'].includes(mission.status)) {
      return res.status(400).json({ error: 'Mission pas encore livrée' });
    }

    const rating = await prisma.rating.create({
      data: {
        missionId, fromUserId: req.user.id, toTransporteurId: mission.transporteurId,
        score: parseInt(score), comment: comment || null,
        punctuality: criteria?.punctuality || null,
        communication: criteria?.communication || null,
        cargoHandling: criteria?.cargoHandling || null,
        professionalism: criteria?.professionalism || null,
      },
    });

    // Recalculate average
    const allRatings = await prisma.rating.findMany({
      where: { toTransporteurId: mission.transporteurId },
      select: { score: true },
    });
    const avg = allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length;
    await prisma.transporteurProfile.update({
      where: { id: mission.transporteurId },
      data: { averageRating: Math.round(avg * 10) / 10 },
    });

    // Notify transporteur
    const tp = await prisma.transporteurProfile.findUnique({ where: { id: mission.transporteurId } });
    if (tp) {
      await prisma.notification.create({
        data: {
          userId: tp.userId, missionId, type: 'RATING_RECEIVED',
          title: 'Nouvelle note reçue', message: `${score}/5 pour ${mission.reference}`,
        },
      });
    }

    return res.status(201).json({ success: true, data: rating });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Mission déjà notée par cet utilisateur' });
    console.error('Rating error:', e.message);
    return res.status(500).json({ error: 'Erreur notation' });
  }
});

app.get('/api/ratings/:transporteurId', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { toTransporteurId: req.params.transporteurId },
      include: {
        fromUser: { select: { firstName: true, lastName: true } },
        mission: { select: { reference: true, pickupCity: true, deliveryCity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length : 0;
    return res.json({ success: true, data: ratings, count: ratings.length, average: Math.round(avg * 10) / 10 });
  } catch (e) { return res.status(500).json({ error: 'Erreur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/notifications', auth, async (req, res) => {
  try {
    const { unreadOnly = 'false', limit = 20 } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.read = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: Math.min(100, parseInt(limit)) }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } }),
    ]);
    return res.json({ success: true, data: notifications, unreadCount });
  } catch (e) { return res.status(500).json({ error: 'Erreur notifications' }); }
});

app.post('/api/notifications/read', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    if (notificationIds?.length) {
      await prisma.notification.updateMany({ where: { id: { in: notificationIds }, userId: req.user.id }, data: { read: true } });
    } else {
      await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
    }
    return res.json({ success: true, message: 'Notifications marquées comme lues' });
  } catch (e) { return res.status(500).json({ error: 'Erreur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — ADMIN
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/admin/stats', auth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const [usersCount, missionsCount, transporteursCount, bidsCount, ratingsCount] = await Promise.all([
      prisma.user.count(), prisma.mission.count(),
      prisma.transporteurProfile.count(), prisma.bid.count(), prisma.rating.count(),
    ]);

    const completedMissions = await prisma.mission.findMany({
      where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
      select: { priceTTC: true, co2GlecWTW: true },
    });
    const totalRevenue = completedMissions.reduce((s, m) => s + m.priceTTC, 0);
    const totalCO2 = completedMissions.reduce((s, m) => s + (m.co2GlecWTW || 0), 0);

    const statusCounts = {};
    const allMissions = await prisma.mission.groupBy({ by: ['status'], _count: true });
    allMissions.forEach(g => { statusCounts[g.status] = g._count; });

    return res.json({
      stats: {
        usersCount, missionsCount, transporteursCount, bidsCount, ratingsCount,
        totalRevenue: totalRevenue / 100,
        totalCommission: (totalRevenue * 0.10) / 100,
        totalCO2Kg: Math.round(totalCO2 * 10) / 10,
        missionsByStatus: statusCounts,
      },
    });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.get('/api/admin/users', auth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    // Remove password hashes
    const safeUsers = users.map(({ passwordHash, ...u }) => u);
    return res.json({ users: safeUsers, count: safeUsers.length });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.get('/api/admin/missions', auth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const take = Math.min(100, parseInt(limit));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        include: {
          client: { select: { email: true, firstName: true, lastName: true, company: { select: { name: true } } } },
          transporteur: { include: { user: { select: { firstName: true, lastName: true } } } },
          bids: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' }, skip, take,
      }),
      prisma.mission.count(),
    ]);
    return res.json({ missions, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — TRACKING (public)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/tracking/:reference', async (req, res) => {
  try {
    const mission = await prisma.mission.findFirst({
      where: { OR: [{ id: req.params.reference }, { reference: req.params.reference }] },
      include: {
        transporteur: { include: { user: { select: { firstName: true, lastName: true } } } },
        vehicle: true,
      },
    });
    if (!mission) return res.status(404).json({ error: 'Mission non trouvée' });

    // Calculate progress
    const progressMap = { PENDING: 0, BIDDING: 5, ACCEPTED: 15, IN_TRANSIT: 50, DELIVERED: 100, COMPLETED: 100, CANCELLED: 0 };
    let progress = progressMap[mission.status] || 0;

    if (mission.status === 'IN_TRANSIT' && mission.pickupDateActual) {
      const startTime = new Date(mission.pickupDateActual).getTime();
      const durationMs = (mission.estimatedDurationHours || 8) * 3600000;
      progress = Math.min(95, Math.round(15 + ((Date.now() - startTime) / durationMs) * 80));
    }

    return res.json({
      tracking: {
        reference: mission.reference, status: mission.status, progress,
        pickup: { city: mission.pickupCity, country: mission.pickupCountry, date: mission.pickupDateActual },
        delivery: { city: mission.deliveryCity, country: mission.deliveryCountry, date: mission.deliveryDateActual },
        estimated: { hours: mission.estimatedDurationHours, distance: mission.distanceKm },
        transporteur: mission.transporteur ? {
          name: `${mission.transporteur.user?.firstName || ''} ${mission.transporteur.user?.lastName || ''}`.trim(),
          rating: mission.transporteur.averageRating,
        } : null,
        vehicle: mission.vehicle ? { type: mission.vehicle.type, plate: mission.vehicle.licensePlate } : null,
        co2: mission.co2GlecWTW ? { totalKg: mission.co2GlecWTW, rating: mission.co2Rating } : null,
      },
    });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES — TRANSPORTEUR
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/transporteur/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'TRANSPORTEUR') return res.status(403).json({ error: 'Accès transporteur requis' });

    const profile = await prisma.transporteurProfile.findUnique({
      where: { userId: req.user.id }, include: { vehicles: true },
    });
    if (!profile) return res.status(404).json({ error: 'Profil transporteur non trouvé' });

    const missions = await prisma.mission.findMany({ where: { transporteurId: profile.id } });
    const revenue = missions.filter(m => ['DELIVERED', 'COMPLETED'].includes(m.status)).reduce((s, m) => s + m.priceTTC, 0);
    const [bidsCount, ratingsCount] = await Promise.all([
      prisma.bid.count({ where: { transporteurId: profile.id } }),
      prisma.rating.count({ where: { toTransporteurId: profile.id } }),
    ]);

    return res.json({
      stats: {
        totalMissions: profile.totalMissions, completedMissions: profile.completedMissions,
        averageRating: profile.averageRating, isVerified: profile.isVerified,
        totalRevenue: revenue / 100, netRevenue: (revenue * 0.90) / 100,
        vehiclesCount: profile.vehicles.length, bidsCount, ratingsCount,
        activeMissions: missions.filter(m => ['ACCEPTED', 'IN_TRANSIT'].includes(m.status)).length,
      },
      vehicles: profile.vehicles,
    });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.get('/api/transporteur/missions', auth, async (req, res) => {
  try {
    const profile = await prisma.transporteurProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil non trouvé' });

    const missions = await prisma.mission.findMany({
      where: { transporteurId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
        vehicle: true,
      },
    });
    return res.json({ missions, count: missions.length });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.get('/api/transporteur/available', auth, async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { status: { in: ['PENDING', 'BIDDING'] }, transporteurId: null },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      include: {
        client: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
        bids: { select: { id: true } },
      },
      take: 50,
    });
    return res.json({ missions, count: missions.length });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

app.get('/api/missions/available/list', auth, async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      where: { status: { in: ['PENDING', 'BIDDING'] }, transporteurId: null },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
    return res.json({ missions, count: missions.length });
  } catch (e) { return res.status(500).json({ error: 'Erreur serveur' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════════════════════

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} non trouvée`, hint: 'GET /health pour vérifier l\'API' });
});

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════

app.use((err, req, res, _next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// ═══════════════════════════════════════════════════════════════════════════
// START + GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🚛 TRANSPORT TOKEN API v${VERSION}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   🌐 http://localhost:${PORT}`);
  console.log(`   🔧 Environment: ${NODE_ENV}`);
  console.log('   📍 AUTH · MISSIONS · MARKETPLACE · BIDDING · MATCHING');
  console.log('   📍 CARBON/GLEC · RATINGS · NOTIFICATIONS · TRACKING · ADMIN');
  console.log('═══════════════════════════════════════════════════════════════');
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('✅ Server closed, DB disconnected.');
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10000); // Force exit after 10s
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => console.error('💥 Unhandled rejection:', err));
