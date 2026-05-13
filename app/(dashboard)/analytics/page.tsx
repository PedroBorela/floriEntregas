'use client'

import { useState, useEffect, type ReactElement } from 'react'
import { formatarMoeda } from '@/lib/formatters'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Cell, PieChart, Pie,
} from 'recharts'

interface Analytics {
  kpis: {
    total_pedidos: number
    receita_total: number
    ticket_medio: number
    entregas: number
    retiradas: number
    a_receber: number
    pedidos_hoje: number
  }
  top_produtos: { nome: string; total: number; receita: number }[]
  por_dia: { dia: string; pedidos: number; receita: number }[]
  pagamentos: { tipo: string; qtd: number }[]
  top_clientes: { id: string; nome: string; pedidos: number; receita: number }[]
}

const LABELS_PAG: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
}

const COLORS = {
  primary: '#166534', // green-800
  secondary: '#22c55e', // green-500
  accent: '#ea580c', // orange-600
  info: '#0369a1', // sky-700
  warning: '#b45309', // amber-700
  danger: '#be123c', // rose-700
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    500: '#64748b',
    900: '#0f172a',
  }
}

const PAG_COLORS: Record<string, string> = {
  pix: COLORS.secondary,
  dinheiro: COLORS.primary,
  cartao_credito: COLORS.accent,
  cartao_debito: COLORS.warning,
}

function KpiCard({
  label, value, sub, color, icon,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: ReactElement
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div
        className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-col h-full relative z-10">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
          style={{ backgroundColor: `${color}10`, color: color }}
        >
          {icon}
        </div>
        <div className="mt-auto">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {sub && (
            <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function CardShell({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider opacity-70">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-300">
      <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">Nenhum dado encontrado no período</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-40" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-80" />
        ))}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Análise de Desempenho</h1>
          <p className="text-slate-500 font-medium mt-1">Acompanhe o crescimento da sua floricultura</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner shrink-0">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${dias === d
                  ? 'bg-white shadow-sm text-green-800'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {d === 7 ? 'Semana' : d === 30 ? 'Mês' : 'Trimestre'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : !dados ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Erro na conexão</h2>
          <p className="text-slate-500 mt-1">Não foi possível carregar os dados estatísticos no momento.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <DashboardContent dados={dados} />
      )}
    </div>
  )
}

function DashboardContent({ dados }: { dados: Analytics }) {
  const { kpis, top_produtos, por_dia, pagamentos, top_clientes } = dados

  const totalPag = pagamentos.reduce((s, p) => s + p.qtd, 0)
  const pctEntregas = kpis.total_pedidos > 0
    ? Math.round((kpis.entregas / kpis.total_pedidos) * 100)
    : 0

  const chartData = por_dia.map(d => ({
    ...d,
    receitaFmt: formatarMoeda(d.receita)
  }))

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Volume de Pedidos"
          value={String(kpis.total_pedidos)}
          sub={`${kpis.pedidos_hoje} pedidos hoje`}
          color={COLORS.primary}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
        <KpiCard
          label="Faturamento Bruto"
          value={formatarMoeda(kpis.receita_total)}
          sub={`Média de ${formatarMoeda(kpis.ticket_medio)} / pedido`}
          color={COLORS.secondary}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Pendente de Recebimento"
          value={formatarMoeda(kpis.a_receber)}
          sub="Pedidos parciais ou em aberto"
          color={kpis.a_receber > 0 ? COLORS.danger : COLORS.primary}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <KpiCard
          label="Logística de Entrega"
          value={`${pctEntregas}%`}
          sub={`${kpis.entregas} entregas efetuadas`}
          color={COLORS.info}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
            </svg>
          }
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell title="Histórico de Vendas">
          <div className="h-[300px] w-full pt-4">
            {por_dia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray[100]} />
                  <XAxis
                    dataKey="dia"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                    cursor={{ fill: COLORS.gray[50] }}
                  />
                  <Bar dataKey="pedidos" name="Pedidos" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </CardShell>

        <CardShell title="Faturamento por Dia">
          <div className="h-[300px] w-full pt-4">
            {por_dia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray[100]} />
                  <XAxis
                    dataKey="dia"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    name="Receita"
                    stroke={COLORS.secondary}
                    strokeWidth={4}
                    dot={{ r: 4, fill: COLORS.secondary, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </CardShell>
      </div>

      {/* Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <CardShell title="Meios de Pagamento" className="lg:col-span-1">
          <div className="space-y-5 pt-2">
            {pagamentos.length > 0 ? pagamentos.map((p) => {
              const pct = totalPag > 0 ? Math.round((p.qtd / totalPag) * 100) : 0
              const color = PAG_COLORS[p.tipo] ?? COLORS.gray[500]
              return (
                <div key={p.tipo} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">{LABELS_PAG[p.tipo] || p.tipo}</span>
                    <span className="text-xs font-black text-slate-400 group-hover:text-slate-900 transition-colors">{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            }) : <EmptyState />}
          </div>
        </CardShell>

        {/* Top Products */}
        <CardShell title="Produtos Estrela" className="lg:col-span-2">
          <div className="space-y-4 pt-2">
            {top_produtos.length > 0 ? top_produtos.slice(0, 5).map((p, i) => {
              const max = top_produtos[0].total
              const pct = max > 0 ? (p.total / max) * 100 : 0
              return (
                <div key={p.nome} className="relative">
                  <div className="flex items-center justify-between mb-1.5 relative z-10 px-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}</span>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[200px] sm:max-w-md">{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-medium text-slate-400">{formatarMoeda(p.receita)}</span>
                      <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{p.total} un.</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-100/50"
                      style={{ width: `${pct}%`, backgroundColor: i === 0 ? COLORS.accent : COLORS.primary + '30' }}
                    />
                  </div>
                </div>
              )
            }) : <EmptyState />}
          </div>
        </CardShell>
      </div>

      {/* Top Clients Table-like list */}
      <CardShell title="Melhores Clientes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-2">
          {top_clientes.length > 0 ? top_clientes.map((c, i) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-green-800 group-hover:text-white transition-all shadow-inner">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-green-800 transition-colors">{c.nome}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.pedidos} pedidos realizados</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">{formatarMoeda(c.receita)}</p>
                <div className="flex justify-end mt-1">
                  <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((c.receita / (top_clientes[0].receita || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          )) : <EmptyState />}
        </div>
      </CardShell>
    </div>
  )
}
