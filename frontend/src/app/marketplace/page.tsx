import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Search, Filter, MapPin, Truck, Clock, Star, Zap, Leaf, Shield, ChevronDown, ChevronUp, ArrowRight, Bell, MessageSquare, TrendingUp, Award, Package, ThermometerSnowflake, AlertTriangle, CheckCircle, XCircle, Eye, Send, DollarSign, BarChart3, Globe, Flame, Battery, Timer, Users, Navigation, FileText, Sparkles, ArrowUpDown, RefreshCw, X, Check, Info, Heart, Bookmark, Share2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// 🧠 TRANSPORT TOKEN — MARKETPLACE v3.0 INTELLIGENTE
// ═══════════════════════════════════════════════════════════════════════════
// Features:
// 1. Smart Matching AI — Score de compatibilité transporteur/mission
// 2. Système d'enchères en temps réel — Bidding live avec countdown
// 3. Calculateur CO2 GLEC/ISO 14083 — Empreinte carbone par mission
// 4. Système de notation — Étoiles + badges + historique
// 5. Notifications temps réel — WebSocket simulation
// 6. Filtres intelligents — Multi-critères dynamiques
// 7. Vue carte/liste toggle — Double affichage
// ═══════════════════════════════════════════════════════════════════════════

// ─── DONNÉES VÉHICULES AVEC FACTEURS GLEC v3 ────────────────────────────
const VEHICLES = {
  VELO_CARGO: { label: "Vélo cargo", icon: "🚲", ck: 0.08, cc: 18, cj: 35, capacityKg: 150, maxRange: 50, category: "urban", fuelType: "electric", glecWTW: 0, euroNorm: "ZÉRO" },
  SCOOTER_ELEC: { label: "Scooter élec.", icon: "🛵", ck: 0.10, cc: 16, cj: 30, capacityKg: 50, maxRange: 80, category: "urban", fuelType: "electric", glecWTW: 0, euroNorm: "ZÉRO" },
  VUL_ELECTRIQUE: { label: "VUL électrique", icon: "🔋", ck: 0.38, cc: 22, cj: 95, capacityKg: 1000, maxRange: 200, category: "light", fuelType: "electric", glecWTW: 24.8, euroNorm: "ZÉRO" },
  FOURGONNETTE: { label: "Fourgonnette", icon: "🚐", ck: 0.52, cc: 24, cj: 95, capacityKg: 800, maxRange: 800, category: "light", fuelType: "diesel", glecWTW: 299, euroNorm: "Euro 6" },
  FOURGON_12M3: { label: "Fourgon 12m³", icon: "🚚", ck: 0.65, cc: 26, cj: 115, capacityKg: 1200, maxRange: 800, category: "medium", fuelType: "diesel", glecWTW: 337, euroNorm: "Euro 6" },
  FOURGON_20M3: { label: "Fourgon 20m³", icon: "🚚", ck: 0.78, cc: 28, cj: 135, capacityKg: 1500, maxRange: 900, category: "medium", fuelType: "diesel", glecWTW: 337, euroNorm: "Euro 6" },
  PORTEUR_7T5: { label: "Porteur 7.5T", icon: "🚛", ck: 0.92, cc: 32, cj: 185, capacityKg: 3500, maxRange: 1000, category: "heavy", fuelType: "diesel", glecWTW: 187, euroNorm: "Euro 6" },
  PORTEUR_12T: { label: "Porteur 12T", icon: "🚛", ck: 1.05, cc: 35, cj: 215, capacityKg: 6000, maxRange: 1000, category: "heavy", fuelType: "diesel", glecWTW: 130, euroNorm: "Euro 6" },
  PORTEUR_19T: { label: "Porteur 19T", icon: "🚛", ck: 1.18, cc: 38, cj: 245, capacityKg: 10000, maxRange: 1200, category: "heavy", fuelType: "diesel", glecWTW: 101, euroNorm: "Euro 6" },
  PORTEUR_ELEC: { label: "Porteur élec.", icon: "⚡", ck: 0.72, cc: 30, cj: 180, capacityKg: 5000, maxRange: 300, category: "heavy", fuelType: "electric", glecWTW: 18.6, euroNorm: "ZÉRO" },
  SEMI_TAUTLINER: { label: "Semi Tautliner", icon: "🚛", ck: 1.35, cc: 42, cj: 295, capacityKg: 25000, maxRange: 2500, category: "semi", fuelType: "diesel", glecWTW: 62, euroNorm: "Euro 6" },
  SEMI_FRIGO: { label: "Semi Frigo", icon: "❄️", ck: 1.75, cc: 48, cj: 365, capacityKg: 22000, maxRange: 2500, category: "semi", fuelType: "diesel", glecWTW: 81, euroNorm: "Euro 6" },
  SEMI_BENNE: { label: "Semi Benne", icon: "🪨", ck: 1.42, cc: 44, cj: 310, capacityKg: 28000, maxRange: 1500, category: "semi", fuelType: "diesel", glecWTW: 62, euroNorm: "Euro 6" },
  SEMI_CITERNE: { label: "Semi Citerne", icon: "🛢️", ck: 1.55, cc: 46, cj: 340, capacityKg: 30000, maxRange: 2000, category: "semi", fuelType: "diesel", glecWTW: 62, euroNorm: "Euro 6" },
  MEGA_TRAILER: { label: "Méga-trailer", icon: "📦", ck: 1.48, cc: 45, cj: 320, capacityKg: 24000, maxRange: 2500, category: "semi", fuelType: "diesel", glecWTW: 55, euroNorm: "Euro 6" },
};

