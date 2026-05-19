'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VisaoGeral from '@/components/analytics/VisaoGeral'
import ClientesInsights from '@/components/analytics/ClientesInsights'
import PedidosInsights from '@/components/analytics/PedidosInsights'
import VendedoresInsights from '@/components/analytics/VendedoresInsights'

type Aba = 'geral' | 'clientes' | 'pedidos' | 'vendedores'

const LABEL_DIAS: Record<number, string> = { 7: 'Semana', 30: 'Mês', 90: 'Trimestre' }

const ABAS: { value: Aba; label: string }[] = [
  { value: 'geral', label: 'Visão Geral' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'pedidos', label: 'Pedidos' },
  { value: 'vendedores', label: 'Vendedores' },
]

export default function AnalyticsPage() {
  const [dias, setDias] = useState(30)
  const [aba, setAba] = useState<Aba>('geral')
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/analytics-auth', { method: 'DELETE' })
    router.push('/analytics/login')
    router.refresh()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Análise de Desempenho</h1>
          <p className="text-slate-500 font-medium mt-1">Acompanhe o crescimento da sua floricultura</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200"
          >
            Sair
          </button>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  dias === d ? 'bg-white shadow-sm text-green-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {LABEL_DIAS[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-8">
        {ABAS.map((a) => (
          <button
            key={a.value}
            onClick={() => setAba(a.value)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
              aba === a.value ? 'bg-white shadow-sm text-green-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'geral' && <VisaoGeral dias={dias} onAba={setAba} />}
      {aba === 'clientes' && <ClientesInsights dias={dias} />}
      {aba === 'pedidos' && <PedidosInsights dias={dias} />}
      {aba === 'vendedores' && <VendedoresInsights dias={dias} />}
    </div>
  )
}
