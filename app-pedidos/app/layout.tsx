import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'Natureza Em Flores — Pedidos',
  description: 'Sistema de pedidos e entregas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F5F5F0]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">
          Natureza Em Flores — Flores para todas as ocasiões, Emoções para toda vida
        </footer>
      </body>
    </html>
  )
}