// ─── PAYS EUROPÉENS ─────────────────────────────────────────────────────
const COUNTRIES = {
  FR: { name: "France", flag: "🇫🇷", tva: 20, toll: 0.15 },
  DE: { name: "Allemagne", flag: "🇩🇪", tva: 19, toll: 0.35 },
  BE: { name: "Belgique", flag: "🇧🇪", tva: 21, toll: 0.12 },
  NL: { name: "Pays-Bas", flag: "🇳🇱", tva: 21, toll: 0.00 },
  IT: { name: "Italie", flag: "🇮🇹", tva: 22, toll: 0.12 },
  ES: { name: "Espagne", flag: "🇪🇸", tva: 21, toll: 0.10 },
  LU: { name: "Luxembourg", flag: "🇱🇺", tva: 17, toll: 0.00 },
  PT: { name: "Portugal", flag: "🇵🇹", tva: 23, toll: 0.08 },
  AT: { name: "Autriche", flag: "🇦🇹", tva: 20, toll: 0.30 },
  CH: { name: "Suisse", flag: "🇨🇭", tva: 8.1, toll: 0.25 },
  PL: { name: "Pologne", flag: "🇵🇱", tva: 23, toll: 0.08 },
};

// ─── CALCUL CO2 GLEC / ISO 14083 ───────────────────────────────────────
// Formule: CO2e (kg) = EF_WTW (gCO2e/tkm) × poids (t) × distance (km) × DAF / 1000
// EF_WTW = facteur d'émission Well-to-Wheel du GLEC Framework v3
// DAF = Distance Adjustment Factor (1.05 par défaut selon GLEC)
const calculateCO2_GLEC = (vehicleType, distanceKm, weightKg, fuelOverride = null) => {
  const vehicle = VEHICLES[vehicleType];
  if (!vehicle) return null;
  
  const DAF = 1.05; // GLEC default Distance Adjustment Factor
  const weightTonnes = weightKg / 1000;
  const adjustedDistance = distanceKm * DAF;
  
  // Facteur GLEC WTW en gCO2e/tkm
  let efWTW = vehicle.glecWTW;
  
  // Ajustements carburant alternatif (GLEC Module Fuel Emission Factors)
  if (fuelOverride === "HVO100") efWTW *= 0.10; // -90% selon GLEC v3
  else if (fuelOverride === "B100") efWTW *= 0.35; // -65% biodiesel pur
  else if (fuelOverride === "GNL") efWTW *= 0.80; // -20% GNL vs diesel
  else if (fuelOverride === "electric") efWTW = vehicle.fuelType === "electric" ? efWTW : efWTW * 0.30;
  
  // CO2e en kg
  const co2Kg = (efWTW * weightTonnes * adjustedDistance) / 1000;
  
  // Équivalences parlantes
  const treesNeeded = Math.ceil(co2Kg / 22); // 1 arbre absorbe ~22kg CO2/an
  const kmVoiture = Math.round(co2Kg / 0.12); // ~120g/km voiture moyenne
  
  return {
    co2Kg: Math.round(co2Kg * 10) / 10,
    co2PerKm: Math.round((co2Kg / distanceKm) * 1000) / 1000,
    co2PerTkm: efWTW,
    methodology: "GLEC Framework v3 / ISO 14083",
    scope: "Well-to-Wheel (WTW)",
    daf: DAF,
    treesEquivalent: treesNeeded,
    carKmEquivalent: kmVoiture,
    rating: co2Kg < 50 ? "A+" : co2Kg < 150 ? "A" : co2Kg < 300 ? "B" : co2Kg < 500 ? "C" : "D",
    isZeroEmission: vehicle.fuelType === "electric" && efWTW === 0,
  };
};

// ─── ALGORITHME DE MATCHING INTELLIGENT ────────────────────────────────
// Score de compatibilité transporteur/mission (0-100)
const calculateMatchScore = (carrier, mission) => {
  let score = 0;
  let factors = [];
  
  // 1. Capacité véhicule vs poids mission (25 points)
  const hasCapacity = carrier.vehicles.some(v => VEHICLES[v.type]?.capacityKg >= mission.weightKg);
  if (hasCapacity) { score += 25; factors.push({ label: "Capacité", score: 25, max: 25 }); }
  else { factors.push({ label: "Capacité", score: 0, max: 25 }); }
  
  // 2. Proximité géographique (20 points)
  const distance = Math.abs(carrier.baseLat - mission.pickupLat) + Math.abs(carrier.baseLon - mission.pickupLon);
  const proxScore = Math.max(0, 20 - Math.round(distance * 8));
  score += proxScore;
  factors.push({ label: "Proximité", score: proxScore, max: 20 });
  
  // 3. Note moyenne (15 points)
  const ratingScore = Math.round((carrier.rating / 5) * 15);
  score += ratingScore;
  factors.push({ label: "Réputation", score: ratingScore, max: 15 });
  
  // 4. Spécialisation ADR/Frigo (15 points)
  let specScore = 15;
  if (mission.isADR && !carrier.hasADR) specScore = 0;
  if (mission.needsFrigo && !carrier.hasFrigo) specScore = 0;
  score += specScore;
  factors.push({ label: "Spécialisation", score: specScore, max: 15 });
  
  // 5. Taux de missions complétées (10 points)
  const completionRate = carrier.completedMissions / Math.max(1, carrier.totalMissions);
  const compScore = Math.round(completionRate * 10);
  score += compScore;
  factors.push({ label: "Fiabilité", score: compScore, max: 10 });
  
  // 6. Véhicule éco (10 points)
  const hasEco = carrier.vehicles.some(v => VEHICLES[v.type]?.fuelType === "electric" || v.fuelOverride === "HVO100");
  const ecoScore = hasEco ? 10 : mission.ecoPreferred ? 0 : 5;
  score += ecoScore;
  factors.push({ label: "Éco-score", score: ecoScore, max: 10 });
  
  // 5. Réactivité (5 points)
  const reactScore = carrier.avgResponseMinutes < 15 ? 5 : carrier.avgResponseMinutes < 60 ? 3 : 1;
  score += reactScore;
  factors.push({ label: "Réactivité", score: reactScore, max: 5 });
  
  return { total: Math.min(100, score), factors, tier: score >= 85 ? "gold" : score >= 65 ? "silver" : "bronze" };
};

