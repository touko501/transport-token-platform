'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - NOUVELLE MISSION
// Calculateur de prix CNR + Formulaire de création
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Truck, ArrowLeft, MapPin, Package, Calendar, Euro, 
  Zap, Moon, AlertTriangle, Leaf, ChevronRight, CheckCircle,
  Clock, Fuel, Scale
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DE RÉFÉRENCE
// ═══════════════════════════════════════════════════════════════════════════

const CITIES = [
  { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { name: 'Lyon', country: 'FR', lat: 45.7640, lon: 4.8357 },
  { name: 'Marseille', country: 'FR', lat: 43.2965, lon: 5.3698 },
  { name: 'Bordeaux', country: 'FR', lat: 44.8378, lon: -0.5792 },
  { name: 'Lille', country: 'FR', lat: 50.6292, lon: 3.0573 },
  { name: 'Toulouse', country: 'FR', lat: 43.6047, lon: 1.4442 },
  { name: 'Nantes', country: 'FR', lat: 47.2184, lon: -1.5536 },
  { name: 'Strasbourg', country: 'FR', lat: 48.5734, lon: 7.7521 },
  { name: 'Berlin', country: 'DE', lat: 52.5200, lon: 13.4050 },
  { name: 'Munich', country: 'DE', lat: 48.1351, lon: 11.5820 },
  { name: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelone', country: 'ES', lat: 41.3851, lon: 2.1734 },
  { name: 'Rome', country: 'IT', lat: 41.9028, lon: 12.4964 },
  { name: 'Milan', country: 'IT', lat: 45.4642, lon: 9.1900 },
  { name: 'Amsterdam', country: 'NL', lat: 52.3676, lon: 4.9041 },
  { name: 'Bruxelles', country: 'BE', lat: 50.8503, lon: 4.3517 },
  { name: 'Londres', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { name: 'Varsovie', country: 'PL', lat: 52.2297, lon: 21.0122 },
]

const VEHICLES = [
  { type: 'FOURGONNETTE', name: 'Fourgonnette 3m³', emoji: '🚐', capacityKg: 800, ck: 0.52, cc: 24, cj: 95, co2: 184 },
  { type: 'FOURGON_12M3', name: 'Fourgon 12m³', emoji: '🚚', capacityKg: 1200, ck: 0.65, cc: 26, cj: 115, co2: 276 },
  { type: 'FOURGON_20M3', name: 'Fourgon 20m³', emoji: '📦', capacityKg: 1500, ck: 0.78, cc: 28, cj: 135, co2: 322 },
  { type: 'PORTEUR_7T5', name: 'Porteur 7.5T', emoji: '🚛', capacityKg: 3500, ck: 0.92, cc: 32, cj: 185, co2: 414 },
  { type: 'PORTEUR_12T', name: 'Porteur 12T', emoji: '🏗️', capacityKg: 6000, ck: 1.05, cc: 35, cj: 215, co2: 506 },
  { type: 'SEMI_TAUTLINER', name: 'Semi Tautliner', emoji: '🚛', capacityKg: 25000, ck: 1.35, cc: 42, cj: 295, co2: 736 },
  { type: 'SEMI_FRIGO', name: 'Semi Frigo', emoji: '❄️', capacityKg: 22000, ck: 1.75, cc: 48, cj: 365, co2: 874 },
  { type: 'ELECTRIQUE_FOURGON', name: 'Électrique', emoji: '⚡', capacityKg: 1000, ck: 0.55, cc: 26, cj: 125, co2: 0 },
]

const COUNTRY_DATA: Record<string, { tva: number; toll: number }> = {
  FR: { tva: 20, toll: 0.15 },
  DE: { tva: 19, toll: 0.35 },
  ES: { tva: 21, toll: 0.10 },
  IT: { tva: 22, toll: 0.12 },
  BE: { tva: 21, toll: 0.12 },
  NL: { tva: 21, toll: 0.00 },
  GB: { tva: 20, toll: 0.05 },
  PL: { tva: 23, toll: 0.08 },
}

// ═══════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ═══════════════════════════════════════════════════════════════════════════

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3)
}

function calculatePrice(params: {
  pickup: typeof CITIES[0] | null
  delivery: typeof CITIES[0] | null
  vehicle: typeof VEHICLES[0] | null
  weight: number
  isUrgent: boolean
  isWeekend: boolean
  isNight: boolean
  isADR: boolean
  ecoOption: string
}) {
  if (!params.pickup || !params.delivery || !params.vehicle) return null
  
  const distance = haversineDistance(params.pickup.lat, params.pickup.lon, params.delivery.lat, params.delivery.lon)
  const avgSpeed = 70
  let hours = distance / avgSpeed
  hours += Math.floor(hours / 4.5) * 0.75 + 2
  const days = Math.ceil(hours / 10)
  
  // Trinôme CNR
  const ck = params.vehicle.ck * distance
  const cc = params.vehicle.cc * hours
  const cj = params.vehicle.cj * days
  let basePrice = ck + cc + cj
  
  // Péages
  const pickupToll = COUNTRY_DATA[params.pickup.country]?.toll || 0.15
  const deliveryToll = COUNTRY_DATA[params.delivery.country]?.toll || 0.15
  const tolls = distance * ((pickupToll + deliveryToll) / 2)
  
  // Majorations
  let surcharges = 0
  if (params.isUrgent) surcharges += basePrice * 0.50
  if (params.isWeekend) surcharges += basePrice * 0.35
  if (params.isNight) surcharges += basePrice * 0.20
  if (params.isADR) surcharges += basePrice * 0.25
  
  // Réduction éco
  let ecoDiscount = 0
  if (params.ecoOption === 'hvo') ecoDiscount = (basePrice + surcharges) * 0.15
  if (params.ecoOption === 'electric') ecoDiscount = (basePrice + surcharges) * 0.30
  
  // Commission 10%
  const priceBeforeCommission = basePrice + tolls + surcharges - ecoDiscount
  const commission = priceBeforeCommission * 0.10
  
  // TVA
  const priceHT = priceBeforeCommission + commission
  const tvaRate = COUNTRY_DATA[params.delivery.country]?.tva || 20
  const tva = priceHT * (tvaRate / 100)
  const priceTTC = priceHT + tva
  
  // CO2
  const co2 = (params.vehicle.co2 * distance) / 1000
  
  // TT Score
  let ttScore = 50
  if (params.ecoOption === 'electric') ttScore += 30
  else if (params.ecoOption === 'hvo') ttScore += 15
  ttScore -= Math.min(20, (co2 / distance) * 30)
  ttScore = Math.max(0, Math.min(100, Math.round(ttScore)))
  
  return {
    distance,
    hours: Math.round(hours * 10) / 10,
    days,
    trinome: { ck: Math.round(ck), cc: Math.round(cc), cj: Math.round(cj), total: Math.round(basePrice) },
    tolls: Math.round(tolls),
    surcharges: Math.round(surcharges),
    ecoDiscount: Math.round(ecoDiscount),
    commission: Math.round(commission),
    priceHT: Math.round(priceHT),
    tvaRate,
    tva: Math.round(tva),
    priceTTC: Math.round(priceTTC),
    pricePerKm: Math.round((priceTTC / distance) * 100) / 100,
    co2: Math.round(co2 * 10) / 10,
    ttScore,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function NewMissionPage() {
  const [step, setStep] = useState(1)
  const [pickup, setPickup] = useState<typeof CITIES[0] | null>(null)
  const [delivery, setDelivery] = useState<typeof CITIES[0] | null>(null)
  const [vehicle, setVehicle] = useState<typeof VEHICLES[0] | null>(null)
  const [weight, setWeight] = useState(1000)
  const [isUrgent, setIsUrgent] = useState(false)
  const [isWeekend, setIsWeekend] = useState(false)
  const [isNight, setIsNight] = useState(false)
  const [isADR, setIsADR] = useState(false)
  const [ecoOption, setEcoOption] = useState('standard')
  
  const price = useMemo(() => calculatePrice({
    pickup, delivery, vehicle, weight, isUrgent, isWeekend, isNight, isADR, ecoOption
  }), [pickup, delivery, vehicle, weight, isUrgent, isWeekend, isNight, isADR, ecoOption])
  
  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Header */}
      <header className="glass-strong border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Nouvelle Mission</span>
            </div>
          </div>
          
          {/* Progress */}
          <div className="hidden sm:flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex items-center ${s < 3 ? 'space-x-2' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                  ${step >= s ? 'bg-orange-500 text-white' : 'bg-dark-300 text-gray-500'}`}>
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 rounded ${step > s ? 'bg-orange-500' : 'bg-dark-300'}`}></div>}
              </div>
            ))}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Trajet */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-orange-400 mr-2" />
                Trajet
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Départ */}
                <div>
                  <label className="input-label">Ville de départ</label>
                  <select 
                    className="input"
                    value={pickup?.name || ''}
                    onChange={(e) => setPickup(CITIES.find(c => c.name === e.target.value) || null)}
                  >
                    <option value="">Sélectionner...</option>
                    {CITIES.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name} ({city.country})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Arrivée */}
                <div>
                  <label className="input-label">Ville d'arrivée</label>
                  <select 
                    className="input"
                    value={delivery?.name || ''}
                    onChange={(e) => setDelivery(CITIES.find(c => c.name === e.target.value) || null)}
                  >
                    <option value="">Sélectionner...</option>
                    {CITIES.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name} ({city.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {pickup && delivery && (
                <div className="mt-4 p-4 rounded-xl bg-dark-300/50 flex items-center justify-between">
                  <span className="text-gray-400">Distance estimée</span>
                  <span className="text-xl font-bold text-orange-400">
                    {haversineDistance(pickup.lat, pickup.lon, delivery.lat, delivery.lon).toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
            
            {/* Step 2: Véhicule */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Truck className="w-6 h-6 text-orange-400 mr-2" />
                Véhicule
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {VEHICLES.map((v) => (
                  <button
                    key={v.type}
                    onClick={() => setVehicle(v)}
                    className={`p-4 rounded-xl border transition-all text-center
                      ${vehicle?.type === v.type 
                        ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30' 
                        : 'border-gray-700 hover:border-gray-600 bg-dark-300/30'
                      }`}
                  >
                    <span className="text-3xl block mb-2">{v.emoji}</span>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.capacityKg.toLocaleString()} kg</p>
                  </button>
                ))}
              </div>
              
              {/* Poids */}
              <div className="mt-6">
                <label className="input-label flex items-center justify-between">
                  <span>Poids de la marchandise</span>
                  <span className="text-orange-400 font-semibold">{weight.toLocaleString()} kg</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max={vehicle?.capacityKg || 25000}
                  step="100"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
            
            {/* Step 3: Options */}
            <div className="card">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Package className="w-6 h-6 text-orange-400 mr-2" />
                Options
              </h2>
              
              {/* Majorations */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`p-4 rounded-xl border transition-all flex items-center space-x-3
                    ${isUrgent ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-dark-300/30'}`}
                >
                  <Zap className={`w-5 h-5 ${isUrgent ? 'text-orange-400' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">Urgent</p>
                    <p className="text-xs text-gray-400">+50%</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setIsWeekend(!isWeekend)}
                  className={`p-4 rounded-xl border transition-all flex items-center space-x-3
                    ${isWeekend ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-dark-300/30'}`}
                >
                  <Calendar className={`w-5 h-5 ${isWeekend ? 'text-blue-400' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">Weekend</p>
                    <p className="text-xs text-gray-400">+35%</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setIsNight(!isNight)}
                  className={`p-4 rounded-xl border transition-all flex items-center space-x-3
                    ${isNight ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-dark-300/30'}`}
                >
                  <Moon className={`w-5 h-5 ${isNight ? 'text-purple-400' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">Nuit</p>
                    <p className="text-xs text-gray-400">+20%</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setIsADR(!isADR)}
                  className={`p-4 rounded-xl border transition-all flex items-center space-x-3
                    ${isADR ? 'border-red-500 bg-red-500/10' : 'border-gray-700 bg-dark-300/30'}`}
                >
                  <AlertTriangle className={`w-5 h-5 ${isADR ? 'text-red-400' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">ADR</p>
                    <p className="text-xs text-gray-400">+25%</p>
                  </div>
                </button>
              </div>
              
              {/* Option Éco */}
              <div>
                <label className="input-label flex items-center">
                  <Leaf className="w-4 h-4 text-green-400 mr-2" />
                  Option Écologique
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'standard', label: 'Standard', discount: '' },
                    { value: 'hvo', label: 'HVO', discount: '-15%' },
                    { value: 'electric', label: 'Électrique', discount: '-30%' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setEcoOption(opt.value)}
                      className={`p-3 rounded-xl border transition-all
                        ${ecoOption === opt.value 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-gray-700 bg-dark-300/30'
                        }`}
                    >
                      <p className="font-medium">{opt.label}</p>
                      {opt.discount && <p className="text-xs text-green-400">{opt.discount}</p>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Récapitulatif Prix */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-xl font-bold mb-6">Récapitulatif</h2>
              
              {price ? (
                <div className="space-y-6">
                  {/* Prix Total */}
                  <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30">
                    <p className="text-gray-400 text-sm mb-1">Prix Total TTC</p>
                    <p className="text-5xl font-bold gradient-text">{price.priceTTC.toLocaleString()}€</p>
                    <p className="text-gray-400 text-sm mt-2">{price.pricePerKm}€/km</p>
                  </div>
                  
                  {/* TT Score */}
                  <div className="p-4 rounded-xl bg-dark-300/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">TT Score Écologique</span>
                      <span className="font-bold text-lg">{price.ttScore}/100</span>
                    </div>
                    <div className="w-full h-3 bg-dark-400 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full transition-all"
                        style={{ width: `${price.ttScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Détails */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Durée estimée
                      </span>
                      <span className="font-medium">{price.hours}h ({price.days}j)</span>
                    </div>
                    
                    <hr className="border-gray-700" />
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trinôme CNR (CK)</span>
                      <span>{price.trinome.ck}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trinôme CNR (CC)</span>
                      <span>{price.trinome.cc}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trinôme CNR (CJ)</span>
                      <span>{price.trinome.cj}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Péages</span>
                      <span>{price.tolls}€</span>
                    </div>
                    
                    {price.surcharges > 0 && (
                      <div className="flex justify-between text-orange-400">
                        <span>Majorations</span>
                        <span>+{price.surcharges}€</span>
                      </div>
                    )}
                    
                    {price.ecoDiscount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Réduction éco</span>
                        <span>-{price.ecoDiscount}€</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Commission (10%)</span>
                      <span>{price.commission}€</span>
                    </div>
                    
                    <hr className="border-gray-700" />
                    
                    <div className="flex justify-between font-medium">
                      <span>Prix HT</span>
                      <span>{price.priceHT}€</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>TVA ({price.tvaRate}%)</span>
                      <span>{price.tva}€</span>
                    </div>
                    
                    <hr className="border-gray-700" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center">
                        <Fuel className="w-4 h-4 mr-2" />
                        CO2 estimé
                      </span>
                      <span className={price.co2 === 0 ? 'text-green-400' : ''}>{price.co2} kg</span>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <button className="btn-primary w-full flex items-center justify-center space-x-2">
                    <span>Créer la mission</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  <p className="text-xs text-center text-gray-500">
                    Paiement sécurisé par escrow blockchain
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Euro className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un trajet et un véhicule pour voir le prix</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
