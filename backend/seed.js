const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Admin
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const adminCompany = await prisma.company.upsert({
    where: { siret: '12345678901234' },
    update: {},
    create: {
      name: 'Transport Token SAS',
      siret: '12345678901234',
      legalForm: 'SAS',
      address: '1 Rue de la Plateforme',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      capitalSocial: 100000,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@transport-token.com' },
    update: {},
    create: {
      email: 'admin@transport-token.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      kycVerified: true,
      companyId: adminCompany.id,
    },
  });
  console.log('✅ Admin: admin@transport-token.com / Admin123!');

  // Client
  const clientPassword = await bcrypt.hash('Client123!', 12);
  const clientCompany = await prisma.company.upsert({
    where: { siret: '98765432109876' },
    update: {},
    create: {
      name: 'ACME Industries',
      siret: '98765432109876',
      legalForm: 'SAS',
      address: '100 Avenue Industrie',
      city: 'Lyon',
      postalCode: '69001',
      country: 'FR',
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@demo.com' },
    update: {},
    create: {
      email: 'client@demo.com',
      passwordHash: clientPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33612345678',
      role: 'CLIENT',
      status: 'ACTIVE',
      emailVerified: true,
      companyId: clientCompany.id,
    },
  });
  console.log('✅ Client: client@demo.com / Client123!');

  // Transporteur
  const transporteurPassword = await bcrypt.hash('Transport123!', 12);
  const transporteurCompany = await prisma.company.upsert({
    where: { siret: '11223344556677' },
    update: {},
    create: {
      name: 'TRANSTEK EXPRESS',
      siret: '11223344556677',
      legalForm: 'SARL',
      address: '50 Zone Industrielle',
      city: 'Marseille',
      postalCode: '13001',
      country: 'FR',
      capitalSocial: 50000,
    },
  });

  const transporteurUser = await prisma.user.upsert({
    where: { email: 'transporteur@demo.com' },
    update: {},
    create: {
      email: 'transporteur@demo.com',
      passwordHash: transporteurPassword,
      firstName: 'Pierre',
      lastName: 'Martin',
      phone: '+33698765432',
      role: 'TRANSPORTEUR',
      status: 'ACTIVE',
      emailVerified: true,
      kycVerified: true,
      companyId: transporteurCompany.id,
    },
  });

  const transporteurProfile = await prisma.transporteurProfile.upsert({
    where: { userId: transporteurUser.id },
    update: {},
    create: {
      userId: transporteurUser.id,
      licenceNumber: 'LIC-2024-001234',
      licenceExpiry: new Date('2027-12-31'),
      isVerified: true,
      verifiedAt: new Date(),
      coverageCountries: JSON.stringify(['FR', 'BE', 'DE', 'ES', 'IT']),
      coverageRadius: 2000,
      hasADR: true,
      hasFrigo: true,
      hasHayon: true,
    },
  });
  console.log('✅ Transporteur: transporteur@demo.com / Transport123!');

  // Véhicules
  try {
    await prisma.vehicle.create({
      data: {
        transporteurId: transporteurProfile.id,
        type: 'FOURGON_20M3',
        brand: 'Mercedes',
        model: 'Sprinter',
        year: 2023,
        licensePlate: 'AB-123-CD',
        capacityKg: 1500,
        volumeM3: 20,
        hasTailLift: true,
        hasTracker: true,
        euroNorm: 'Euro 6',
        fuelType: 'diesel',
        ckPerKm: 0.78,
        ccPerHour: 28,
        cjPerDay: 135,
      },
    });
  } catch (e) { /* already exists */ }

  try {
    await prisma.vehicle.create({
      data: {
        transporteurId: transporteurProfile.id,
        type: 'SEMI_TAUTLINER',
        brand: 'Volvo',
        model: 'FH16',
        year: 2022,
        licensePlate: 'EF-456-GH',
        capacityKg: 25000,
        volumeM3: 90,
        hasTailLift: false,
        hasTracker: true,
        euroNorm: 'Euro 6',
        fuelType: 'diesel',
        ckPerKm: 1.35,
        ccPerHour: 42,
        cjPerDay: 295,
      },
    });
  } catch (e) { /* already exists */ }
  console.log('✅ 2 véhicules ajoutés');

  // Mission de demo
  try {
    await prisma.mission.create({
      data: {
        reference: 'TT-2025-000001',
        clientId: clientUser.id,
        status: 'PENDING',
        pickupAddress: '15 Rue de la Paix',
        pickupCity: 'Paris',
        pickupPostalCode: '75002',
        pickupCountry: 'FR',
        pickupLat: 48.8698,
        pickupLon: 2.3311,
        deliveryAddress: '100 Cours Lafayette',
        deliveryCity: 'Lyon',
        deliveryPostalCode: '69003',
        deliveryCountry: 'FR',
        deliveryLat: 45.7640,
        deliveryLon: 4.8357,
        goodsDescription: 'Pièces détachées automobiles',
        weightKg: 800,
        volumeM3: 5,
        packagesCount: 12,
        vehicleTypeRequired: 'FOURGON_20M3',
        distanceKm: 465,
        estimatedDurationHours: 6.5,
        priceBase: 85000,
        priceTolls: 7000,
        priceCommission: 9200,
        priceHT: 101200,
        priceTVA: 20240,
        priceTTC: 121440,
        tvaRate: 20,
        ttScore: 72,
      },
    });
  } catch (e) { /* already exists */ }
  console.log('✅ Mission de test créée');

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