// ─── CALCUL PRICING CNR ────────────────────────────────────────────────
const calculatePricing = (mission) => {
  const vehicle = VEHICLES[mission.vehicleType];
  if (!vehicle) return null;
  const country = COUNTRIES[mission.deliveryCountry] || COUNTRIES.FR;
  
  const base = vehicle.ck * mission.distanceKm + vehicle.cc * mission.durationHours + vehicle.cj * Math.ceil(mission.durationHours / 8);
  const tolls = country.toll * mission.distanceKm;
  
  let surcharges = 0;
  if (mission.isUrgent) surcharges += base * 0.50;
  if (mission.isWeekend) surcharges += base * 0.35;
  if (mission.isNight) surcharges += base * 0.20;
  if (mission.isADR) surcharges += base * 0.40;
  if (mission.isFragile) surcharges += base * 0.15;
  
  let ecoDiscount = 0;
  if (mission.ecoOption === "HVO") ecoDiscount = base * 0.15;
  if (mission.ecoOption === "electric") ecoDiscount = base * 0.30;
  
  const subtotal = base + tolls + surcharges - ecoDiscount;
  const commission = subtotal * 0.10;
  const ht = subtotal + commission;
  const tva = ht * (country.tva / 100);
  
  return { base: Math.round(base), tolls: Math.round(tolls), surcharges: Math.round(surcharges), ecoDiscount: Math.round(ecoDiscount), commission: Math.round(commission), ht: Math.round(ht), tva: Math.round(tva), ttc: Math.round(ht + tva), tvaRate: country.tva };
};

// ─── DONNÉES DE DÉMONSTRATION ───────────────────────────────────────────
const DEMO_MISSIONS = [
  { id: "M-2026-0847", title: "Palettes électroménager", pickupCity: "Lyon", pickupCountry: "FR", pickupLat: 45.76, pickupLon: 4.83, deliveryCity: "Paris", deliveryCountry: "FR", deliveryLat: 48.86, deliveryLon: 2.35, distanceKm: 465, durationHours: 5.2, weightKg: 8500, vehicleType: "SEMI_TAUTLINER", isUrgent: false, isWeekend: false, isNight: false, isADR: false, isFragile: false, needsFrigo: false, ecoOption: "standard", ecoPreferred: false, goodsDescription: "24 palettes électroménager — Moulinex / SEB", status: "BIDDING", bidsCount: 4, bestBid: 892, createdAt: "2026-02-03T09:15:00Z", deadline: Date.now() + 3 * 3600000, clientName: "SEB Group", clientRating: 4.7 },
  { id: "M-2026-0848", title: "Produits pharmaceutiques", pickupCity: "Strasbourg", pickupCountry: "FR", pickupLat: 48.57, pickupLon: 7.75, deliveryCity: "Munich", deliveryCountry: "DE", deliveryLat: 48.14, deliveryLon: 11.58, distanceKm: 340, durationHours: 4.0, weightKg: 3200, vehicleType: "PORTEUR_7T5", isUrgent: true, isWeekend: false, isNight: false, isADR: true, isFragile: true, needsFrigo: true, ecoOption: "standard", ecoPreferred: false, goodsDescription: "Médicaments thermo-sensibles — Sanofi", status: "BIDDING", bidsCount: 2, bestBid: 1420, createdAt: "2026-02-03T08:30:00Z", deadline: Date.now() + 1.5 * 3600000, clientName: "Sanofi Pasteur", clientRating: 4.9 },
  { id: "M-2026-0849", title: "Matériaux construction", pickupCity: "Marseille", pickupCountry: "FR", pickupLat: 43.30, pickupLon: 5.37, deliveryCity: "Barcelone", deliveryCountry: "ES", deliveryLat: 41.39, deliveryLon: 2.17, distanceKm: 510, durationHours: 5.8, weightKg: 22000, vehicleType: "SEMI_BENNE", isUrgent: false, isWeekend: true, isNight: false, isADR: false, isFragile: false, needsFrigo: false, ecoOption: "HVO", ecoPreferred: true, goodsDescription: "Sable et agrégats — Lafarge-Holcim", status: "BIDDING", bidsCount: 6, bestBid: 1185, createdAt: "2026-02-03T07:00:00Z", deadline: Date.now() + 8 * 3600000, clientName: "Lafarge-Holcim", clientRating: 4.3 },
  { id: "M-2026-0850", title: "Livraison urbaine éco", pickupCity: "Paris 11e", pickupCountry: "FR", pickupLat: 48.86, pickupLon: 2.38, deliveryCity: "Paris 16e", deliveryCountry: "FR", deliveryLat: 48.86, deliveryLon: 2.27, distanceKm: 8, durationHours: 0.5, weightKg: 120, vehicleType: "VELO_CARGO", isUrgent: true, isWeekend: false, isNight: false, isADR: false, isFragile: true, needsFrigo: false, ecoOption: "electric", ecoPreferred: true, goodsDescription: "Colis fragiles e-commerce — Vinted Pro", status: "BIDDING", bidsCount: 8, bestBid: 18, createdAt: "2026-02-03T10:00:00Z", deadline: Date.now() + 0.5 * 3600000, clientName: "Vinted Pro", clientRating: 4.1 },
  { id: "M-2026-0851", title: "Citernes alimentaires", pickupCity: "Bordeaux", pickupCountry: "FR", pickupLat: 44.84, pickupLon: -0.58, deliveryCity: "Bruxelles", deliveryCountry: "BE", deliveryLat: 50.85, deliveryLon: 4.35, distanceKm: 845, durationHours: 9.5, weightKg: 28000, vehicleType: "SEMI_CITERNE", isUrgent: false, isWeekend: false, isNight: true, isADR: false, isFragile: false, needsFrigo: false, ecoOption: "standard", ecoPreferred: false, goodsDescription: "Huile alimentaire vrac — Lesieur", status: "BIDDING", bidsCount: 3, bestBid: 2180, createdAt: "2026-02-03T06:45:00Z", deadline: Date.now() + 12 * 3600000, clientName: "Lesieur", clientRating: 4.5 },
  { id: "M-2026-0852", title: "Frigo express", pickupCity: "Rungis", pickupCountry: "FR", pickupLat: 48.75, pickupLon: 2.35, deliveryCity: "Milan", deliveryCountry: "IT", deliveryLat: 45.46, deliveryLon: 9.19, distanceKm: 850, durationHours: 9.0, weightKg: 18000, vehicleType: "SEMI_FRIGO", isUrgent: true, isWeekend: false, isNight: true, isADR: false, isFragile: true, needsFrigo: true, ecoOption: "standard", ecoPreferred: false, goodsDescription: "Produits frais — Carrefour Supply Chain", status: "BIDDING", bidsCount: 1, bestBid: 3250, createdAt: "2026-02-03T05:00:00Z", deadline: Date.now() + 2 * 3600000, clientName: "Carrefour", clientRating: 4.6 },
];

