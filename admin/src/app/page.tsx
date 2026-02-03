'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - ADMIN DASHBOARD
// Backoffice complet de gestion
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { 
  Truck, Users, Package, Euro, TrendingUp, AlertCircle, CheckCircle,
  Clock, Settings, LogOut, Menu, X, ChevronDown, Search, Bell,
  BarChart3, PieChart, Activity, Shield, FileText, MessageSquare
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES DEMO
// ═══════════════════════════════════════════════════════════════════════════

const STATS = {
  revenue: { value: 847250, trend: '+12.5%', label: 'Chiffre d\'affaires' },
  missions: { value: 1247, trend: '+8.3%', label: 'Missions' },
  users: { value: 3842, trend: '+15.2%', label: 'Utilisateurs' },
  transporteurs: { value: 428, trend: '+5.7%', label: 'Transporteurs' },
}

const RECENT_MISSIONS = [
  { id: 'TT-2025-001234', client: 'ACME Industries', transporteur: 'TRANSTEK', route: 'Paris → Lyon', status: 'in-transit', amount: 1214 },
  { id: 'TT-2025-001235', client: 'LogiCorp', transporteur: '-', route: 'Bordeaux → Madrid', status: 'pending', amount: 5418 },
  { id: 'TT-2025-001236', client: 'FreshFood SAS', transporteur: 'CoolTrans', route: 'Marseille → Milan', status: 'accepted', amount: 3250 },
  { id: 'TT-2025-001237', client: 'TechParts', transporteur: 'ExpressRoute', route: 'Lille → Bruxelles', status: 'delivered', amount: 890 },
  { id: 'TT-2025-001238', client: 'VinExport', transporteur: 'TRANSTEK', route: 'Bordeaux → Londres', status: 'completed', amount: 4580 },
]

const PENDING_VERIFICATIONS = [
  { id: 1, name: 'Transport Dupont', siret: '12345678901234', date: '2025-02-10', docs: 5 },
  { id: 2, name: 'Express Marseille', siret: '98765432109876', date: '2025-02-09', docs: 4 },
  { id: 3, name: 'RouteMax SARL', siret: '11122233344455', date: '2025-02-08', docs: 6 },
]

const DISPUTES = [
  { id: 'D-001', mission: 'TT-2025-001200', reason: 'Retard livraison', amount: 450, status: 'open' },
  { id: 'D-002', mission: 'TT-2025-001180', reason: 'Marchandise endommagée', amount: 1200, status: 'investigating' },
]

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  'pending': { label: 'En attente', class: 'bg-yellow-500/20 text-yellow-400' },
  'accepted': { label: 'Acceptée', class: 'bg-blue-500/20 text-blue-400' },
  'in-transit': { label: 'En transit', class: 'bg-purple-500/20 text-purple-400' },
  'delivered': { label: 'Livrée', class: 'bg-green-500/20 text-green-400' },
  'completed': { label: 'Terminée', class: 'bg-emerald-500/20 text-emerald-400' },
  'open': { label: 'Ouvert', class: 'bg-red-500/20 text-red-400' },
  'investigating': { label: 'En cours', class: 'bg-orange-500/20 text-orange-400' },
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: Package, label: 'Missions', badge: '47' },
    { icon: Users, label: 'Utilisateurs' },
    { icon: Truck, label: 'Transporteurs', badge: '3' },
    { icon: Euro, label: 'Paiements' },
    { icon: MessageSquare, label: 'Litiges', badge: '2' },
    { icon: FileText, label: 'Documents' },
    { icon: Activity, label: 'Analytics' },
    { icon: Settings, label: 'Paramètres' },
  ]
  
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}></div>
      )}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-400 border-r border-gray-800 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold">TT Admin</span>
                <p className="text-xs text-gray-500">Backoffice</p>
              </div>
            </div>
          </div>
          
          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all
                  ${item.active 
                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/20 text-orange-400">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          
          {/* User */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-dark-300">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin System</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function StatsCard({ icon: Icon, label, value, trend, color }: {
  icon: any
  label: string
  value: string | number
  trend: string
  color: string
}) {
  const isPositive = trend.startsWith('+')
  return (
    <div className="bg-dark-300 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-3xl font-bold mt-2">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
            {label.includes('affaires') && '€'}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
      <div className="mt-4 flex items-center space-x-2">
        <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
        <span className="text-gray-500 text-sm">vs mois dernier</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-dark-500 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-dark-400 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-sm text-gray-500">Vue d'ensemble de la plateforme</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-dark-300 rounded-xl border border-gray-700">
                <Search className="w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="bg-transparent border-none outline-none text-sm w-48"
                />
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard icon={Euro} {...STATS.revenue} color="green" />
            <StatsCard icon={Package} {...STATS.missions} color="blue" />
            <StatsCard icon={Users} {...STATS.users} color="purple" />
            <StatsCard icon={Truck} {...STATS.transporteurs} color="orange" />
          </div>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Missions récentes */}
            <div className="lg:col-span-2 bg-dark-300 rounded-2xl border border-gray-800">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold">Missions récentes</h2>
                <button className="text-orange-400 text-sm hover:text-orange-300">Voir tout →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase">
                      <th className="px-6 py-4">Référence</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Transporteur</th>
                      <th className="px-6 py-4">Trajet</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_MISSIONS.map((mission) => (
                      <tr key={mission.id} className="border-t border-gray-800/50 hover:bg-white/5">
                        <td className="px-6 py-4 font-mono text-sm">{mission.id}</td>
                        <td className="px-6 py-4">{mission.client}</td>
                        <td className="px-6 py-4 text-gray-400">{mission.transporteur}</td>
                        <td className="px-6 py-4">{mission.route}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_MAP[mission.status]?.class}`}>
                            {STATUS_MAP[mission.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">{mission.amount.toLocaleString()}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Colonne droite */}
            <div className="space-y-6">
              {/* Vérifications en attente */}
              <div className="bg-dark-300 rounded-2xl border border-gray-800">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center">
                    <Clock className="w-5 h-5 text-orange-400 mr-2" />
                    Vérifications
                  </h2>
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400">
                    {PENDING_VERIFICATIONS.length}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {PENDING_VERIFICATIONS.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-dark-400 border border-gray-700 hover:border-orange-500/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-500">{item.date}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mb-3">{item.siret}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{item.docs} documents</span>
                        <button className="px-3 py-1 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                          Vérifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Litiges */}
              <div className="bg-dark-300 rounded-2xl border border-gray-800">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    Litiges ouverts
                  </h2>
                  <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                    {DISPUTES.length}
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {DISPUTES.map((dispute) => (
                    <div key={dispute.id} className="p-4 rounded-xl bg-dark-400 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{dispute.mission}</span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_MAP[dispute.status]?.class}`}>
                          {STATUS_MAP[dispute.status]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{dispute.reason}</p>
                      <p className="text-lg font-bold text-red-400">{dispute.amount}€</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
