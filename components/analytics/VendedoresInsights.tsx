'use client'

import { useState, useEffect } from 'react'
import { formatarMoeda } from '@/lib/formatters'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { KpiCard, CardShell, EmptyState, TabSkeleton, TabErro, COLORS } from './shared'

interface VendedoresData {
  kpis: {
    vendedores_ativos: number
    maior_receita: { nome: string; valor: number }
    maior_volume: { nome: string; total: number }
  }
  ranking: {
    nome: string
    total_pedidos: number
    receita: number
    ticket_medio: number
    entregas: number
    retiradas: number
    cancelados: number
    pct_cancelamento: number
  }[]
  evolucao_mensal: { mes: string; por_vendedor: { nome: string; receita: number }[] }[]
}

const LINE_COLORS = ['#166534', '#22c55e', '#ea580c', '#0369a1', '#b45309', '#be123c', '#7c3aed']

function formatarMes(mes: string) {
  const [ano, m] = mes.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[Number.parseInt(m) - 1]}/${ano.slice(2)}`
}

export default function VendedoresInsights({ dias }: Readonly<{ dias: number }>) {
  const [dados, setDados] = useState<VendedoresData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  function carregar() {
    setLoading(true)
    setErro(null)
    fetch(`/api/analytics/vendedores?dias=${dias}`)
      .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json() })
      .then((d) => { setDados(d); setLoading(false) })
      .catch((e: Error) => { setErro(e.message.slice(0, 200)); setLoading(false) })
  }

  useEffect(() => { carregar() }, [dias])

  if (loading) return <TabSkeleton />
  if (erro || !dados) return <TabErro erro={erro} onRetry={carregar} />

  const { kpis, ranking, evolucao_mensal } = dados

  const allNames = [...new Set(evolucao_mensal.flatMap((m) => m.por_vendedor.map((v) => v.nome)))]
  const evolucaoFlat = evolucao_mensal.map((m) => {
    const row: Record<string, any> = { mes: formatarMes(m.mes) }
    for (const v of m.por_vendedor) row[v.nome] = v.receita
    return row
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Vendedores Ativos" value={String(kpis.vendedores_ativos)} color={COLORS.primary} />
        <KpiCard label="Maior Faturamento" value={kpis.maior_receita.nome} sub={formatarMoeda(kpis.maior_receita.valor)} color={COLORS.secondary} />
        <KpiCard label="Maior Volume" value={kpis.maior_volume.nome} sub={`${kpis.maior_volume.total} pedidos`} color={COLORS.info} />
      </div>

      <CardShell title="Ranking Completo">
        {ranking.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Vendedor</th>
                  <th className="text-right pb-3 pr-4">Pedidos</th>
                  <th className="text-right pb-3 pr-4">Faturamento</th>
                  <th className="text-right pb-3 pr-4">Ticket Médio</th>
                  <th className="text-right pb-3 pr-4">Entregas</th>
                  <th className="text-right pb-3 pr-4">Retiradas</th>
                  <th className="text-right pb-3">Cancel.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ranking.map((v, i) => (
                  <tr key={v.nome} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 text-slate-300 font-black text-xs">{i + 1}</td>
                    <td className="py-3 pr-4 font-bold text-slate-800">{v.nome}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{v.total_pedidos}</td>
                    <td className="py-3 pr-4 text-right font-bold text-slate-900">{formatarMoeda(v.receita)}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{formatarMoeda(v.ticket_medio)}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{v.entregas}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{v.retiradas}</td>
                    <td className="py-3 text-right">
                      {v.cancelados > 0 ? (
                        <span className="text-xs font-bold text-rose-500">{v.cancelados} ({v.pct_cancelamento}%)</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      {evolucaoFlat.length > 1 && allNames.length > 0 && (
        <CardShell title="Evolução Mensal por Vendedor">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoFlat} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray[100]} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} />
                <Tooltip formatter={(v: any, name: any) => [formatarMoeda(Number(v)), name]} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }} />
                {allNames.map((nome, i) => (
                  <Line key={nome} type="monotone" dataKey={nome} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {allNames.length > 1 && (
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {allNames.map((nome, i) => (
                <div key={nome} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                  {nome}
                </div>
              ))}
            </div>
          )}
        </CardShell>
      )}
    </div>
  )
}
