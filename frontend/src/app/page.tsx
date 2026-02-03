'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - CLIENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { 
  Truck, Package, MapPin, Clock, Euro, TrendingUp, 
  Plus, Search, Bell, User, Menu, X, ChevronRight,
  BarChart3, Zap, Shield, Globe, ArrowRight, Star
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES STATIQUES DEMO
// ═══════════════════════════════════════════════════════════════════════════

const STATS = [
  { label: 'Missions actives', value: '12', icon: Truck, color: 'orange', trend: '+3' },
  { label: 'En livraison', value: '5', icon: Package, color: 'blue', trend: '' },
  { label: 'Complétées ce mois', value: '47', icon: TrendingUp, color: 'green', trend: '+12%' },
  { label: 'Économies CO2', value: '2.4t', icon: Globe, color: 'emerald', trend: '-15%' },
]

const RECENT_MISSIONS = [
  { id: 'TT-2025-001234', from: 'Paris', to: 'Lyon', status: 'in-transit', date: '15 Fév', price: 1214, vehicle: '🚚' },
  { id: 'TT-2025-001235', from: 'Bordeaux', to: 'Madrid', status: 'pending', date: '20 Fév', price: 5418, vehicle: '🚛' },
  { id: 'TT-2025-001236', from: 'Marseille', to: 'Milan', status: 'accepted', date: '18 Fév', price: 3250, vehicle: '❄️' },
  { id: 'TT-2025-001237', from: 'Lille', to: 'Bruxelles', status: 'delivered', date: '10 Fév', price: 890, vehicle: '📦' },
]

const FEATURES = [
  { icon: Zap, title: 'Tarification CNR', desc: 'Prix transparent basé sur le trinôme officiel' },
  { icon: Shield, title: 'Paiement Sécurisé', desc: 'Escrow blockchain pour garantie totale' },
  { icon: Globe, title: '29 Pays Européens', desc: 'Couverture complète UE + Suisse/UK' },
]

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  'pending': { label: 'En attente', class: 'badge-orange' },
  'accepted': { label: 'Acceptée', class: 'badge-blue' },
  'in-transit': { label: 'En transit', class: 'badge-purple bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'delivered': { label: 'Livrée', class: 'badge-green' },
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Transport Token</span>
          </div>
          
          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
            <Link href="/missions" className="btn-ghost">Missions</Link>
            <Link href="/new-mission" className="btn-ghost">Nouvelle Mission</Link>
            <Link href="/tracking" className="btn-ghost">Tracking</Link>
            <Link href="/analytics" className="btn-ghost">Analytics</Link>
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
            </button>
            <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">Jean D.</span>
            </div>
            <button 
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700/50 bg-dark-300/95 backdrop-blur-lg">
          <nav className="px-4 py-4 space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-white/5">Dashboard</Link>
            <Link href="/missions" className="block px-4 py-2 rounded-lg hover:bg-white/5">Missions</Link>
            <Link href="/new-mission" className="block px-4 py-2 rounded-lg hover:bg-white/5">Nouvelle Mission</Link>
            <Link href="/tracking" className="block px-4 py-2 rounded-lg hover:bg-white/5">Tracking</Link>
          </nav>
        </div>
      )}
    </header>
  )
}

function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat, i) => (
        <div 
          key={stat.label} 
          className={`card animate-fade-in`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
              {stat.trend && (
                <span className={`text-xs ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-orange-400'}`}>
                  {stat.trend} ce mois
                </span>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-${stat.color}-500/20`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuickActions() {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/new-mission" className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 hover:border-orange-500/60 transition-all group">
          <Plus className="w-8 h-8 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Nouvelle Mission</span>
        </Link>
        <Link href="/missions" className="flex flex-col items-center p-4 rounded-xl bg-dark-300/50 border border-gray-700 hover:border-gray-600 transition-all group">
          <Search className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Rechercher</span>
        </Link>
        <Link href="/tracking" className="flex flex-col items-center p-4 rounded-xl bg-dark-300/50 border border-gray-700 hover:border-gray-600 transition-all group">
          <MapPin className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Tracking Live</span>
        </Link>
        <Link href="/quote" className="flex flex-col items-center p-4 rounded-xl bg-dark-300/50 border border-gray-700 hover:border-gray-600 transition-all group">
          <Euro className="w-8 h-8 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Devis Express</span>
        </Link>
      </div>
    </div>
  )
}

function RecentMissions() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Missions récentes</h2>
        <Link href="/missions" className="text-orange-400 text-sm hover:text-orange-300 flex items-center">
          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      <div className="space-y-3">
        {RECENT_MISSIONS.map((mission) => (
          <Link 
            key={mission.id}
            href={`/missions/${mission.id}`}
            className="flex items-center justify-between p-4 rounded-xl bg-dark-300/50 hover:bg-dark-300 border border-transparent hover:border-gray-700 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{mission.vehicle}</span>
              <div>
                <p className="font-medium group-hover:text-orange-400 transition-colors">
                  {mission.from} → {mission.to}
                </p>
                <p className="text-sm text-gray-400">{mission.id} • {mission.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`badge ${STATUS_CONFIG[mission.status]?.class || 'badge-gray'}`}>
                {STATUS_CONFIG[mission.status]?.label || mission.status}
              </span>
              <span className="font-semibold text-lg">{mission.price.toLocaleString('fr-FR')}€</span>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <div className="card bg-gradient-to-br from-dark-200 to-dark-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Pourquoi Transport Token ?</h2>
          <p className="text-gray-400 text-sm mt-1">La plateforme transport nouvelle génération</p>
        </div>
        <div className="badge-orange flex items-center space-x-1">
          <Star className="w-3 h-3" />
          <span>4.9/5</span>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="p-4 rounded-xl bg-dark-400/50 border border-gray-700/50">
            <feature.icon className="w-8 h-8 text-orange-400 mb-3" />
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CTABanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-8">
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-white mb-2">Prêt à expédier ?</h2>
        <p className="text-orange-100 mb-6 max-w-md">
          Obtenez un devis instantané basé sur la tarification CNR officielle française.
        </p>
        <Link href="/new-mission" className="inline-flex items-center px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-colors">
          Créer une mission <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
      {/* Decorative elements */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2"></div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Bonjour, <span className="gradient-text">Jean</span> 👋
          </h1>
          <p className="text-gray-400 mt-1">Voici l'état de vos expéditions aujourd'hui</p>
        </div>
        
        {/* Stats */}
        <div className="mb-8">
          <StatsGrid />
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>
        
        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <RecentMissions />
          </div>
          <div>
            <FeaturesSection />
          </div>
        </div>
        
        {/* CTA */}
        <CTABanner />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Transport Token</span>
              <span className="text-gray-500">© 2025</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Powered by TRANSTEK</span>
              <span>•</span>
              <span>Commission 10%</span>
              <span>•</span>
              <span>Blockchain-Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
