'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - NAVIGATION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Truck, Home, Package, PlusCircle, Map, User, 
  LogOut, Menu, X, Bell, ChevronDown
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const CLIENT_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/missions', label: 'Mes missions', icon: Package },
  { href: '/new-mission', label: 'Nouvelle mission', icon: PlusCircle },
  { href: '/tracking', label: 'Tracking', icon: Map },
]

const TRANSPORTEUR_NAV: NavItem[] = [
  { href: '/transporteur', label: 'Dashboard', icon: Home },
  { href: '/transporteur/missions', label: 'Mes missions', icon: Package },
  { href: '/transporteur/available', label: 'Marketplace', icon: Map },
]

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState(3)
  
  useEffect(() => {
    // Récupérer l'utilisateur depuis localStorage
    const storedUser = localStorage.getItem('tt-user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('tt-token')
    localStorage.removeItem('tt-user')
    window.location.href = '/login'
  }

  // Ne pas afficher la nav sur la page login
  if (pathname === '/login') return null

  const navItems = user?.role === 'TRANSPORTEUR' ? TRANSPORTEUR_NAV : CLIENT_NAV

  return (
    <header className="glass-strong border-b border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold hidden sm:block">
              Transport <span className="text-orange-400">Token</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-sm font-bold">
                  {user?.firstName?.[0] || 'U'}{user?.lastName?.[0] || ''}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {user?.firstName || 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.role === 'TRANSPORTEUR' ? 'Transporteur' : 'Client'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-xl border border-gray-700/50 shadow-xl py-2">
                  <div className="px-4 py-2 border-b border-gray-700/50">
                    <p className="text-sm font-medium">{user?.email}</p>
                    <p className="text-xs text-gray-400">{user?.company?.name}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-700/50">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
