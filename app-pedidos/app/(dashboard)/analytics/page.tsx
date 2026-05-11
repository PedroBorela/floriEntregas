'use client'

import { useState, useEffect } from 'react'
import { formatarMoeda } from '@/lib/formatters'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface Analytics {
  kpis: {
    total_pedidos: number
    receita_total: number
    ticket_medio: number
    entregas: number
    retiradas: number
  }
  top_produtos: { nome: string; total: number; receita: number }[]
  por_dia: { dia: string; pedidos: number; receita: number }[]
  pagamentos: { tipo: string; qtd: number }[]
}

const LABELS_PAG: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
}

export default function AnalyticsPage() {
  const [dias, setDias] = useState(30)
  const [dados, setDados] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?dias=${dias}`)
      .then((r) => r.json())
      .then((d) => { setDados(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [dias])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-green-900">Analytics</h1>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                dias === d ? 'bg-white shadow-sm text-green-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : !dados ? (
        <div className="text-center py-16 text-gray-400">Erro ao carregar dados.</div>
      ) : (
        <DashboardContent dados={dados} />
      )}
    </div>
  )
}

function DashboardContent({ dados }: { dados: Analytics }) {
  const { kpis, top_produtos, por_dia, pagamentos } = dados
  const totalPag = pagamentos.reduce((s, p) => s + p.qtd, 0)
  const pctEntregas = kpis.total_pedidos > 0
    ? Math.round((kpis.entregas / kpis.total_pedidos) * 100)
    : 0

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pedidos', value: String(kpis.total_pedidos) },
          { label: 'Receita total', value: formatarMoeda(kpis.receita_total) },
          { label: 'Ticket médio', value: formatarMoeda(kpis.ticket_medio) },
          { label: `Entregas (${kpis.entregas}e / ${kpis.retiradas}r)`, value: `${pctEntregas}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="section-card text-center">
            <p className="text-3xl font-bold text-green-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pedidos por dia */}
        <div className="section-card">
          <h2 className="section-title mb-4">Pedidos por dia</h2>
          {por_dia.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={por_dia} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v, n) =>
                  n === 'pedidos' ? [v as number, 'Pedidos'] : [formatarMoeda(v as number), 'Receita']
                } />
                <Bar dataKey="pedidos" fill="#1B5E20" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Forma de pagamento */}
        <div className="section-card">
          <h2 className="section-title mb-4">Forma de pagamento</h2>
          {pagamentos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados no período</p>
          ) : (
            <div className="space-y-3 pt-2">
              {pagamentos.map((p) => (
                <div key={p.tipo}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{LABELS_PAG[p.tipo] ?? p.tipo}</span>
                    <span className="text-gray-500">
                      {p.qtd} ({totalPag > 0 ? Math.round((p.qtd / totalPag) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 bg-orange-500 rounded-full transition-all"
                      style={{ width: `${totalPag > 0 ? (p.qtd / totalPag) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 10 produtos */}
        <div className="section-card md:col-span-2">
          <h2 className="section-title mb-4">Top 10 produtos mais vendidos</h2>
          {top_produtos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sem dados no período</p>
          ) : (
            <ResponsiveContainer width="100%" height={top_produtos.length * 36 + 20}>
              <BarChart
                layout="vertical"
                data={top_produtos}
                margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={180} />
                <Tooltip formatter={(v) => [v as number, 'Unidades']} />
                <Bar dataKey="total" fill="#D4651A" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
