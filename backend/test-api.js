#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - TESTS API COMPLETS
// ═══════════════════════════════════════════════════════════════════════════

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 4000;

// Couleurs console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, ...args) {
  console.log(colors[color] || '', ...args, colors.reset);
}

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('');
  log('blue', '═══════════════════════════════════════════════════════════════');
  log('blue', '   🧪 TRANSPORT TOKEN - TESTS API COMPLETS');
  log('blue', '═══════════════════════════════════════════════════════════════');
  console.log('');
  
  let token = null;
  let missionId = null;
  let passed = 0;
  let failed = 0;
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: Health Check
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 1: Health Check');
  try {
    const res = await makeRequest('GET', '/health');
    if (res.status === 200 && res.data.status === 'ok') {
      log('green', '  ✓ Health Check OK');
      passed++;
    } else {
      log('red', '  ✗ Health Check Failed');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: Login Client
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 2: Login Client');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'client@demo.com',
      password: 'Client123!'
    });
    if (res.status === 200 && res.data.accessToken) {
      token = res.data.accessToken;
      log('green', '  ✓ Login successful');
      log('green', `  ✓ User: ${res.data.user.email} (${res.data.user.role})`);
      passed++;
    } else {
      log('red', '  ✗ Login Failed:', res.data);
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: Get Current User
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 3: Get Current User (with token)');
  try {
    const res = await makeRequest('GET', '/api/auth/me', null, token);
    if (res.status === 200 && res.data.user) {
      log('green', `  ✓ User: ${res.data.user.firstName} ${res.data.user.lastName}`);
      log('green', `  ✓ Company: ${res.data.user.company?.name || 'N/A'}`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get user');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: Get Vehicles
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 4: Get Vehicles');
  try {
    const res = await makeRequest('GET', '/api/pricing/vehicles');
    if (res.status === 200 && res.data.vehicles) {
      const vehicleCount = Object.keys(res.data.vehicles).length;
      log('green', `  ✓ ${vehicleCount} vehicle types available`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get vehicles');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: Get Countries
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 5: Get Countries');
  try {
    const res = await makeRequest('GET', '/api/pricing/countries');
    if (res.status === 200 && res.data.countries) {
      const countryCount = Object.keys(res.data.countries).length;
      log('green', `  ✓ ${countryCount} countries available`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get countries');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: Calculate Quote
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 6: Calculate Quote (Paris → Milan)');
  try {
    const res = await makeRequest('POST', '/api/missions/quote', {
      pickupLat: 48.8566,
      pickupLon: 2.3522,
      pickupCountry: 'FR',
      deliveryLat: 45.4642,
      deliveryLon: 9.1900,
      deliveryCountry: 'IT',
      vehicleType: 'SEMI_FRIGO',
      isUrgent: false,
      ecoOption: 'standard'
    });
    if (res.status === 200 && res.data.quote) {
      const p = res.data.quote;
      log('green', `  ✓ Distance: ${p.distanceKm} km`);
      log('green', `  ✓ Duration: ${p.estimatedHours}h`);
      log('green', `  ✓ Price HT: ${(p.priceHT / 100).toFixed(2)}€`);
      log('green', `  ✓ Price TTC: ${(p.priceTTC / 100).toFixed(2)}€`);
      log('green', `  ✓ Commission: ${(p.commission / 100).toFixed(2)}€`);
      log('green', `  ✓ TT Score: ${p.ttScore}/100`);
      passed++;
    } else {
      log('red', '  ✗ Failed to calculate quote');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: Create Mission
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 7: Create Mission');
  try {
    const res = await makeRequest('POST', '/api/missions', {
      pickupAddress: '15 Rue de la Paix',
      pickupCity: 'Paris',
      pickupPostalCode: '75002',
      pickupCountry: 'FR',
      deliveryAddress: '42 Via Montenapoleone',
      deliveryCity: 'Milan',
      deliveryPostalCode: '20121',
      deliveryCountry: 'IT',
      vehicleTypeRequired: 'SEMI_FRIGO',
      weightKg: 12000,
      goodsDescription: 'Fromages français premium'
    }, token);
    if (res.status === 201 && res.data.mission) {
      missionId = res.data.mission.id;
      log('green', `  ✓ Mission created: ${res.data.mission.reference}`);
      log('green', `  ✓ Price: ${(res.data.mission.priceTTC / 100).toFixed(2)}€`);
      passed++;
    } else {
      log('red', '  ✗ Failed to create mission:', res.data);
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: Get Missions
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 8: Get Missions');
  try {
    const res = await makeRequest('GET', '/api/missions', null, token);
    if (res.status === 200 && res.data.missions) {
      log('green', `  ✓ ${res.data.missions.length} missions found`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get missions');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 9: Login Transporteur
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 9: Login Transporteur');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'transporteur@demo.com',
      password: 'Transport123!'
    });
    if (res.status === 200 && res.data.accessToken) {
      token = res.data.accessToken;
      log('green', `  ✓ Transporteur logged in: ${res.data.user.email}`);
      passed++;
    } else {
      log('red', '  ✗ Transporteur login failed');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 10: Transporteur Stats
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 10: Transporteur Stats');
  try {
    const res = await makeRequest('GET', '/api/transporteur/stats', null, token);
    if (res.status === 200 && res.data.stats) {
      const s = res.data.stats;
      log('green', `  ✓ Total Missions: ${s.totalMissions}`);
      log('green', `  ✓ Completed: ${s.completedMissions}`);
      log('green', `  ✓ Vehicles: ${s.vehiclesCount}`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get stats');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 11: Available Missions
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 11: Available Missions (Marketplace)');
  try {
    const res = await makeRequest('GET', '/api/transporteur/available', null, token);
    if (res.status === 200 && res.data.missions) {
      log('green', `  ✓ ${res.data.missions.length} missions available`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get available missions');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 12: Login Admin
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 12: Login Admin');
  try {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@transport-token.com',
      password: 'Admin123!'
    });
    if (res.status === 200 && res.data.accessToken) {
      token = res.data.accessToken;
      log('green', `  ✓ Admin logged in: ${res.data.user.role}`);
      passed++;
    } else {
      log('red', '  ✗ Admin login failed');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 13: Admin Stats
  // ─────────────────────────────────────────────────────────────────────────
  log('yellow', '▶ Test 13: Admin Stats');
  try {
    const res = await makeRequest('GET', '/api/admin/stats', null, token);
    if (res.status === 200 && res.data.stats) {
      const s = res.data.stats;
      log('green', `  ✓ Users: ${s.usersCount}`);
      log('green', `  ✓ Missions: ${s.missionsCount}`);
      log('green', `  ✓ Transporteurs: ${s.transporteursCount}`);
      log('green', `  ✓ Total Revenue: ${s.totalRevenue.toFixed(2)}€`);
      passed++;
    } else {
      log('red', '  ✗ Failed to get admin stats');
      failed++;
    }
  } catch (e) {
    log('red', '  ✗ Error:', e.message);
    failed++;
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────────────────────────
  // Test 14: Tracking
  // ─────────────────────────────────────────────────────────────────────────
  if (missionId) {
    log('yellow', '▶ Test 14: Tracking Mission');
    try {
      const res = await makeRequest('GET', `/api/tracking/${missionId}`);
      if (res.status === 200 && res.data.tracking) {
        const t = res.data.tracking;
        log('green', `  ✓ Reference: ${t.reference}`);
        log('green', `  ✓ Status: ${t.status}`);
        log('green', `  ✓ Progress: ${t.progress}%`);
        passed++;
      } else {
        log('red', '  ✗ Failed to track mission');
        failed++;
      }
    } catch (e) {
      log('red', '  ✗ Error:', e.message);
      failed++;
    }
    console.log('');
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('');
  log('blue', '═══════════════════════════════════════════════════════════════');
  log('blue', '   📊 RÉSULTATS');
  log('blue', '═══════════════════════════════════════════════════════════════');
  console.log('');
  log('green', `   ✓ Tests passés: ${passed}`);
  if (failed > 0) {
    log('red', `   ✗ Tests échoués: ${failed}`);
  }
  console.log('');
  
  if (failed === 0) {
    log('green', '   🎉 TOUS LES TESTS SONT PASSÉS !');
  } else {
    log('yellow', `   ⚠️  ${failed} test(s) échoué(s)`);
  }
  console.log('');
  log('blue', '═══════════════════════════════════════════════════════════════');
  console.log('');
}

// Charger le serveur et lancer les tests
console.log('🚀 Démarrage du serveur...');
require('./server.js');

setTimeout(() => {
  runTests().then(() => {
    setTimeout(() => process.exit(0), 1000);
  }).catch(console.error);
}, 2000);
