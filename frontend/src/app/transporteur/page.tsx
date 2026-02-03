'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - TRANSPORTEUR DASHBOARD
// Espace transporteur avec missions disponibles
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { 
  Truck, Package, MapPin, Euro, TrendingUp, Star, Clock,
  CheckCircle, XCircle, Play, Eye, Bell, User, Menu, X,
  Navigation, Fuel, Calendar, ChevronRight, Filter
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DEMO
// ═══════════════════════════════════════════════════════════════════════════

const STATS = [
  { label: 'Missions ce mois', value: 23, icon: Package, color: 'blue', trend: '+5' },
  { label: 'Revenus', value: '12 450€', icon: Euro, color: 'green', trend: '+18%' },
  { label: 'Note moyenne', value: '4.9', icon: Star, color: 'yellow', trend: '' },
  { label: 'Km parcourus', value: '8 420', icon: Navigation, color: 'purple', trend: '' },
]

const AVAILABLE_MISSIONS = [
  { 
    id: 'TT-2025-001250', 
    from: 'Paris', fromCountry: 'FR',
    to: 'Lyon', toCountry: 'FR',
    date: '15 Fév 08:00',
    distance: 465, duration: '6h30',
    weight: 800, vehicle: 'FOURGON_20M3',
    price: 1214, urgent: false
  },
  { 
    id: 'TT-2025-001251', 
    from: 'Bordeaux', fromCountry: 'FR',
    to: 'Madrid', toCountry: 'ES',
    date: '16 Fév 06:00',
    distance: 640, duration: '12h',
    weight: 18000, vehicle: 'SEMI_TAUTLINER',
    price: 5418, urgent: true
  },
  { 
    id: 'TT-2025-001252', 
    from: 'Marseille', fromCountry: 'FR',
    to: 'Milan', toCountry: 'IT',
    date: '17 Fév 07:00',
    distance: 420, duration: '8h',
    weight: 15000, vehicle: 'SEMI_FRIGO',
    price: 3850, urgent: false
  },
  { 
    id: 'TT-2025-001253', 
    from: 'Lille', fromCountry: 'FR',
    to: 'Amsterdam', toCountry: 'NL',
    date: '15 Fév 14:00',
    distance: 280, duration: '4h',
    weight: 1200, vehicle: 'FOURGON_12M3',
    price: 890, urgent: false
  },
]

const MY_MISSIONS = [
  { id: 'TT-2025-001240', route: 'Paris → Bruxelles', status: 'in-transit', eta: '2h30', progress: 65 },
  { id: 'TT-2025-001238', route: 'Lyon → Marseille', status: 'accepted', pickup: '16 Fév 08:00', progress: 0 },
]

const VEHICLES_EMOJI: Record<string, string> = {
  'FOURGON_12M3': '🚚',
  'FOURGON_20M3': '📦',
  'SEMI_TAUTLINER': '🚛',
  'SEMI_FRIGO': '❄️',
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Transport Token</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">Transporteur</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/transporteur" className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400">Dashboard</Link>
            <Link href="/transporteur/missions" className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">Mes Missions</Link>
            <Link href="/transporteur/marketplace" className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">Marketplace</Link>
            <Link href="/transporteur/fleet" className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">Ma Flotte</Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">TRANSTEK</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MissionCard({ mission, onAccept }: { mission: typeof AVAILABLE_MISSIONS[0]; onAccept: () => void }) {
  return (
    <div className="card hover:border-orange-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{VEHICLES_EMOJI[mission.vehicle] || '🚚'}</span>
          <div>
            <p className="font-mono text-sm text-gray-400">{mission.id}</p>
            <p className="text-lg font-bold">
              {mission.from} <span className="text-gray-500">→</span> {mission.to}
            </p>
          </div>
        </div>
        {mission.urgent && (
          <span className="badge-orange flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Urgent</span>
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{mission.date}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Navigation className="w-4 h-4" />
          <span>{mission.distance} km</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{mission.duration}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Package className="w-4 h-4" />
          <span>{mission.weight.toLocaleString()} kg</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
        <div>
          <p className="text-sm text-gray-400">Rémunération nette</p>
          <p className="text-2xl font-bold text-green-400">{mission.price.toLocaleString()}€</p>
          <p className="text-xs text-gray-500">{(mission.price / mission.distance).toFixed(2)}€/km</p>
        </div>
        <div className="flex space-x-2">
          <button className="btn-secondary flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Détails</span>
          </button>
          <button onClick={onAccept} className="btn-primary flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Accepter</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ActiveMissionCard({ mission }: { mission: typeof MY_MISSIONS[0] }) {
  return (
    <div className="p-4 rounded-xl bg-dark-300/50 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm text-gray-400">{mission.id}</span>
        <span className={`badge ${mission.status === 'in-transit' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'badge-blue'}`}>
          {mission.status === 'in-transit' ? 'En transit' : 'Acceptée'}
        </span>
      </div>
      <p className="font-semibold mb-2">{mission.route}</p>
      
      {mission.status === 'in-transit' && (
        <>
          <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${mission.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400">ETA: {mission.eta}</p>
        </>
      )}
      
      {mission.status === 'accepted' && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-400">Enlèvement: {mission.pickup}</p>
          <button className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-1">
            <Play className="w-3 h-3" />
            <span>Démarrer</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function TransporteurDashboard() {
  const [filter, setFilter] = useState('all')
  
  const handleAccept = (missionId: string) => {
    alert(`Mission ${missionId} acceptée ! (Démo)`)
  }
  
  return (
    <div className="min-h-screen bg-mesh-gradient">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Bonjour, <span className="gradient-text">TRANSTEK</span> 🚛
          </h1>
          <p className="text-gray-400 mt-1">Trouvez de nouvelles missions et gérez vos transports</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.trend && <span className="text-xs text-green-400">{stat.trend}</span>}
                </div>
                <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Missions disponibles */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Missions disponibles</h2>
              <div className="flex items-center space-x-2">
                <select 
                  className="input py-2 px-3 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Tous véhicules</option>
                  <option value="FOURGON">Fourgons</option>
                  <option value="SEMI">Semi-remorques</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              {AVAILABLE_MISSIONS.map((mission) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission}
                  onAccept={() => handleAccept(mission.id)}
                />
              ))}
            </div>
            
            <button className="w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all">
              Voir plus de missions
            </button>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Missions actives */}
            <div className="card">
              <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
                Missions en cours
                <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full">{MY_MISSIONS.length}</span>
              </h2>
              <div className="space-y-3">
                {MY_MISSIONS.map((mission) => (
                  <ActiveMissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
              <h3 className="font-bold mb-4">Objectif du mois</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Missions</span>
                    <span>23/30</span>
                  </div>
                  <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '77%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Revenus</span>
                    <span>12 450€ / 15 000€</span>
                  </div>
                  <div className="w-full h-2 bg-dark-400 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '83%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ma Flotte */}
            <div className="card">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                Ma Flotte
                <Link href="/transporteur/fleet" className="text-orange-400 text-sm">Gérer →</Link>
              </h3>
              <div className="space-y-2">
                {[
                  { plate: 'AB-123-CD', type: 'Fourgon 20m³', status: 'active' },
                  { plate: 'EF-456-GH', type: 'Semi Tautliner', status: 'active' },
                  { plate: 'IJ-789-KL', type: 'Semi Frigo', status: 'maintenance' },
                ].map((v) => (
                  <div key={v.plate} className="flex items-center justify-between p-3 rounded-lg bg-dark-300/50">
                    <div>
                      <p className="font-mono text-sm">{v.plate}</p>
                      <p className="text-xs text-gray-400">{v.type}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${v.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