const DEMO_CARRIERS = [
  { id: "T-001", name: "TRANSTEK Express", baseLat: 48.86, baseLon: 2.35, rating: 4.8, totalMissions: 342, completedMissions: 328, hasADR: true, hasFrigo: false, hasHayon: true, avgResponseMinutes: 8, vehicles: [{ type: "SEMI_TAUTLINER" }, { type: "PORTEUR_19T" }], badges: ["⚡ Top Réactivité", "🏆 Expert Longue Distance"], verified: true },
  { id: "T-002", name: "EcoTransport Green", baseLat: 45.76, baseLon: 4.83, rating: 4.6, totalMissions: 189, completedMissions: 181, hasADR: false, hasFrigo: false, hasHayon: true, avgResponseMinutes: 22, vehicles: [{ type: "VUL_ELECTRIQUE" }, { type: "PORTEUR_ELEC" }, { type: "VELO_CARGO", fuelOverride: "electric" }], badges: ["🌿 Flotte Zéro Émission"], verified: true },
  { id: "T-003", name: "FroidExpress SARL", baseLat: 48.75, baseLon: 2.35, rating: 4.9, totalMissions: 567, completedMissions: 561, hasADR: true, hasFrigo: true, hasHayon: true, avgResponseMinutes: 5, vehicles: [{ type: "SEMI_FRIGO" }, { type: "PORTEUR_7T5" }], badges: ["❄️ Spécialiste Frigo", "⭐ Top 1%", "⚡ Top Réactivité"], verified: true },
  { id: "T-004", name: "Mediterranean Bulk", baseLat: 43.30, baseLon: 5.37, rating: 4.2, totalMissions: 95, completedMissions: 87, hasADR: false, hasFrigo: false, hasHayon: false, avgResponseMinutes: 45, vehicles: [{ type: "SEMI_BENNE" }, { type: "SEMI_CITERNE" }], badges: ["🪨 Expert Vrac"], verified: true },
];

// ─── COMPOSANTS UTILITAIRES ─────────────────────────────────────────────
const Badge = ({ children, variant = "default", size = "sm" }) => {
  const styles = {
    default: "bg-white/5 text-slate-300 border-white/10",
    urgent: "bg-red-500/15 text-red-400 border-red-500/20",
    eco: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    adr: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    frigo: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    gold: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    silver: "bg-slate-400/15 text-slate-300 border-slate-400/30",
    bronze: "bg-orange-700/15 text-orange-400 border-orange-600/30",
    live: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    new: "bg-blue-500/15 text-blue-400 border-blue-400/30",
    verified: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
  };
  const sizes = { xs: "px-1.5 py-0.5 text-[10px]", sm: "px-2 py-0.5 text-xs", md: "px-3 py-1 text-sm" };
  return <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${styles[variant]} ${sizes[size]}`}>{children}</span>;
};

const CountdownTimer = ({ deadline }) => {
  const [remaining, setRemaining] = useState(deadline - Date.now());
  useEffect(() => {
    const interval = setInterval(() => setRemaining(deadline - Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  if (remaining <= 0) return <Badge variant="urgent">Expiré</Badge>;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 3600000;
  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm ${isUrgent ? "text-red-400" : "text-slate-300"}`}>
      <Timer size={14} className={isUrgent ? "animate-pulse" : ""} />
      <span>{String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</span>
    </div>
  );
};

const StarRating = ({ rating, size = 14 }) => {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={i < full ? "fill-amber-400 text-amber-400" : i === full && partial > 0 ? "fill-amber-400/50 text-amber-400" : "text-slate-600"} />
      ))}
      <span className="ml-1 text-sm font-semibold text-slate-200">{rating.toFixed(1)}</span>
    </div>
  );
};

