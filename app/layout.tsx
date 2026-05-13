import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'

const quicksand = Quicksand({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Natureza Em Flores — Pedidos',
  description: 'Sistema de pedidos e entregas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${quicksand.className} min-h-screen bg-[#F5F5F0]`}>
        {children}
      </body>
    </html>
  )
}
