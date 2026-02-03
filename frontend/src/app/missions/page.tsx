'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Truck, ArrowLeft, Search, Filter, Plus, MapPin, Calendar, Euro, 
  Clock, ChevronRight, Package, AlertCircle, CheckCircle
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
  'DRAFT': { label: 'Brouillon', class: 'bg-gray-500/20 text-gray-400', icon: Package },
  'PENDING': { label: 'En attente', class: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  'ACCEPTED': { label: 'Acceptée', class: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
  'IN_TRANSIT': { label: 'En transit', class: 'bg-purple-500/20 text-purple-400', icon: Truck },
  'DELIVERED': { label: 'Livrée', class: 'bg-green-500/20 text-green-400', icon: MapPin },
  'COMPLETED': { label: 'Terminée', class: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  'CANCELLED': { label: 'Annulée', class: 'bg-red-500/20 text-red-400', icon: AlertCircle },
}

// Données demo
const MISSIONS = [
  { id: 'TT-2025-001234', from: 'Paris', to: 'Lyon', fromCountry: 'FR', toCountry: 'FR', status: 'IN_TRANSIT', date: '15 Fév 2025', price: 1214, weight: 800, vehicle: '🚚', transporteur: 'TRANSTEK EXPRESS', progress: 65 },
  { id: 'TT-2025-001235', from: 'Bordeaux', to: 'Madrid', fromCountry: 'FR', toCountry: 'ES', status: 'PENDING', date: '20 Fév 2025', price: 5418, weight: 18000, vehicle: '🚛', transporteur: null, progress: 0 },
  { id: 'TT-2025-001236', from: 'Marseille', to: 'Milan', fromCountry: 'FR', toCountry: 'IT', status: 'ACCEPTED', date: '18 Fév 2025', price: 3250, weight: 12000, vehicle: '❄️', transporteur: 'CoolTrans Pro', progress: 0 },
  { id: 'TT-2025-001237', from: 'Lille', to: 'Bruxelles', fromCountry: 'FR', toCountry: 'BE', status: 'DELIVERED', date: '10 Fév 2025', price: 890, weight: 500, vehicle: '📦', transporteur: 'BelgExpress', progress: 100 },
  { id: 'TT-2025-001238', from: 'Lyon', to: 'Berlin', fromCountry: 'FR', toCountry: 'DE', status: 'COMPLETED', date: '05 Fév 2025', price: 4580, weight: 15000, vehicle: '🚛', transporteur: 'EuroRoute', progress: 100 },
  { id: 'TT-2025-001239', from: 'Nantes', to: 'Amsterdam', fromCountry: 'FR', toCountry: 'NL', status: 'CANCELLED', date: '01 Fév 2025', price: 2100, weight: 3000, vehicle: '🚚', transporteur: null, progress: 0 },
]

export default function MissionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const filteredMissions = MISSIONS.filter(m => {
    const matchesSearch = m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.to.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Header */}
      <header className="glass-strong border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Mes Missions</h1>
              <p className="text-sm text-gray-400">{filteredMissions.length} missions</p>
            </div>
          </div>
          <Link href="/new-mission" className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nouvelle Mission</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par référence, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-48"
            >
              <option value="ALL">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'En cours', value: MISSIONS.filter(m => ['PENDING', 'ACCEPTED', 'IN_TRANSIT'].includes(m.status)).length, color: 'orange' },
            { label: 'Livrées', value: MISSIONS.filter(m => m.status === 'DELIVERED').length, color: 'green' },
            { label: 'Terminées', value: MISSIONS.filter(m => m.status === 'COMPLETED').length, color: 'blue' },
            { label: 'Total €', value: MISSIONS.reduce((acc, m) => acc + m.price, 0).toLocaleString(), color: 'purple' },
          ].map((stat) => (
            <div key={stat.label} className="card !p-4">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Liste des missions */}
        <div className="space-y-4">
          {filteredMissions.map((mission) => {
            const statusConfig = STATUS_CONFIG[mission.status]
            const StatusIcon = statusConfig?.icon || Package
            
            return (
              <Link
                key={mission.id}
                href={`/missions/${mission.id}`}
                className="card !p-0 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">{mission.vehicle}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm text-gray-400">{mission.id}</span>
                          <span className={`badge ${statusConfig?.class}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig?.label}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mt-1 group-hover:text-orange-400 transition-colors">
                          {mission.from} <span className="text-gray-500">→</span> {mission.to}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {mission.date}
                          {mission.transporteur && (
                            <span className="ml-4">
                              <Truck className="w-4 h-4 inline mr-1" />
                              {mission.transporteur}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold">{mission.price.toLocaleString()}€</p>
                      <p className="text-sm text-gray-400">{mission.weight.toLocaleString()} kg</p>
                    </div>
                  </div>

                  {/* Progress bar pour missions en transit */}
                  {mission.status === 'IN_TRANSIT' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-400">Progression</span>
                        <span className="text-orange-400 font-medium">{mission.progress}%</span>
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                          style={{ width: `${mission.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-dark-300/50 border-t border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {mission.fromCountry} → {mission.toCountry}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>

        {filteredMissions.length === 0 && (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune mission trouvée</h3>
            <p className="text-gray-400 mb-6">Modifiez vos filtres ou créez une nouvelle mission</p>
            <Link href="/new-mission" className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Créer une mission</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
