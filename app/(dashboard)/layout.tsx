import Navbar from '@/components/ui/Navbar'
import { ToastProvider } from '@/components/ui/Toast'

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToastProvider>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-xs text-gray-400 py-6 space-y-1">
        <p>Natureza Em Flores — Flores para todas as ocasiões, Emoções para toda vida</p>
        <p>Desenvolvido por Pedro Borela</p>
      </footer>
    </ToastProvider>
  )
}
