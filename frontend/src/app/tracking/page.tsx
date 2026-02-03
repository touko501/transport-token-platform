'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - PAGE TRACKING
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Truck, MapPin, Clock, Package, Phone, Mail, 
  CheckCircle, Circle, ArrowLeft, Navigation,
  Thermometer, AlertCircle, RefreshCw
} from 'lucide-react'

// Données simulées
const MISSION_DATA = {
  id: 'TT-2025-001234',
  status: 'in-transit',
  progress: 65,
  
  // Trajet
  pickup: {
    address: '15 Rue de la Logistique',
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
    contact: 'Jean Martin',
    phone: '+33 1 23 45 67 89',
    dateRequested: '2025-02-15 08:00',
    dateActual: '2025-02-15 08:15',
  },
  delivery: {
    address: '42 Via Roma',
    city: 'Milan',
    postalCode: '20121',
    country: 'IT',
    contact: 'Marco Rossi',
    phone: '+39 02 1234 5678',
    dateRequested: '2025-02-16 14:00',
    eta: '2025-02-16 12:30',
  },
  
  // Véhicule
  vehicle: {
    type: 'Semi Frigo',
    licensePlate: 'AB-123-CD',
    driver: 'Pierre Dupont',
    phone: '+33 6 12 34 56 78',
  },
  
  // Marchandise
  goods: {
    description: 'Produits frais - Fromages italiens',
    weight: 12000,
    packages: 48,
    value: 45000,
    temperature: 4,
    currentTemp: 3.8,
  },
  
  // Prix
  price: {
    total: 3250,
    currency: 'EUR',
  },
  
  // Position actuelle (simulée)
  currentPosition: {
    lat: 45.4642,
    lon: 9.19,
    city: 'Près de Milan',
    lastUpdate: '2025-02-16 10:45',
  },
  
  // Timeline
  timeline: [
    { time: '08:00', date: '15 Fév', event: 'Mission créée', status: 'done', icon: 'create' },
    { time: '08:05', date: '15 Fév', event: 'Acceptée par TRANSTEK', status: 'done', icon: 'accept' },
    { time: '08:15', date: '15 Fév', event: 'Chargement à Paris', status: 'done', icon: 'pickup' },
    { time: '08:30', date: '15 Fév', event: 'Départ entrepôt', status: 'done', icon: 'depart' },
    { time: '12:45', date: '15 Fév', event: 'Passage frontière Suisse', status: 'done', icon: 'border' },
    { time: '18:30', date: '15 Fév', event: 'Pause réglementaire', status: 'done', icon: 'pause' },
    { time: '07:00', date: '16 Fév', event: 'Reprise du trajet', status: 'done', icon: 'resume' },
    { time: '10:45', date: '16 Fév', event: 'Près de Milan', status: 'current', icon: 'transit' },
    { time: '12:30', date: '16 Fév', event: 'Livraison prévue', status: 'pending', icon: 'delivery' },
  ],
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'pending': { label: 'En attente', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  'accepted': { label: 'Acceptée', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  'in-transit': { label: 'En transit', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  'delivered': { label: 'Livrée', color: 'text-green-400', bg: 'bg-green-500/20' },
}

export default function TrackingPage() {
  const [mission] = useState(MISSION_DATA)
  const [progress, setProgress] = useState(mission.progress)
  const [currentTemp, setCurrentTemp] = useState(mission.goods.currentTemp)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // Simulation de mise à jour en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(100, p + Math.random() * 0.5))
      setCurrentTemp(t => 3.5 + Math.random() * 1)
      setLastUpdate(new Date())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const status = STATUS_CONFIG[mission.status]

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Header */}
      <header className="glass-strong border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">Tracking {mission.id}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Bar Global */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🇫🇷</div>
              <div>
                <p className="font-semibold">{mission.pickup.city}</p>
                <p className="text-sm text-gray-400">{mission.pickup.dateActual}</p>
              </div>
            </div>
            
            <div className="flex-1 mx-8">
              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-gradient-to-r from-green-500 via-orange-500 to-orange-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-4 border-orange-500 transition-all duration-1000 flex items-center justify-center"
                  style={{ left: `calc(${progress}% - 12px)` }}
                >
                  <span className="text-xs">🚛</span>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Départ</span>
                <span className="text-orange-400 font-semibold">{Math.round(progress)}%</span>
                <span>Arrivée</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-right">{mission.delivery.city}</p>
                <p className="text-sm text-gray-400">ETA: {mission.delivery.eta.split(' ')[1]}</p>
              </div>
              <div className="text-3xl">🇮🇹</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte simulée */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="relative h-80 bg-gradient-to-br from-slate-800 to-slate-900">
                {/* Simulation de carte */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 60">
                    <path 
                      d="M10,30 Q25,20 40,25 Q55,30 70,20 Q85,10 95,25" 
                      fill="none" 
                      stroke="#f97316" 
                      strokeWidth="0.5"
                      strokeDasharray="2,2"
                    />
                  </svg>
                </div>
                
                {/* Position actuelle */}
                <div 
                  className="absolute flex flex-col items-center"
                  style={{ left: `${progress}%`, top: '40%', transform: 'translateX(-50%)' }}
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-orange-500/50">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <div className="mt-2 px-3 py-1 bg-slate-800 rounded-lg text-xs">
                    {mission.currentPosition.city}
                  </div>
                </div>

                {/* Marqueur départ */}
                <div className="absolute left-[10%] top-[45%]">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Marqueur arrivée */}
                <div className="absolute right-[10%] top-[35%]">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Dernière position: {mission.currentPosition.lastUpdate}</span>
                </div>
                <button className="text-orange-400 text-sm hover:text-orange-300">
                  Voir sur Google Maps →
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Historique du trajet
              </h2>
              
              <div className="relative">
                {/* Ligne verticale */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-700" />
                
                <div className="space-y-6">
                  {mission.timeline.map((event, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                        event.status === 'done' ? 'bg-green-500' :
                        event.status === 'current' ? 'bg-orange-500 animate-pulse' :
                        'bg-gray-700'
                      }`}>
                        {event.status === 'done' ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : event.status === 'current' ? (
                          <Truck className="w-5 h-5 text-white" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${event.status === 'pending' ? 'text-gray-400' : ''}`}>
                            {event.event}
                          </p>
                          <span className="text-sm text-gray-400">{event.date} - {event.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Infos température (si frigo) */}
            <div className="glass rounded-2xl p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-blue-400" />
                  Température
                </h3>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                  Temps réel
                </span>
              </div>
              
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-400">{currentTemp.toFixed(1)}°C</p>
                <p className="text-sm text-gray-400 mt-1">Consigne: {mission.goods.temperature}°C</p>
              </div>
              
              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    Math.abs(currentTemp - mission.goods.temperature) < 1 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: '85%' }}
                />
              </div>
              
              {Math.abs(currentTemp - mission.goods.temperature) < 1 ? (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Température conforme
                </p>
              ) : (
                <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Écart léger détecté
                </p>
              )}
            </div>

            {/* Chauffeur */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-400" />
                Transporteur
              </h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl font-bold">
                  PD
                </div>
                <div>
                  <p className="font-semibold">{mission.vehicle.driver}</p>
                  <p className="text-sm text-gray-400">TRANSTEK</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <span>{mission.vehicle.type}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-center text-gray-400">#</span>
                  <span className="font-mono">{mission.vehicle.licensePlate}</span>
                </div>
                <a 
                  href={`tel:${mission.vehicle.phone}`}
                  className="flex items-center gap-3 text-sm text-orange-400 hover:text-orange-300"
                >
                  <Phone className="w-4 h-4" />
                  <span>{mission.vehicle.phone}</span>
                </a>
              </div>
            </div>

            {/* Marchandise */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />
                Marchandise
              </h3>
              
              <p className="text-sm text-gray-300 mb-4">{mission.goods.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-dark-300 rounded-xl text-center">
                  <p className="text-lg font-bold">{(mission.goods.weight / 1000).toFixed(1)}t</p>
                  <p className="text-xs text-gray-400">Poids</p>
                </div>
                <div className="p-3 bg-dark-300 rounded-xl text-center">
                  <p className="text-lg font-bold">{mission.goods.packages}</p>
                  <p className="text-xs text-gray-400">Colis</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-xs text-gray-400">Valeur déclarée</p>
                <p className="text-lg font-bold text-green-400">
                  {mission.goods.value.toLocaleString('fr-FR')}€
                </p>
              </div>
            </div>

            {/* Contacts */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Contacts</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-dark-300 rounded-xl">
                  <p className="text-xs text-green-400 mb-1">📦 Enlèvement</p>
                  <p className="font-medium">{mission.pickup.contact}</p>
                  <a href={`tel:${mission.pickup.phone}`} className="text-sm text-gray-400 hover:text-orange-400">
                    {mission.pickup.phone}
                  </a>
                </div>
                
                <div className="p-3 bg-dark-300 rounded-xl">
                  <p className="text-xs text-orange-400 mb-1">📍 Livraison</p>
                  <p className="font-medium">{mission.delivery.contact}</p>
                  <a href={`tel:${mission.delivery.phone}`} className="text-sm text-gray-400 hover:text-orange-400">
                    {mission.delivery.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Prix */}
            <div className="glass rounded-2xl p-6 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/30">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prix total TTC</span>
                <span className="text-2xl font-bold text-orange-400">
                  {mission.price.total.toLocaleString('fr-FR')}€
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Paiement sécurisé à la livraison</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
