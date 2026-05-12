'use client'

import { useState, useEffect, type ReactElement } from 'react'
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

const PAG_COLORS: Record<string, string> = {
  pix: '#1B5E20',
  dinheiro: '#2E7D32',
  cartao_credito: '#D4651A',
  cartao_debito: '#BF360C',
}

const PAG_ICONS: Record<string, ReactElement> = {
  pix: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M11.9 2C6.4 2 2 6.4 2 11.9s4.4 9.9 9.9 9.9 9.9-4.4 9.9-9.9S17.5 2 11.9 2zm5.5 11.3l-2.8 2.8c-.4.4-1 .6-1.5.6H9.8c-.6 0-1.1-.2-1.5-.6L5.5 13.3c-.8-.8-.8-2.2 0-3l2.8-2.8c.4-.4 1-.6 1.5-.6h3.3c.6 0 1.1.2 1.5.6l2.8 2.8c.8.8.8 2.1 0 3z" />
    </svg>
  ),
  dinheiro: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  cartao_credito: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  cartao_debito: (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
}

function KpiCard({
  label, value, sub, accentColor, icon,
}: {
  label: string
  value: string
  sub?: string
  accentColor: string
  icon: ReactElement
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3"
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
        <p className="text-xs text-gray-500 mt-1.5 font-medium">{label}</p>
      </div>
    </div>
  )
}

function CardShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-200">
      <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm text-gray-300">Sem dados no período</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-6 bg-gray-200 rounded-lg w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-5" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="h-3 bg-gray-200 rounded w-1/4 mb-5" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-3 bg-gray-100 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-12" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full" />
              </div>
              <div className="w-16 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-900 leading-none">Analytics</h1>
          <p className="text-sm text-gray-400 mt-1.5">Visão geral de desempenho</p>
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl shrink-0">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dias === d
                  ? 'bg-white shadow text-green-900 font-semibold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : !dados ? (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm">Erro ao carregar dados</p>
        </div>
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
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total de pedidos"
          value={String(kpis.total_pedidos)}
          accentColor="#1B5E20"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KpiCard
          label="Receita total"
          value={formatarMoeda(kpis.receita_total)}
          accentColor="#2E7D32"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Ticket médio"
          value={formatarMoeda(kpis.ticket_medio)}
          accentColor="#D4651A"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <KpiCard
          label="Taxa de entrega"
          value={`${pctEntregas}%`}
          sub={`${kpis.entregas} entregas · ${kpis.retiradas} retiradas`}
          accentColor="#1565C0"
          icon={
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pedidos por dia */}
        <CardShell title="Pedidos por dia">
          {por_dia.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={por_dia} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: 12,
                    padding: '8px 12px',
                  }}
                  cursor={{ fill: '#f9fafb' }}
                  formatter={(v) => [v as number, 'Pedidos']}
                />
                <Bar dataKey="pedidos" fill="#1B5E20" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardShell>

        {/* Forma de pagamento */}
        <CardShell title="Forma de pagamento">
          {pagamentos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4 pt-1">
              {pagamentos.map((p) => {
                const pct = totalPag > 0 ? Math.round((p.qtd / totalPag) * 100) : 0
                const color = PAG_COLORS[p.tipo] ?? '#6b7280'
                const icon = PAG_ICONS[p.tipo] ?? PAG_ICONS.cartao_credito
                return (
                  <div key={p.tipo} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-medium text-gray-700">
                          {LABELS_PAG[p.tipo] ?? p.tipo}
                        </span>
                        <span className="text-xs text-gray-400 ml-2 shrink-0">
                          {p.qtd} pedido{p.qtd !== 1 ? 's' : ''} · <strong className="text-gray-600">{pct}%</strong>
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardShell>
      </div>

      {/* Top 10 produtos */}
      <CardShell title="Top 10 produtos mais vendidos">
        {top_produtos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {top_produtos.map((p, i) => {
              const max = top_produtos[0].total
              const pct = max > 0 ? (p.total / max) * 100 : 0
              return (
                <div key={p.nome} className="flex items-center gap-3 group">
                  <span className="text-xs font-bold text-gray-200 w-5 text-right shrink-0 group-hover:text-gray-400 transition-colors">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-gray-700 truncate pr-4 max-w-[60%]">
                        {p.nome}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-400 hidden sm:block">
                          {formatarMoeda(p.receita)}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 w-6 text-right">
                          {p.total}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: i === 0 ? '#D4651A' : i < 3 ? '#E07B38' : '#E89660',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardShell>
    </div>
  )
}
