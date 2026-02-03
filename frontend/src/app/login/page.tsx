'use client'

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - LOGIN / REGISTER
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Truck, Mail, Lock, User, Building, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'CLIENT' | 'TRANSPORTEUR'>('CLIENT')
  const [companyName, setCompanyName] = useState('')
  const [siret, setSiret] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin 
        ? { email, password }
        : { email, password, firstName, lastName, role, company: { name: companyName, siret } }
      
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || 'Erreur')
      
      localStorage.setItem('tt-token', data.accessToken)
      localStorage.setItem('tt-user', JSON.stringify(data.user))
      
      if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
        window.location.href = 'http://localhost:3001'
      } else if (data.user.role === 'TRANSPORTEUR') {
        router.push('/transporteur')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-mesh-gradient flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent"></div>
        
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold">Transport Token</span>
        </div>
        
        <div className="relative z-10 space-y-8">
          <h1 className="text-5xl font-bold leading-tight">
            La plateforme de transport
            <span className="gradient-text"> nouvelle génération</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-md">
            Tarification CNR transparente, paiement sécurisé blockchain, 29 pays européens.
          </p>
          
          <div className="space-y-4">
            {['Trinôme CNR officiel', 'Commission 10%', 'Paiement instantané', 'Tracking GPS temps réel'].map((f) => (
              <div key={f} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-orange-400" />
                <span className="text-gray-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 text-sm text-gray-500">© 2025 Transport Token by TRANSTEK</div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl"></div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Transport Token</span>
          </div>
          
          <div className="flex p-1 bg-dark-300 rounded-xl mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 rounded-lg font-medium transition-all ${isLogin ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>Connexion</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 rounded-lg font-medium transition-all ${!isLogin ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>Inscription</button>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">{isLogin ? 'Bon retour !' : 'Créer un compte'}</h2>
          <p className="text-gray-400 mb-8">{isLogin ? 'Connectez-vous à votre espace' : 'Rejoignez la plateforme'}</p>
          
          {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRole('CLIENT')} className={`p-4 rounded-xl border transition-all text-center ${role === 'CLIENT' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700'}`}>
                    <User className={`w-6 h-6 mx-auto mb-2 ${role === 'CLIENT' ? 'text-orange-400' : 'text-gray-500'}`} />
                    <p className="font-medium">Client</p>
                  </button>
                  <button type="button" onClick={() => setRole('TRANSPORTEUR')} className={`p-4 rounded-xl border transition-all text-center ${role === 'TRANSPORTEUR' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700'}`}>
                    <Truck className={`w-6 h-6 mx-auto mb-2 ${role === 'TRANSPORTEUR' ? 'text-orange-400' : 'text-gray-500'}`} />
                    <p className="font-medium">Transporteur</p>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="input-label">Prénom</label><input type="text" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                  <div><label className="input-label">Nom</label><input type="text" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
                </div>
                
                <div><label className="input-label">Entreprise</label><input type="text" className="input" placeholder="ACME Industries" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required /></div>
                <div><label className="input-label">SIRET</label><input type="text" className="input font-mono" placeholder="123 456 789 00012" value={siret} onChange={(e) => setSiret(e.target.value)} required /></div>
              </>
            )}
            
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type="email" className="input pl-12" placeholder="vous@entreprise.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            
            <div>
              <label className="input-label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input type={showPassword ? 'text' : 'password'} className="input pl-12 pr-12" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50">
              {loading ? <div className="loading-spinner"></div> : <><span>{isLogin ? 'Se connecter' : 'Créer mon compte'}</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
