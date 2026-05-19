'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatarMoeda } from '@/lib/formatters'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line,
} from 'recharts'
import { KpiCard, CardShell, EmptyState, TabSkeleton, TabErro, COLORS } from './shared'

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
  top_vendedores: { id: string; nome: string; pedidos: number; receita: number }[]
}

const LABELS_PAG: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
}

const PAG_COLORS: Record<string, string> = {
  pix: COLORS.secondary,
  dinheiro: COLORS.primary,
  cartao_credito: COLORS.accent,
  cartao_debito: COLORS.warning,
}

type Aba = 'geral' | 'clientes' | 'pedidos' | 'vendedores'

export default function VisaoGeral({ dias, onAba }: Readonly<{ dias: number; onAba: (aba: Aba) => void }>) {
  const [dados, setDados] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  function carregar() {
    setLoading(true)
    setErro(null)
    fetch(`/api/analytics?dias=${dias}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`))
        return r.json()
      })
      .then((d) => { setDados(d); setLoading(false) })
      .catch((e: Error) => { setErro(e.message.slice(0, 200)); setLoading(false) })
  }

  useEffect(() => { carregar() }, [dias])

  if (loading) return <TabSkeleton />
  if (erro || !dados) return <TabErro erro={erro} onRetry={carregar} />

  const { kpis, top_produtos, por_dia, pagamentos, top_clientes, top_vendedores } = dados
  const totalPag = pagamentos.reduce((s, p) => s + p.qtd, 0)
  const pctEntregas = kpis.total_pedidos > 0 ? Math.round((kpis.entregas / kpis.total_pedidos) * 100) : 0
  const chartData = por_dia.map((d) => ({ ...d }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Volume de Pedidos"
          value={String(kpis.total_pedidos)}
          sub={`${kpis.pedidos_hoje} pedidos hoje`}
          color={COLORS.primary}
        />
        <KpiCard
          label="Faturamento Bruto"
          value={formatarMoeda(kpis.receita_total)}
          sub={`Média ${formatarMoeda(kpis.ticket_medio)} / pedido`}
          color={COLORS.secondary}
        />
        <KpiCard
          label="Pendente de Recebimento"
          value={formatarMoeda(kpis.a_receber)}
          sub="Parciais ou em aberto"
          color={kpis.a_receber > 0 ? COLORS.danger : COLORS.primary}
        />
        <KpiCard
          label="Logística de Entrega"
          value={`${pctEntregas}%`}
          sub={`${kpis.entregas} entregas efetuadas`}
          color={COLORS.info}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell title="Histórico de Pedidos">
          <div className="h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray[100]} />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }} cursor={{ fill: COLORS.gray[50] }} />
                  <Bar dataKey="pedidos" name="Pedidos" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </CardShell>

        <CardShell title="Faturamento por Dia">
          <div className="h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray[100]} />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }} formatter={(v: any) => [formatarMoeda(Number(v)), 'Receita']} />
                  <Line type="monotone" dataKey="receita" name="Receita" stroke={COLORS.secondary} strokeWidth={4} dot={{ r: 4, fill: COLORS.secondary, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </CardShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardShell title="Meios de Pagamento" className="lg:col-span-1">
          <div className="space-y-5 pt-2">
            {pagamentos.length > 0 ? pagamentos.map((p) => {
              const pct = totalPag > 0 ? Math.round((p.qtd / totalPag) * 100) : 0
              const color = PAG_COLORS[p.tipo] ?? COLORS.gray[500]
              return (
                <div key={p.tipo} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">{LABELS_PAG[p.tipo] || p.tipo}</span>
                    <span className="text-xs font-black text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            }) : <EmptyState />}
          </div>
        </CardShell>

        <CardShell title="Produtos Estrela" className="lg:col-span-2">
          <div className="space-y-4 pt-2">
            {top_produtos.length > 0 ? top_produtos.slice(0, 5).map((p, i) => {
              const max = top_produtos[0].total
              const pct = max > 0 ? (p.total / max) * 100 : 0
              return (
                <div key={p.nome}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-black text-slate-300 w-4">{i + 1}</span>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[160px] sm:max-w-sm">{p.nome}</span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-medium text-slate-400">{formatarMoeda(p.receita)}</span>
                      <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{p.total} un.</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: i === 0 ? COLORS.accent : COLORS.primary + '30' }} />
                  </div>
                </div>
              )
            }) : <EmptyState />}
          </div>
        </CardShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell
          title="Top Clientes"
          action={<button onClick={() => onAba('clientes')} className="text-xs font-semibold text-green-700 hover:text-green-900 transition">Ver todos →</button>}
        >
          <div className="space-y-1 pt-1">
            {top_clientes.length > 0 ? top_clientes.slice(0, 3).map((c, i) => (
              <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-green-800 group-hover:text-white transition-all">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-green-800 transition-colors">{c.nome}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.pedidos} pedidos</p>
                </div>
                <p className="text-sm font-black text-slate-900 shrink-0">{formatarMoeda(c.receita)}</p>
              </Link>
            )) : <EmptyState />}
          </div>
        </CardShell>

        <CardShell
          title="Ranking de Vendedores"
          action={<button onClick={() => onAba('vendedores')} className="text-xs font-semibold text-green-700 hover:text-green-900 transition">Ver todos →</button>}
        >
          <div className="h-[180px]">
            {top_vendedores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top_vendedores.slice(0, 3)} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.gray[500], fontWeight: 600 }} width={80} />
                  <Tooltip formatter={(v: any) => [formatarMoeda(Number(v)), 'Faturamento']} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }} />
                  <Bar dataKey="receita" fill={COLORS.secondary} radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </div>
        </CardShell>
      </div>
    </div>
  )
}
