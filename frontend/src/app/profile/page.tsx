'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - PAGE PROFIL
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { 
  User, Building, Mail, Phone, MapPin, Shield, CreditCard,
  Bell, Lock, Eye, EyeOff, Camera, Save, ArrowLeft,
  CheckCircle, AlertCircle, Truck, Package, TrendingUp
} from 'lucide-react'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [profile, setProfile] = useState({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@acme.com',
    phone: '+33 6 12 34 56 78',
    company: 'ACME Industries',
    siret: '123 456 789 00012',
    address: '15 Rue de l\'Industrie',
    city: 'Paris',
    postalCode: '75001',
    country: 'FR',
    role: 'CLIENT',
  })

  const [notifications, setNotifications] = useState({
    emailMissions: true,
    emailMarketing: false,
    pushTracking: true,
    pushDelivery: true,
    smsUrgent: true,
  })

  const stats = {
    totalMissions: 47,
    totalSpent: 128450,
    avgRating: 4.8,
    co2Saved: 2.4,
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: User },
    { id: 'company', label: 'Entreprise', icon: Building },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-mesh-gradient">
      {/* Header */}
      <header className="glass-strong border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Mon profil</h1>
                <p className="text-sm text-gray-400">Gérez vos informations personnelles</p>
              </div>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Enregistrer
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <div className="glass rounded-2xl p-6 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-3xl font-bold mx-auto">
                  {profile.firstName[0]}{profile.lastName[0]}
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-dark-200 rounded-full flex items-center justify-center border border-gray-700 hover:border-orange-500 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold mt-4">{profile.firstName} {profile.lastName}</h2>
              <p className="text-gray-400">{profile.company}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                  {profile.role === 'CLIENT' ? 'Client' : 'Transporteur'}
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Vérifié
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                Statistiques
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Missions
                  </span>
                  <span className="font-bold">{stats.totalMissions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Total dépensé
                  </span>
                  <span className="font-bold">{(stats.totalSpent / 1000).toFixed(1)}k€</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">⭐ Note moyenne</span>
                  <span className="font-bold text-yellow-400">{stats.avgRating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">🌱 CO₂ économisé</span>
                  <span className="font-bold text-green-400">{stats.co2Saved}t</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="glass rounded-2xl overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-orange-500/20 text-orange-400 border-l-4 border-orange-500' 
                      : 'text-gray-400 hover:bg-white/5 border-l-4 border-transparent'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="glass rounded-2xl p-8">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6">Informations générales</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Prénom</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                          type="text" 
                          className="input pl-12" 
                          value={profile.firstName}
                          onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                          type="text" 
                          className="input pl-12" 
                          value={profile.lastName}
                          onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="email" 
                        className="input pl-12" 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="tel" 
                        className="input pl-12" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Company Tab */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6">Informations entreprise</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Raison sociale</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input 
                          type="text" 
                          className="input pl-12" 
                          value={profile.company}
                          onChange={(e) => setProfile({...profile, company: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">SIRET</label>
                      <input 
                        type="text" 
                        className="input font-mono" 
                        value={profile.siret}
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Le SIRET ne peut pas être modifié</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Adresse</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input 
                        type="text" 
                        className="input pl-12" 
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Ville</label>
                      <input 
                        type="text" 
                        className="input" 
                        value={profile.city}
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Code postal</label>
                      <input 
                        type="text" 
                        className="input" 
                        value={profile.postalCode}
                        onChange={(e) => setProfile({...profile, postalCode: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Pays</label>
                      <select 
                        className="input"
                        value={profile.country}
                        onChange={(e) => setProfile({...profile, country: e.target.value})}
                      >
                        <option value="FR">🇫🇷 France</option>
                        <option value="BE">🇧🇪 Belgique</option>
                        <option value="DE">🇩🇪 Allemagne</option>
                        <option value="ES">🇪🇸 Espagne</option>
                        <option value="IT">🇮🇹 Italie</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-400">Entreprise vérifiée</p>
                      <p className="text-sm text-gray-400">Votre entreprise a été vérifiée le 15 janvier 2025</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6">Sécurité du compte</h2>
                  
                  <div className="p-6 bg-dark-300 rounded-xl">
                    <h3 className="font-semibold mb-4">Changer le mot de passe</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe actuel</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            className="input pl-12 pr-12" 
                            placeholder="••••••••"
                          />
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Nouveau mot de passe</label>
                        <input type="password" className="input" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirmer le mot de passe</label>
                        <input type="password" className="input" placeholder="••••••••" />
                      </div>
                      <button className="btn-primary">Mettre à jour</button>
                    </div>
                  </div>

                  <div className="p-6 bg-dark-300 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Authentification à deux facteurs</h3>
                        <p className="text-sm text-gray-400">Ajoutez une couche de sécurité supplémentaire</p>
                      </div>
                      <button className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-colors">
                        Activer
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-dark-300 rounded-xl">
                    <h3 className="font-semibold mb-4">Sessions actives</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-dark-400 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💻</span>
                          <div>
                            <p className="font-medium">Chrome - Windows</p>
                            <p className="text-xs text-gray-400">Paris, France • Session actuelle</p>
                          </div>
                        </div>
                        <span className="text-xs text-green-400">Actif</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-dark-400 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <p className="font-medium">Safari - iPhone</p>
                            <p className="text-xs text-gray-400">Paris, France • Il y a 2 jours</p>
                          </div>
                        </div>
                        <button className="text-xs text-red-400 hover:text-red-300">Déconnecter</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6">Préférences de notification</h2>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Mail className="w-5 h-5 text-orange-400" />
                      Email
                    </h3>
                    
                    <label className="flex items-center justify-between p-4 bg-dark-300 rounded-xl cursor-pointer group">
                      <div>
                        <p className="font-medium">Mises à jour des missions</p>
                        <p className="text-sm text-gray-400">Recevez des emails pour chaque changement de statut</p>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={notifications.emailMissions}
                          onChange={(e) => setNotifications({...notifications, emailMissions: e.target.checked})}
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${notifications.emailMissions ? 'bg-orange-500' : 'bg-gray-600'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.emailMissions ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`} />
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-dark-300 rounded-xl cursor-pointer group">
                      <div>
                        <p className="font-medium">Actualités et offres</p>
                        <p className="text-sm text-gray-400">Recevez nos newsletters et promotions</p>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={notifications.emailMarketing}
                          onChange={(e) => setNotifications({...notifications, emailMarketing: e.target.checked})}
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${notifications.emailMarketing ? 'bg-orange-500' : 'bg-gray-600'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.emailMarketing ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`} />
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Bell className="w-5 h-5 text-orange-400" />
                      Push
                    </h3>
                    
                    <label className="flex items-center justify-between p-4 bg-dark-300 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium">Tracking en temps réel</p>
                        <p className="text-sm text-gray-400">Notifications de position du véhicule</p>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={notifications.pushTracking}
                          onChange={(e) => setNotifications({...notifications, pushTracking: e.target.checked})}
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${notifications.pushTracking ? 'bg-orange-500' : 'bg-gray-600'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.pushTracking ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`} />
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-dark-300 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium">Confirmations de livraison</p>
                        <p className="text-sm text-gray-400">Alerte quand une mission est livrée</p>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={notifications.pushDelivery}
                          onChange={(e) => setNotifications({...notifications, pushDelivery: e.target.checked})}
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${notifications.pushDelivery ? 'bg-orange-500' : 'bg-gray-600'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.pushDelivery ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`} />
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Phone className="w-5 h-5 text-orange-400" />
                      SMS
                    </h3>
                    
                    <label className="flex items-center justify-between p-4 bg-dark-300 rounded-xl cursor-pointer">
                      <div>
                        <p className="font-medium">Alertes urgentes</p>
                        <p className="text-sm text-gray-400">SMS pour les problèmes critiques uniquement</p>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only"
                          checked={notifications.smsUrgent}
                          onChange={(e) => setNotifications({...notifications, smsUrgent: e.target.checked})}
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${notifications.smsUrgent ? 'bg-orange-500' : 'bg-gray-600'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.smsUrgent ? 'translate-x-6' : 'translate-x-0.5'} translate-y-0.5`} />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold mb-6">Facturation</h2>
                  
                  <div className="p-6 bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Plan actuel</p>
                        <p className="text-2xl font-bold text-orange-400">Business</p>
                      </div>
                      <button className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors">
                        Upgrade
                      </button>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Missions illimitées
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Commission 10%
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Support prioritaire
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-dark-300 rounded-xl">
                    <h3 className="font-semibold mb-4">Moyen de paiement</h3>
                    <div className="flex items-center justify-between p-4 bg-dark-400 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-xs text-gray-400">Expire 12/26</p>
                        </div>
                      </div>
                      <button className="text-orange-400 text-sm hover:text-orange-300">Modifier</button>
                    </div>
                    <button className="mt-4 text-sm text-gray-400 hover:text-white">
                      + Ajouter une carte
                    </button>
                  </div>

                  <div className="p-6 bg-dark-300 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Dernières factures</h3>
                      <button className="text-orange-400 text-sm hover:text-orange-300">Voir tout</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'INV-2025-001', date: '15 Fév 2025', amount: 2450 },
                        { id: 'INV-2025-002', date: '01 Fév 2025', amount: 3120 },
                        { id: 'INV-2025-003', date: '15 Jan 2025', amount: 1890 },
                      ].map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-dark-400 rounded-lg">
                          <div>
                            <p className="font-medium font-mono text-sm">{invoice.id}</p>
                            <p className="text-xs text-gray-400">{invoice.date}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{invoice.amount.toLocaleString('fr-FR')}€</span>
                            <button className="text-orange-400 text-sm hover:text-orange-300">PDF</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
