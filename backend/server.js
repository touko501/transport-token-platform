const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = 'transport-token-secret-key-2025';

// Middleware
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// PRICING SERVICE - TRINÔME CNR
// ═══════════════════════════════════════════════════════════════════════════

const VEHICLES = {
  FOURGONNETTE: { ck: 0.52, cc: 24, cj: 95, co2: 184, speed: 55 },
  FOURGON_12M3: { ck: 0.65, cc: 26, cj: 115, co2: 276, speed: 60 },
  FOURGON_20M3: { ck: 0.78, cc: 28, cj: 135, co2: 322, speed: 65 },
  PORTEUR_7T5: { ck: 0.92, cc: 32, cj: 185, co2: 414, speed: 70 },
  PORTEUR_12T: { ck: 1.05, cc: 35, cj: 215, co2: 506, speed: 70 },
  SEMI_TAUTLINER: { ck: 1.35, cc: 42, cj: 295, co2: 736, speed: 80 },
  SEMI_FRIGO: { ck: 1.75, cc: 48, cj: 365, co2: 874, speed: 80 },
  ELECTRIQUE_FOURGON: { ck: 0.55, cc: 26, cj: 125, co2: 0, speed: 60 },
};

const COUNTRIES = {
  FR: { tva: 20, toll: 0.15 },
  DE: { tva: 19, toll: 0.35 },
  BE: { tva: 21, toll: 0.12 },
  ES: { tva: 21, toll: 0.10 },
  IT: { tva: 22, toll: 0.12 },
  NL: { tva: 21, toll: 0.00 },
  GB: { tva: 20, toll: 0.05 },
  PL: { tva: 23, toll: 0.08 },
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3);
}

function calculatePrice(params) {
  const { pickupLat, pickupLon, pickupCountry, deliveryLat, deliveryLon, deliveryCountry, vehicleType, isUrgent, isWeekend, isNight, isADR, ecoOption } = params;
  
  const veh = VEHICLES[vehicleType] || VEHICLES.FOURGON_20M3;
  const distance = haversine(pickupLat, pickupLon, deliveryLat, deliveryLon);
  
  let hours = distance / veh.speed;
  hours += Math.floor(hours / 4.5) * 0.75 + 2;
  const days = Math.ceil(hours / 10);
  
  // Trinôme CNR
  const ck = veh.ck * distance;
  const cc = veh.cc * hours;
  const cj = veh.cj * days;
  let basePrice = ck + cc + cj;
  
  // Péages
  const pickupToll = (COUNTRIES[pickupCountry] || COUNTRIES.FR).toll;
  const deliveryToll = (COUNTRIES[deliveryCountry] || COUNTRIES.FR).toll;
  const tolls = distance * ((pickupToll + deliveryToll) / 2);
  
  // Majorations
  let surcharges = 0;
  if (isUrgent) surcharges += basePrice * 0.50;
  if (isWeekend) surcharges += basePrice * 0.35;
  if (isNight) surcharges += basePrice * 0.20;
  if (isADR) surcharges += basePrice * 0.25;
  
  // Réduction éco
  let ecoDiscount = 0;
  if (ecoOption === 'hvo') ecoDiscount = (basePrice + surcharges) * 0.15;
  if (ecoOption === 'electric') ecoDiscount = (basePrice + surcharges) * 0.30;
  
  // Commission 10%
  const priceBeforeCommission = basePrice + tolls + surcharges - ecoDiscount;
  const commission = priceBeforeCommission * 0.10;
  
  // TVA
  const priceHT = priceBeforeCommission + commission;
  const tvaRate = (COUNTRIES[deliveryCountry] || COUNTRIES.FR).tva;
  const tva = priceHT * (tvaRate / 100);
  const priceTTC = priceHT + tva;
  
  // CO2
  const co2 = (veh.co2 * distance) / 1000;
  
  // TT Score
  let ttScore = 50;
  if (ecoOption === 'electric') ttScore += 30;
  else if (ecoOption === 'hvo') ttScore += 15;
  ttScore -= Math.min(20, (co2 / distance) * 30);
  ttScore = Math.max(0, Math.min(100, Math.round(ttScore)));
  
  return {
    distanceKm: distance,
    estimatedHours: Math.round(hours * 10) / 10,
    estimatedDays: days,
    trinome: { ck: Math.round(ck * 100), cc: Math.round(cc * 100), cj: Math.round(cj * 100), total: Math.round(basePrice * 100) },
    tolls: Math.round(tolls * 100),
    surcharges: Math.round(surcharges * 100),
    ecoDiscount: Math.round(ecoDiscount * 100),
    commission: Math.round(commission * 100),
    priceHT: Math.round(priceHT * 100),
    tvaRate,
    tva: Math.round(tva * 100),
    priceTTC: Math.round(priceTTC * 100),
    pricePerKm: Math.round((priceTTC / distance) * 100) / 100,
    co2Kg: Math.round(co2 * 10) / 10,
    ttScore,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, company } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    
    let companyRecord = null;
    if (company?.siret) {
      companyRecord = await prisma.company.upsert({
        where: { siret: company.siret },
        update: {},
        create: {
          name: company.name,
          siret: company.siret,
          address: company.address,
          city: company.city,
          postalCode: company.postalCode,
          country: 'FR',
        },
      });
    }
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'CLIENT',
        status: 'ACTIVE',
        companyId: companyRecord?.id,
      },
    });
    
    // Create transporteur profile if role is TRANSPORTEUR
    if (role === 'TRANSPORTEUR') {
      await prisma.transporteurProfile.create({
        data: { userId: user.id },
      });
    }
    
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Inscription réussie',
      accessToken,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Compte non actif' });
    }
    
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    res.json({
      message: 'Connexion réussie',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true, transporteurProfile: true },
    });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/pricing/vehicles', (req, res) => {
  res.json({ vehicles: VEHICLES });
});

