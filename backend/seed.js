// ═══════════════════════════════════════════════════════════════════════════
// FRETNOW — SEED v4.0
// ═══════════════════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FRETNOW database v4...');

  // ── ADMIN ──
  const adminHash = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fretnow.fr' },
    update: {},
    create: {
      email: 'admin@fretnow.fr', passwordHash: adminHash,
      firstName: 'Admin', lastName: 'FRETNOW',
      role: 'ADMIN', status: 'ACTIVE', emailVerified: true,
    },
  });
  console.log('  ✅ Admin:', admin.email);

  // ── COMPANY ──
  const company1 = await prisma.company.upsert({
    where: { siret: '12345678900001' },
    update: {},
    create: {
      name: 'TRANSTEK Express', siret: '12345678900001',
      city: 'Créteil', postalCode: '94000', country: 'FR',
      isVerified: true, verifiedAt: new Date(),
    },
  });

  const company2 = await prisma.company.upsert({
    where: { siret: '98765432100001' },
    update: {},
    create: {
      name: 'LogiNord SARL', siret: '98765432100001',
      city: 'Lille', postalCode: '59000', country: 'FR',
      isVerified: true, verifiedAt: new Date(),
    },
  });

  const company3 = await prisma.company.upsert({
    where: { siret: '55566677700001' },
    update: {},
    create: {
      name: 'GreenShip SAS', siret: '55566677700001',
      city: 'Lyon', postalCode: '69001', country: 'FR',
      isVerified: true, verifiedAt: new Date(),
    },
  });

  // ── CLIENTS ──
  const clientHash = await bcrypt.hash('client123456', 12);
  const client1 = await prisma.user.upsert({
    where: { email: 'client@transtek.fr' },
    update: {},
    create: {
      email: 'client@transtek.fr', passwordHash: clientHash,
      firstName: 'Touko', lastName: 'Manager',
      role: 'CLIENT', status: 'ACTIVE', companyId: company1.id,
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'achat@greenlogistic.fr' },
    update: {},
    create: {
      email: 'achat@greenlogistic.fr', passwordHash: clientHash,
      firstName: 'Marie', lastName: 'Dupont',
      role: 'CLIENT', status: 'ACTIVE',
    },
  });
  console.log('  ✅ Clients créés');

  // ── TRANSPORTEURS ──
  const transHash = await bcrypt.hash('trans123456', 12);

  const trans1 = await prisma.user.upsert({
    where: { email: 'transporteur@loginord.fr' },
    update: {},
    create: {
      email: 'transporteur@loginord.fr', passwordHash: transHash,
      firstName: 'Jean', lastName: 'Routier',
      role: 'TRANSPORTEUR', status: 'ACTIVE', companyId: company2.id,
    },
  });

  const trans2 = await prisma.user.upsert({
    where: { email: 'driver@greenship.fr' },
    update: {},
    create: {
      email: 'driver@greenship.fr', passwordHash: transHash,
      firstName: 'Lucas', lastName: 'Vert',
      role: 'TRANSPORTEUR', status: 'ACTIVE', companyId: company3.id,
    },
  });

  // ── TRANSPORTEUR PROFILES ──
  const profile1 = await prisma.transporteurProfile.upsert({
    where: { userId: trans1.id },
    update: { isVerified: true, verifiedAt: new Date(), averageRating: 4.5, ratingCount: 23, totalMissions: 45, completedMissions: 42, baseCity: 'Lille', baseLat: 50.6292, baseLon: 3.0573, hasADR: true, hasGPS: true },
    create: { userId: trans1.id, isVerified: true, verifiedAt: new Date(), averageRating: 4.5, ratingCount: 23, totalMissions: 45, completedMissions: 42, baseCity: 'Lille', baseLat: 50.6292, baseLon: 3.0573, hasADR: true, hasGPS: true, coverageCountries: 'FR,BE,NL,DE' },
  });

  const profile2 = await prisma.transporteurProfile.upsert({
    where: { userId: trans2.id },
    update: { isVerified: true, verifiedAt: new Date(), averageRating: 4.8, ratingCount: 12, totalMissions: 18, completedMissions: 18, baseCity: 'Lyon', baseLat: 45.764, baseLon: 4.8357, hasGPS: true },
    create: { userId: trans2.id, isVerified: true, verifiedAt: new Date(), averageRating: 4.8, ratingCount: 12, totalMissions: 18, completedMissions: 18, baseCity: 'Lyon', baseLat: 45.764, baseLon: 4.8357, hasGPS: true, coverageCountries: 'FR,IT,CH' },
  });
  console.log('  ✅ Transporteurs vérifiés');

  // ── VEHICLES ──
  const vehicles = [
    { transporteurId: profile1.id, type: 'SEMI_TAUTLINER', brand: 'Renault', model: 'T520', year: 2022, licensePlate: 'AB-123-CD', capacityKg: 24000, volumeM3: 90, fuelType: 'diesel_b7', ckPerKm: 1.35, ccPerHour: 42, cjPerDay: 295 },
    { transporteurId: profile1.id, type: 'FOURGON_20M3', brand: 'Mercedes', model: 'Sprinter', year: 2023, licensePlate: 'EF-456-GH', capacityKg: 1800, volumeM3: 20, fuelType: 'diesel_b7', ckPerKm: 0.78, ccPerHour: 28, cjPerDay: 135 },
    { transporteurId: profile2.id, type: 'PORTEUR_ELEC', brand: 'Volvo', model: 'FL Electric', year: 2024, licensePlate: 'IJ-789-KL', capacityKg: 7000, volumeM3: 35, fuelType: 'electric', ckPerKm: 0.90, ccPerHour: 32, cjPerDay: 180 },
    { transporteurId: profile2.id, type: 'VUL_ELECTRIQUE', brand: 'Fiat', model: 'e-Ducato', year: 2024, licensePlate: 'MN-012-OP', capacityKg: 1200, volumeM3: 13, fuelType: 'electric', ckPerKm: 0.55, ccPerHour: 26, cjPerDay: 125 },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { licensePlate: v.licensePlate }, update: v, create: v });
  }
  console.log('  ✅ 4 véhicules créés');

  // ── DEMO MISSIONS ──
  const missions = [
    { clientId: client1.id, reference: 'FN-2026-000001', status: 'BIDDING', pickupCity: 'Paris', pickupAddress: 'Rungis', pickupPostalCode: '94150', pickupCountry: 'FR', pickupLat: 48.7466, pickupLon: 2.3491, deliveryCity: 'Lyon', deliveryAddress: 'Gerland', deliveryPostalCode: '69007', deliveryCountry: 'FR', deliveryLat: 45.7256, deliveryLon: 4.8340, goodsDescription: '33 palettes produits alimentaires', weightKg: 18000, vehicleTypeRequired: 'SEMI_TAUTLINER', distanceKm: 462, estimatedDurationHours: 5.8, priceHT: 158535, priceTTC: 190242, priceTVA: 31707, tvaRate: 20, priceBase: 130000, priceCommission: 14412, co2Estimated: 374.6, co2GlecWTW: 374.6, co2Rating: 'D', co2Methodology: 'GLEC v3', ttScore: 30, biddingDeadline: new Date(Date.now() + 48 * 3600000), isUrgent: true },
    { clientId: client1.id, reference: 'FN-2026-000002', status: 'DELIVERED', pickupCity: 'Marseille', pickupAddress: 'Port', pickupPostalCode: '13002', pickupCountry: 'FR', pickupLat: 43.2965, pickupLon: 5.3698, deliveryCity: 'Bordeaux', deliveryAddress: 'Begles', deliveryPostalCode: '33130', deliveryCountry: 'FR', deliveryLat: 44.8378, deliveryLon: -0.5792, goodsDescription: 'Mobilier bureau', weightKg: 8000, vehicleTypeRequired: 'PORTEUR_12T', distanceKm: 650, estimatedDurationHours: 8.2, priceHT: 125000, priceTTC: 150000, priceTVA: 25000, tvaRate: 20, priceBase: 105000, priceCommission: 11363, co2Estimated: 280, co2GlecWTW: 280, co2Rating: 'C', ttScore: 45, transporteurId: profile1.id, acceptedAt: new Date('2026-02-01'), completedAt: new Date('2026-02-03') },
    { clientId: client2.id, reference: 'FN-2026-000003', status: 'IN_TRANSIT', pickupCity: 'Lyon', pickupAddress: 'Part-Dieu', pickupPostalCode: '69003', pickupCountry: 'FR', pickupLat: 45.764, pickupLon: 4.8357, deliveryCity: 'Milan', deliveryAddress: 'Rho Fiera', deliveryPostalCode: '20017', deliveryCountry: 'IT', deliveryLat: 45.4642, deliveryLon: 9.19, goodsDescription: 'Pièces auto', weightKg: 5000, vehicleTypeRequired: 'VUL_ELECTRIQUE', distanceKm: 640, estimatedDurationHours: 10.5, priceHT: 92000, priceTTC: 112240, priceTVA: 20240, tvaRate: 22, priceBase: 78000, priceCommission: 8363, co2Estimated: 0, co2GlecWTW: 8.5, co2Rating: 'A', ecoOption: 'electric', ttScore: 85, transporteurId: profile2.id, acceptedAt: new Date(), pickupDateActual: new Date() },
  ];

  for (const m of missions) {
    await prisma.mission.upsert({ where: { reference: m.reference }, update: {}, create: m });
  }
  console.log('  ✅ 3 missions démo');

  // ── NOTIFICATIONS ──
  await prisma.notification.createMany({
    data: [
      { userId: client1.id, type: 'WELCOME', title: 'Bienvenue sur FRETNOW !', message: 'Créez votre première mission de transport et recevez des offres en temps réel.' },
      { userId: trans1.id, type: 'WELCOME', title: 'Bienvenue transporteur !', message: 'Votre profil est vérifié. Consultez le marketplace pour enchérir.' },
      { userId: trans1.id, type: 'NEW_BID', title: 'Nouvelle mission disponible', message: 'Paris → Lyon, 18T, URGENT. Enchérissez maintenant.' },
    ],
    skipDuplicates: true,
  });
  console.log('  ✅ Notifications démo');

  console.log('\n🎉 Seed terminé !');
  console.log('   Comptes de test:');
  console.log('   Admin:        admin@fretnow.fr / admin123456');
  console.log('   Client:       client@transtek.fr / client123456');
  console.log('   Transporteur: transporteur@loginord.fr / trans123456');
  console.log('   Transporteur: driver@greenship.fr / trans123456');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