// ─── CARBON SCORE VISUAL ────────────────────────────────────────────────
const CarbonScoreCard = ({ vehicleType, distanceKm, weightKg, ecoOption }) => {
  const fuelMap = { HVO: "HVO100", electric: "electric", standard: null };
  const co2 = calculateCO2_GLEC(vehicleType, distanceKm, weightKg, fuelMap[ecoOption]);
  if (!co2) return null;
  
  const ratingColors = { "A+": "text-emerald-300 bg-emerald-500/20", A: "text-emerald-400 bg-emerald-500/15", B: "text-lime-400 bg-lime-500/15", C: "text-amber-400 bg-amber-500/15", D: "text-red-400 bg-red-500/15" };
  
  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-br from-emerald-950/30 to-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Bilan Carbone GLEC</span>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-sm font-black ${ratingColors[co2.rating]}`}>{co2.rating}</span>
      </div>
      <div className="text-3xl font-black text-white mb-1">{co2.co2Kg} <span className="text-lg font-medium text-slate-400">kg CO₂e</span></div>
      <div className="text-xs text-slate-500 mb-3">{co2.methodology} — {co2.scope}</div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-xs text-slate-500">Par km</div>
          <div className="text-sm font-bold text-slate-200">{co2.co2PerKm} kg</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-xs text-slate-500">🌳 Arbres</div>
          <div className="text-sm font-bold text-slate-200">{co2.treesEquivalent}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-xs text-slate-500">🚗 Équiv.</div>
          <div className="text-sm font-bold text-slate-200">{co2.carKmEquivalent} km</div>
        </div>
      </div>
      {co2.isZeroEmission && (
        <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Battery size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">Mission zéro émission directe</span>
        </div>
      )}
    </div>
  );
};

// ─── MATCH SCORE VISUAL ─────────────────────────────────────────────────
const MatchScoreRing = ({ score, tier, size = 56 }) => {
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;
  const tierColors = { gold: "#fbbf24", silver: "#94a3b8", bronze: "#ea580c" };
  const color = tierColors[tier] || "#6366f1";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size/2} cy={size/2} r={22} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={22} fill="none" stroke={color} strokeWidth={4} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <span className="text-sm font-black" style={{ color }}>{score}</span>
    </div>
  );
};

// ─── CARTE MISSION ──────────────────────────────────────────────────────
const MissionCard = ({ mission, onSelect, isSelected }) => {
  const vehicle = VEHICLES[mission.vehicleType];
  const pricing = calculatePricing(mission);
  const co2 = calculateCO2_GLEC(mission.vehicleType, mission.distanceKm, mission.weightKg);
  const pickupCountry = COUNTRIES[mission.pickupCountry];
  const deliveryCountry = COUNTRIES[mission.deliveryCountry];
  
  return (
    <div 
      onClick={() => onSelect(mission)} 
      className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected 
          ? "border-indigo-500/50 bg-gradient-to-br from-indigo-950/40 to-slate-900/80 shadow-lg shadow-indigo-500/10 scale-[1.01]" 
          : "border-white/5 bg-slate-900/50 hover:border-white/15 hover:bg-slate-900/80"
      }`}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">{mission.id}</span>
          {mission.isUrgent && <Badge variant="urgent" size="xs"><Zap size={10} />URGENT</Badge>}
          {mission.isADR && <Badge variant="adr" size="xs"><AlertTriangle size={10} />ADR</Badge>}
          {mission.needsFrigo && <Badge variant="frigo" size="xs"><ThermometerSnowflake size={10} />FRIGO</Badge>}
          {mission.ecoPreferred && <Badge variant="eco" size="xs"><Leaf size={10} />ÉCO</Badge>}
        </div>
        <CountdownTimer deadline={mission.deadline} />
      </div>
      
      {/* Content */}
      <div className="p-5">
        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-400 bg-emerald-400/20" />
              <span className="text-sm font-semibold text-white">{pickupCountry?.flag} {mission.pickupCity}</span>
            </div>
            <div className="ml-1.5 border-l border-dashed border-white/10 h-4" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-red-400 bg-red-400/20" />
              <span className="text-sm font-semibold text-white">{deliveryCountry?.flag} {mission.deliveryCity}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-white">{mission.distanceKm} <span className="text-sm font-normal text-slate-500">km</span></div>
            <div className="text-xs text-slate-500">{mission.durationHours}h estimées</div>
          </div>
        </div>
        
        {/* Mission info */}
        <div className="text-sm text-slate-300 mb-3">{vehicle?.icon} {vehicle?.label} — {mission.goodsDescription}</div>
        
        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-white/5">
            <Package size={14} className="mx-auto mb-1 text-slate-400" />
            <div className="text-xs font-bold text-white">{(mission.weightKg/1000).toFixed(1)}t</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <Users size={14} className="mx-auto mb-1 text-blue-400" />
            <div className="text-xs font-bold text-white">{mission.bidsCount} offres</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <Leaf size={14} className="mx-auto mb-1 text-emerald-400" />
            <div className="text-xs font-bold text-white">{co2?.co2Kg || "—"} kg</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5">
            <Star size={14} className="mx-auto mb-1 text-amber-400" />
            <div className="text-xs font-bold text-white">{mission.clientRating}</div>
          </div>
        </div>
        
        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Meilleure offre</div>
            <div className="text-xl font-black text-indigo-400">{mission.bestBid?.toLocaleString("fr-FR")} €<span className="text-xs font-normal text-slate-500"> HT</span></div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Prix estimé</div>
            <div className="text-lg font-bold text-slate-300">{pricing?.ht?.toLocaleString("fr-FR")} €<span className="text-xs font-normal text-slate-500"> HT</span></div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20">
            Enchérir →
          </button>
        </div>
        
        {/* Client */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
          <span>Expéditeur : <span className="text-slate-300 font-medium">{mission.clientName}</span></span>
          <span>Publié {new Date(mission.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </div>
  );
};

// ─── PANNEAU DÉTAIL MISSION ─────────────────────────────────────────────
const MissionDetailPanel = ({ mission, carriers, onClose }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [bidAmount, setBidAmount] = useState("");
  const [showBidConfirm, setShowBidConfirm] = useState(false);
  
  if (!mission) return null;
  const vehicle = VEHICLES[mission.vehicleType];
  const pricing = calculatePricing(mission);
  
  // Calcul matching pour chaque transporteur
  const rankedCarriers = carriers.map(c => ({
    ...c,
    match: calculateMatchScore(c, mission),
  })).sort((a, b) => b.match.total - a.match.total);
  
  const tabs = [
    { id: "overview", label: "Détails", icon: <FileText size={14} /> },
    { id: "carbon", label: "CO₂ GLEC", icon: <Leaf size={14} /> },
    { id: "matching", label: "Matching AI", icon: <Sparkles size={14} /> },
    { id: "bids", label: `Enchères (${mission.bidsCount})`, icon: <TrendingUp size={14} /> },
  ];
  
  return (
    <div className="h-full flex flex-col bg-slate-950/95 backdrop-blur-xl border-l border-white/5">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-sm text-slate-400">{mission.id}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"><X size={18} /></button>
        </div>
        <h2 className="text-xl font-black text-white mb-1">{mission.title}</h2>
        <p className="text-sm text-slate-400">{vehicle?.icon} {vehicle?.label} — {mission.goodsDescription}</p>
        
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === t.id ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === "overview" && (
          <>
            {/* Route visual */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-400/20" />
                  <div className="w-0.5 h-16 bg-gradient-to-b from-emerald-400/40 to-red-400/40" />
                  <div className="w-4 h-4 rounded-full border-2 border-red-400 bg-red-400/20" />
                </div>
                <div className="flex-1 space-y-8">
                  <div>
                    <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">Enlèvement</div>
                    <div className="text-white font-bold">{COUNTRIES[mission.pickupCountry]?.flag} {mission.pickupCity}</div>
                  </div>
                  <div>
                    <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">Livraison</div>
                    <div className="text-white font-bold">{COUNTRIES[mission.deliveryCountry]?.flag} {mission.deliveryCity}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-white">{mission.distanceKm}</div>
                  <div className="text-xs text-slate-500">kilomètres</div>
                  <div className="mt-2 text-lg font-bold text-slate-300">{mission.durationHours}h</div>
                  <div className="text-xs text-slate-500">estimées</div>
                </div>
              </div>
            </div>
            
            {/* Pricing breakdown */}
            {pricing && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><DollarSign size={14} className="text-indigo-400" />Décomposition prix CNR</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Base (CK×km + CC×h + CJ×j)</span><span className="text-white font-mono">{pricing.base} €</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Péages</span><span className="text-white font-mono">{pricing.tolls} €</span></div>
                  {pricing.surcharges > 0 && <div className="flex justify-between"><span className="text-amber-400">Majorations</span><span className="text-amber-300 font-mono">+{pricing.surcharges} €</span></div>}
                  {pricing.ecoDiscount > 0 && <div className="flex justify-between"><span className="text-emerald-400">Remise éco</span><span className="text-emerald-300 font-mono">-{pricing.ecoDiscount} €</span></div>}
                  <div className="flex justify-between"><span className="text-indigo-400">Commission TT (10%)</span><span className="text-indigo-300 font-mono">{pricing.commission} €</span></div>
                  <div className="pt-2 border-t border-white/10 flex justify-between font-bold"><span className="text-slate-200">Total HT</span><span className="text-white text-lg">{pricing.ht} €</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">TVA ({pricing.tvaRate}%)</span><span className="text-slate-400">{pricing.tva} €</span></div>
                  <div className="flex justify-between font-black"><span className="text-white">Total TTC</span><span className="text-indigo-400 text-xl">{pricing.ttc} €</span></div>
                </div>
              </div>
            )}

            {/* Badges requirements */}
            <div className="flex flex-wrap gap-2">
              {mission.isUrgent && <Badge variant="urgent" size="md"><Zap size={12} />Urgent +50%</Badge>}
              {mission.isWeekend && <Badge variant="default" size="md">Week-end +35%</Badge>}
              {mission.isNight && <Badge variant="default" size="md">🌙 Nuit +20%</Badge>}
              {mission.isADR && <Badge variant="adr" size="md"><AlertTriangle size={12} />ADR +40%</Badge>}
              {mission.isFragile && <Badge variant="default" size="md">🔶 Fragile +15%</Badge>}
            </div>
          </>
        )}
        
        {activeTab === "carbon" && (
          <>
            <CarbonScoreCard vehicleType={mission.vehicleType} distanceKm={mission.distanceKm} weightKg={mission.weightKg} ecoOption={mission.ecoOption} />
            
            {/* Comparaison alternatives carburant */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-emerald-400" />Alternatives carburant</h3>
              {["standard", "HVO100", "GNL", "electric"].map(fuel => {
                const alt = calculateCO2_GLEC(mission.vehicleType, mission.distanceKm, mission.weightKg, fuel === "standard" ? null : fuel);
                if (!alt) return null;
                const baseline = calculateCO2_GLEC(mission.vehicleType, mission.distanceKm, mission.weightKg);
                const savings = baseline ? Math.round((1 - alt.co2Kg / baseline.co2Kg) * 100) : 0;
                const labels = { standard: "Diesel B7", HVO100: "HVO100 (huile végétale)", GNL: "GNL (gaz naturel)", electric: "Électrique" };
                return (
                  <div key={fuel} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <div className="text-sm text-white font-medium">{labels[fuel]}</div>
                      <div className="text-xs text-slate-500">{alt.co2Kg} kg CO₂e — Note {alt.rating}</div>
                    </div>
                    {savings > 0 ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">-{savings}%</span>
                    ) : (
                      <span className="text-xs text-slate-500">Référence</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-[10px] text-slate-600 leading-relaxed p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <strong className="text-slate-400">Méthodologie :</strong> Calcul conforme au GLEC Framework v3.2 / ISO 14083:2023. 
              Facteurs Well-to-Wheel (WTW) incluant production et combustion du carburant. 
              Distance Adjustment Factor (DAF) = 1.05. 
              Sources : Smart Freight Centre, EcoTransIT World, HBEFA v4.2.
            </div>
          </>
        )}
        
        {activeTab === "matching" && (
          <>
            <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-400" />
              Score de compatibilité calculé sur 7 critères — Algorithme propriétaire Transport Token
            </div>
            {rankedCarriers.map((carrier, i) => (
              <div key={carrier.id} className={`rounded-xl border p-4 transition-all ${i === 0 ? "border-amber-500/30 bg-amber-950/10" : "border-white/5 bg-white/[0.02]"}`}>
                <div className="flex items-start gap-4">
                  <MatchScoreRing score={carrier.match.total} tier={carrier.match.tier} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{carrier.name}</span>
                      {carrier.verified && <Badge variant="verified" size="xs"><Shield size={9} />Vérifié</Badge>}
                      <Badge variant={carrier.match.tier} size="xs">{carrier.match.tier === "gold" ? "🥇" : carrier.match.tier === "silver" ? "🥈" : "🥉"} {carrier.match.tier}</Badge>
                    </div>
                    <StarRating rating={carrier.rating} size={12} />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {carrier.badges.map((b, j) => <span key={j} className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{b}</span>)}
                    </div>
                    {/* Breakdown facteurs */}
                    <div className="mt-3 grid grid-cols-4 gap-1">
                      {carrier.match.factors.slice(0, 4).map((f, j) => (
                        <div key={j} className="text-center">
                          <div className="text-[9px] text-slate-600 uppercase">{f.label}</div>
                          <div className="h-1.5 bg-white/5 rounded-full mt-0.5 overflow-hidden">
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(f.score / f.max) * 100}%` }} />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{f.score}/{f.max}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        
        {activeTab === "bids" && (
          <>
            {/* Bid input */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Send size={14} className="text-indigo-400" />Placer une enchère</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={`Min. ${mission.bestBid ? Math.round(mission.bestBid * 0.9) : pricing?.ht || 500} €`} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-lg font-bold" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">€ HT</span>
                </div>
                <button onClick={() => setShowBidConfirm(true)} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all hover:scale-105 shadow-lg shadow-indigo-500/20">
                  Enchérir
                </button>
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>Prix estimé CNR : {pricing?.ht?.toLocaleString("fr-FR")} € HT</span>
                <span>Meilleure offre actuelle : {mission.bestBid?.toLocaleString("fr-FR")} € HT</span>
              </div>
            </div>
            
            {/* Simulated bids */}
            <div className="space-y-2">
              {[
                { carrier: "FroidExpress SARL", amount: mission.bestBid, time: "il y a 12 min", rating: 4.9, badge: "🥇" },
                { carrier: "TRANSTEK Express", amount: Math.round(mission.bestBid * 1.05), time: "il y a 28 min", rating: 4.8, badge: "🥈" },
                { carrier: "EcoTransport Green", amount: Math.round(mission.bestBid * 1.12), time: "il y a 45 min", rating: 4.6, badge: "🥉" },
                { carrier: "Mediterranean Bulk", amount: Math.round(mission.bestBid * 1.18), time: "il y a 1h", rating: 4.2, badge: "" },
              ].slice(0, mission.bidsCount).map((bid, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${i === 0 ? "border-amber-500/20 bg-amber-950/10" : "border-white/5 bg-white/[0.02]"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{bid.badge || `#${i + 1}`}</span>
                    <div>
                      <div className="text-sm font-bold text-white">{bid.carrier}</div>
                      <div className="text-xs text-slate-500">{bid.time} — ⭐ {bid.rating}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${i === 0 ? "text-amber-400" : "text-white"}`}>{bid.amount?.toLocaleString("fr-FR")} €</div>
                    <div className="text-xs text-slate-500">HT</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS TEMPS RÉEL ───────────────────────────────────────────
const NotificationCenter = ({ notifications }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
        <Bell size={18} className="text-slate-300" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">{notifications.length}</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <h4 className="text-sm font-bold text-white">Notifications</h4>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((n, i) => (
              <div key={i} className="px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                <div className="text-xs text-white font-medium">{n.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{n.message}</div>
                <div className="text-[10px] text-slate-600 mt-1">{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🏪 PAGE PRINCIPALE MARKETPLACE
// ═══════════════════════════════════════════════════════════════════════════
export default function TransportTokenMarketplace() {
  const [missions, setMissions] = useState(DEMO_MISSIONS);
  const [selectedMission, setSelectedMission] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ category: "all", urgent: false, eco: false, adr: false, frigo: false, sort: "newest" });
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState([
    { title: "🔔 Nouvelle enchère", message: "FroidExpress a enchéri sur M-2026-0852", time: "il y a 2 min" },
    { title: "✅ Mission acceptée", message: "M-2026-0845 acceptée par TRANSTEK Express", time: "il y a 15 min" },
    { title: "🚛 En cours", message: "M-2026-0843 — Enlèvement confirmé à Lyon", time: "il y a 32 min" },
  ]);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [statsVisible, setStatsVisible] = useState(true);
  
  // Filtrage missions
  const filteredMissions = useMemo(() => {
    let result = [...missions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.pickupCity.toLowerCase().includes(q) || 
        m.deliveryCity.toLowerCase().includes(q) ||
        m.clientName.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }
    if (filters.urgent) result = result.filter(m => m.isUrgent);
    if (filters.eco) result = result.filter(m => m.ecoPreferred);
    if (filters.adr) result = result.filter(m => m.isADR);
    if (filters.frigo) result = result.filter(m => m.needsFrigo);
    if (filters.category !== "all") result = result.filter(m => VEHICLES[m.vehicleType]?.category === filters.category);
    
    if (filters.sort === "price_asc") result.sort((a, b) => (a.bestBid || 0) - (b.bestBid || 0));
    else if (filters.sort === "price_desc") result.sort((a, b) => (b.bestBid || 0) - (a.bestBid || 0));
    else if (filters.sort === "distance") result.sort((a, b) => a.distanceKm - b.distanceKm);
    else if (filters.sort === "deadline") result.sort((a, b) => a.deadline - b.deadline);
    else result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return result;
  }, [missions, searchQuery, filters]);
  
  // Simulation nouvelle notification temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotifs = [
        { title: "📊 Prix mis à jour", message: `Le gazole est à 1.${Math.round(50 + Math.random() * 30)}€/L`, time: "à l'instant" },
        { title: "🔔 Nouvelle mission", message: `${["Rungis", "Lyon", "Marseille", "Lille"][Math.floor(Math.random()*4)]} → ${["Berlin", "Milan", "Madrid", "Amsterdam"][Math.floor(Math.random()*4)]}`, time: "à l'instant" },
        { title: "⚡ Enchère flash", message: `Nouvelle offre sur M-2026-0${Math.floor(847 + Math.random() * 6)}`, time: "à l'instant" },
      ];
      setNotifications(prev => [newNotifs[Math.floor(Math.random() * newNotifs.length)], ...prev.slice(0, 9)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  
  // Stats live
  const liveStats = useMemo(() => ({
    totalMissions: missions.length,
    totalBids: missions.reduce((s, m) => s + m.bidsCount, 0),
    avgPrice: Math.round(missions.reduce((s, m) => s + (m.bestBid || 0), 0) / missions.length),
    totalCO2: Math.round(missions.reduce((s, m) => {
      const co2 = calculateCO2_GLEC(m.vehicleType, m.distanceKm, m.weightKg);
      return s + (co2?.co2Kg || 0);
    }, 0)),
    ecoMissions: missions.filter(m => m.ecoPreferred).length,
  }), [missions]);
  
  return (
    <div className="min-h-screen bg-[#060B18] text-white" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>
      
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#060B18]/90 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Truck size={16} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tight">Transport<span className="text-indigo-400">Token</span></span>
            </div>
            <div className="hidden md:flex items-center gap-1 ml-6">
              {["Marketplace", "Mes Missions", "Dashboard", "Flotte"].map((item, i) => (
                <button key={item} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${i === 0 ? "bg-indigo-600/20 text-indigo-300" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter notifications={notifications} />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">TK</div>
              <span className="text-sm font-semibold text-slate-200 hidden sm:block">Touko</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats bar */}
      {statsVisible && (
        <div className="border-b border-white/5 bg-white/[0.01]">
          <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500">Live</span>
              <span className="font-bold text-white">{liveStats.totalMissions} missions</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <TrendingUp size={14} className="text-indigo-400" />
              <span className="text-slate-500">{liveStats.totalBids} enchères</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <DollarSign size={14} className="text-amber-400" />
              <span className="text-slate-500">Prix moyen</span>
              <span className="font-bold text-white">{liveStats.avgPrice?.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <Leaf size={14} className="text-emerald-400" />
              <span className="text-slate-500">CO₂ total</span>
              <span className="font-bold text-emerald-300">{liveStats.totalCO2?.toLocaleString("fr-FR")} kg</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <Battery size={14} className="text-emerald-400" />
              <span className="text-slate-500">{liveStats.ecoMissions} missions éco</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Search & Filters */}
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Rechercher par ville, référence, client, marchandise..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:bg-white/[0.07] transition-all" 
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilters ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
            <Filter size={16} />
            <span className="text-sm font-medium hidden sm:block">Filtres</span>
          </button>
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-3 transition-colors ${viewMode === "grid" ? "bg-indigo-600/20 text-indigo-300" : "bg-white/5 text-slate-500"}`}>
              <BarChart3 size={16} />
            </button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-3 transition-colors ${viewMode === "list" ? "bg-indigo-600/20 text-indigo-300" : "bg-white/5 text-slate-500"}`}>
              <FileText size={16} />
            </button>
          </div>
        </div>
        
        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-wrap items-center gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Catégorie</span>
              {[{ value: "all", label: "Toutes" }, { value: "urban", label: "🚲 Urbain" }, { value: "light", label: "🚐 Léger" }, { value: "medium", label: "🚚 Moyen" }, { value: "heavy", label: "🚛 Lourd" }, { value: "semi", label: "🚛 Semi" }].map(c => (
                <button key={c.value} onClick={() => setFilters(f => ({ ...f, category: c.value }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters.category === c.value ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "bg-white/5 text-slate-400 border border-transparent hover:border-white/10"}`}>{c.label}</button>
              ))}
            </div>
            <div className="w-px h-6 bg-white/10" />
            {[{ key: "urgent", label: "⚡ Urgent", variant: "urgent" }, { key: "eco", label: "🌿 Éco", variant: "eco" }, { key: "adr", label: "☢️ ADR", variant: "adr" }, { key: "frigo", label: "❄️ Frigo", variant: "frigo" }].map(f => (
              <button key={f.key} onClick={() => setFilters(prev => ({ ...prev, [f.key]: !prev[f.key] }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filters[f.key] ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "bg-white/5 text-slate-400 border border-transparent hover:border-white/10"}`}>{f.label}</button>
            ))}
            <div className="w-px h-6 bg-white/10" />
            <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none">
              <option value="newest">Plus récentes</option>
              <option value="deadline">Urgence</option>
              <option value="price_asc">Prix ↑</option>
              <option value="price_desc">Prix ↓</option>
              <option value="distance">Distance</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="max-w-[1800px] mx-auto px-6 pb-8">
        <div className={`flex gap-0 ${selectedMission ? "" : ""}`}>
          {/* Mission grid */}
          <div className={`transition-all duration-300 ${selectedMission ? "w-[55%]" : "w-full"}`}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">{filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""} disponible{filteredMissions.length > 1 ? "s" : ""}</span>
              <button onClick={() => setMissions([...missions])} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors">
                <RefreshCw size={12} />Actualiser
              </button>
            </div>
            
            <div className={`grid gap-4 ${selectedMission ? "grid-cols-1" : viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
              {filteredMissions.map(m => (
                <MissionCard key={m.id} mission={m} onSelect={setSelectedMission} isSelected={selectedMission?.id === m.id} />
              ))}
            </div>
            
            {filteredMissions.length === 0 && (
              <div className="text-center py-20">
                <Search size={48} className="mx-auto text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">Aucune mission trouvée</h3>
                <p className="text-sm text-slate-600 mt-1">Modifiez vos filtres ou votre recherche</p>
              </div>
            )}
          </div>
          
          {/* Detail panel */}
          {selectedMission && (
            <div className="w-[45%] sticky top-16 h-[calc(100vh-4rem)] ml-4 rounded-2xl overflow-hidden border border-white/5">
              <MissionDetailPanel mission={selectedMission} carriers={DEMO_CARRIERS} onClose={() => setSelectedMission(null)} />
            </div>
          )}
        </div>
      </div>
      
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </div>
  );
}