app.get('/api/pricing/countries', (req, res) => {
  res.json({ countries: COUNTRIES });
});

// ─────────────────────────────────────────────────────────────────────────────
// MISSIONS
// ─────────────────────────────────────────────────────────────────────────────

app.post('/api/missions/quote', (req, res) => {
  try {
    const price = calculatePrice(req.body);
    res.json({
      quote: {
        ...price,
        // Convertir en euros pour l'affichage
        priceHTEuros: price.priceHT / 100,
        priceTTCEuros: price.priceTTC / 100,
        tollsEuros: price.tolls / 100,
        commissionEuros: price.commission / 100,
      },
    });
  } catch (err) {
    console.error('Quote error:', err);
    res.status(500).json({ error: 'Erreur calcul' });
  }
});

app.get('/api/missions', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (req.user.role === 'CLIENT') {
      where.clientId = req.user.id;
    } else if (req.user.role === 'TRANSPORTEUR') {
      const profile = await prisma.transporteurProfile.findUnique({ where: { userId: req.user.id } });
      if (profile) {
        where.transporteurId = profile.id;
      }
    }
    if (status) where.status = status;
    
    const missions = await prisma.mission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });
    
    const total = await prisma.mission.count({ where });
    
    res.json({ missions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Get missions error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/missions/available/list', authMiddleware, async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      where: {
        status: 'PENDING',
        transporteurId: null,
      },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/missions', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    
    // Default coordinates for cities if not provided
    const CITY_COORDS = {
      'Paris': { lat: 48.8566, lon: 2.3522 },
      'Lyon': { lat: 45.7640, lon: 4.8357 },
      'Marseille': { lat: 43.2965, lon: 5.3698 },
      'Milan': { lat: 45.4642, lon: 9.1900 },
      'Madrid': { lat: 40.4168, lon: -3.7038 },
      'Berlin': { lat: 52.5200, lon: 13.4050 },
      'Bruxelles': { lat: 50.8503, lon: 4.3517 },
      'Amsterdam': { lat: 52.3676, lon: 4.9041 },
    };
    
    // Get coordinates from city names if not provided
    const pickupCoords = CITY_COORDS[data.pickupCity] || { lat: 48.8566, lon: 2.3522 };
    const deliveryCoords = CITY_COORDS[data.deliveryCity] || { lat: 45.4642, lon: 9.1900 };
    
    const pickupLat = data.pickupLat || pickupCoords.lat;
    const pickupLon = data.pickupLon || pickupCoords.lon;
    const deliveryLat = data.deliveryLat || deliveryCoords.lat;
    const deliveryLon = data.deliveryLon || deliveryCoords.lon;
    
    // Calculate pricing
    const price = calculatePrice({
      pickupLat,
      pickupLon,
      pickupCountry: data.pickupCountry || 'FR',
      deliveryLat,
      deliveryLon,
      deliveryCountry: data.deliveryCountry || 'FR',
      vehicleType: data.vehicleTypeRequired || 'FOURGON_20M3',
      isUrgent: data.isUrgent || false,
      isWeekend: data.isWeekend || false,
      isNight: data.isNight || false,
      isADR: data.isADR || false,
      ecoOption: data.ecoOption || 'standard',
    });
    
    const mission = await prisma.mission.create({
      data: {
        client: { connect: { id: req.user.id } },
        reference: `TT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        status: 'PENDING',
        pickupAddress: data.pickupAddress,
        pickupCity: data.pickupCity,
        pickupPostalCode: data.pickupPostalCode,
        pickupCountry: data.pickupCountry || 'FR',
        pickupLat: pickupLat,
        pickupLon: pickupLon,
        pickupContact: data.pickupContact || null,
        pickupPhone: data.pickupPhone || null,
        pickupDateRequested: data.pickupDateRequested ? new Date(data.pickupDateRequested) : null,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity,
        deliveryPostalCode: data.deliveryPostalCode,
        deliveryCountry: data.deliveryCountry || 'FR',
        deliveryLat: deliveryLat,
        deliveryLon: deliveryLon,
        deliveryContact: data.deliveryContact || null,
        deliveryPhone: data.deliveryPhone || null,
        deliveryDateRequested: data.deliveryDateRequested ? new Date(data.deliveryDateRequested) : null,
        goodsDescription: data.goodsDescription || null,
        weightKg: data.weightKg || 1000,
        volumeM3: data.volumeM3 || null,
        packagesCount: data.packagesCount || 1,
        vehicleTypeRequired: data.vehicleTypeRequired || 'FOURGON_20M3',
        isUrgent: data.isUrgent || false,
        isWeekend: data.isWeekend || false,
        isNight: data.isNight || false,
        isADR: data.isADR || false,
        isFragile: data.isFragile || false,
        ecoOption: data.ecoOption || 'standard',
        distanceKm: price.distanceKm,
        estimatedDurationHours: price.estimatedHours,
        priceBase: price.trinome.total,
        priceTolls: price.tolls,
        priceSurcharges: price.surcharges,
        priceEcoDiscount: price.ecoDiscount,
        priceCommission: price.commission,
        priceHT: price.priceHT,
        priceTVA: price.tva,
        priceTTC: price.priceTTC,
        tvaRate: price.tvaRate,
        co2Estimated: price.co2Kg,
        ttScore: price.ttScore,
        clientNotes: data.clientNotes,
      },
    });
    
    res.status(201).json({ mission, price });
  } catch (err) {
    console.error('Create mission error:', err);
    res.status(500).json({ error: 'Erreur création mission' });
  }
});

app.get('/api/missions/:id', authMiddleware, async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, email: true, firstName: true, lastName: true, company: true } },
        transporteur: { include: { user: { select: { firstName: true, lastName: true } } } },
        vehicle: true,
      },
    });
    
    if (!mission) {
      return res.status(404).json({ error: 'Mission non trouvée' });
    }
    
    res.json({ mission });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/missions/:id/accept', authMiddleware, async (req, res) => {
  try {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    
    if (!mission || mission.status !== 'PENDING') {
      return res.status(400).json({ error: 'Mission non disponible' });
    }
    
    const profile = await prisma.transporteurProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(403).json({ error: 'Profil transporteur requis' });
    }
    
    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: {
        transporteurId: profile.id,
        vehicleId: req.body.vehicleId,
        status: 'ACCEPTED',
      },
    });
    
    // Update transporteur stats
    await prisma.transporteurProfile.update({
      where: { id: profile.id },
      data: { totalMissions: { increment: 1 } },
    });
    
    res.json({ mission: updated, message: 'Mission acceptée' });
  } catch (err) {
    console.error('Accept mission error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/missions/:id/start', authMiddleware, async (req, res) => {
  try {
    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_TRANSIT',
        pickupDateActual: new Date(),
      },
    });
    res.json({ mission: updated, message: 'Mission démarrée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/missions/:id/complete', authMiddleware, async (req, res) => {
  try {
    const updated = await prisma.mission.update({
      where: { id: req.params.id },
      data: {
        status: 'DELIVERED',
        deliveryDateActual: new Date(),
        completedAt: new Date(),
      },
    });
    
    // Update transporteur stats
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (mission?.transporteurId) {
      await prisma.transporteurProfile.update({
        where: { id: mission.transporteurId },
        data: { completedMissions: { increment: 1 } },
      });
    }
    
    res.json({ mission: updated, message: 'Mission livrée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/admin/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const [usersCount, missionsCount, transporteursCount] = await Promise.all([
      prisma.user.count(),
      prisma.mission.count(),
      prisma.transporteurProfile.count(),
    ]);
    
    const completedMissions = await prisma.mission.findMany({
      where: { status: { in: ['DELIVERED', 'COMPLETED'] } },
      select: { priceTTC: true },
    });
    
    const totalRevenue = completedMissions.reduce((sum, m) => sum + m.priceTTC, 0);
    
    res.json({
      stats: {
        usersCount,
        missionsCount,
        transporteursCount,
        totalRevenue: totalRevenue / 100,
        totalCommission: (totalRevenue * 0.1) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const users = await prisma.user.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/admin/missions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const missions = await prisma.mission.findMany({
      include: {
        client: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRACKING
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/tracking/:reference', async (req, res) => {
  try {
    const mission = await prisma.mission.findFirst({
      where: { 
        OR: [
          { id: req.params.reference },
          { reference: req.params.reference }
        ]
      },
      include: {
        transporteur: { 
          include: { 
            user: { select: { firstName: true, lastName: true, phone: true } },
          } 
        },
        vehicle: true,
      },
    });
    
    if (!mission) {
      return res.status(404).json({ error: 'Mission non trouvée' });
    }
    
    // Calcul progress simulé
    let progress = 0;
    const statusProgress = {
      'PENDING': 0,
      'ACCEPTED': 10,
      'IN_TRANSIT': 50,
      'DELIVERED': 100,
      'COMPLETED': 100,
    };
    progress = statusProgress[mission.status] || 0;
    
    // Si en transit, simuler la progression
    if (mission.status === 'IN_TRANSIT' && mission.pickupDateActual) {
      const started = new Date(mission.pickupDateActual).getTime();
      const duration = (mission.estimatedDurationHours || 8) * 3600 * 1000;
      const elapsed = Date.now() - started;
      progress = Math.min(95, 10 + (elapsed / duration) * 85);
    }
    
    res.json({
      tracking: {
        reference: mission.reference,
        status: mission.status,
        progress: Math.round(progress),
        pickup: {
          city: mission.pickupCity,
          country: mission.pickupCountry,
          dateRequested: mission.pickupDateRequested,
          dateActual: mission.pickupDateActual,
        },
        delivery: {
          city: mission.deliveryCity,
          country: mission.deliveryCountry,
          dateRequested: mission.deliveryDateRequested,
          eta: mission.estimatedDurationHours ? 
            new Date(Date.now() + mission.estimatedDurationHours * 3600 * 1000).toISOString() : null,
        },
        vehicle: mission.vehicle ? {
          type: mission.vehicle.type,
          licensePlate: mission.vehicle.licensePlate,
        } : null,
        driver: mission.transporteur ? {
          name: `${mission.transporteur.user.firstName} ${mission.transporteur.user.lastName}`,
          phone: mission.transporteur.user.phone,
        } : null,
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Tracking error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTEUR STATS
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/transporteur/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'TRANSPORTEUR') {
      return res.status(403).json({ error: 'Accès transporteur requis' });
    }
    
    const profile = await prisma.transporteurProfile.findUnique({
      where: { userId: req.user.id },
      include: { vehicles: true },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }
    
    // Missions du transporteur
    const missions = await prisma.mission.findMany({
      where: { transporteurId: profile.id },
    });
    
    const completedMissions = missions.filter(m => 
      m.status === 'DELIVERED' || m.status === 'COMPLETED'
    );
    
    const totalRevenue = completedMissions.reduce((sum, m) => sum + m.priceTTC, 0);
    const commission = totalRevenue * 0.1;
    const netRevenue = totalRevenue - commission;
    
    // Stats par mois (simplifié)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const missionsThisMonth = missions.filter(m => 
      new Date(m.createdAt) >= thisMonth
    );
    
    res.json({
      stats: {
        totalMissions: profile.totalMissions,
        completedMissions: profile.completedMissions,
        averageRating: profile.averageRating,
        isVerified: profile.isVerified,
        totalRevenue: totalRevenue / 100,
        netRevenue: netRevenue / 100,
        commission: commission / 100,
        vehiclesCount: profile.vehicles.length,
        missionsThisMonth: missionsThisMonth.length,
        pendingMissions: missions.filter(m => m.status === 'PENDING').length,
        activeMissions: missions.filter(m => 
          m.status === 'ACCEPTED' || m.status === 'IN_TRANSIT'
        ).length,
      },
      vehicles: profile.vehicles,
    });
  } catch (err) {
    console.error('Transporteur stats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/transporteur/missions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'TRANSPORTEUR') {
      return res.status(403).json({ error: 'Accès transporteur requis' });
    }
    
    const profile = await prisma.transporteurProfile.findUnique({
      where: { userId: req.user.id },
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }
    
    const missions = await prisma.mission.findMany({
      where: { transporteurId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { firstName: true, lastName: true, company: true } },
        vehicle: true,
      },
    });
    
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Missions disponibles pour les transporteurs
app.get('/api/transporteur/available', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'TRANSPORTEUR') {
      return res.status(403).json({ error: 'Accès transporteur requis' });
    }
    
    const missions = await prisma.mission.findMany({
      where: { 
        status: 'PENDING',
        transporteurId: null,
      },
      orderBy: [
        { isUrgent: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        client: { 
          select: { 
            firstName: true, 
            lastName: true, 
            company: { select: { name: true } } 
          } 
        },
      },
      take: 50,
    });
    
    res.json({ missions });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚛 TRANSPORT TOKEN API - SERVEUR DÉMARRÉ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   🌐 API:     http://localhost:${PORT}`);
  console.log(`   ❤️  Health:  http://localhost:${PORT}/health`);
  console.log('');
  console.log('   📍 Endpoints disponibles:');
  console.log('      POST /api/auth/register    - Inscription');
  console.log('      POST /api/auth/login       - Connexion');
  console.log('      GET  /api/auth/me          - Profil');
  console.log('      POST /api/missions/quote   - Calcul devis');
  console.log('      GET  /api/missions         - Liste missions');
  console.log('      POST /api/missions         - Créer mission');
  console.log('      GET  /api/pricing/vehicles - Véhicules');
  console.log('      GET  /api/pricing/countries- Pays');
  console.log('      GET  /api/admin/stats      - Stats admin');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
});
