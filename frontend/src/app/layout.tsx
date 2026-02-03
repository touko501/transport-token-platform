// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - ROOT LAYOUT
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from 'react-hot-toast'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Transport Token | Plateforme Transport Européen',
  description: 'La première plateforme de transport routier avec blockchain, tarification CNR transparente et paiement instantané.',
  keywords: ['transport', 'logistique', 'fret', 'blockchain', 'europe'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="font-sans bg-dark-500 text-white min-h-screen">
        <Providers>
          <Navigation />
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(249, 115, 22, 0.3)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
