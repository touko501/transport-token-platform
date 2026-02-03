import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Transport Token Admin',
  description: 'Backoffice de gestion Transport Token',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="font-sans bg-dark-500 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
