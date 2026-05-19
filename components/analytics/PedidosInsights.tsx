'use client'

import { useState, useEffect } from 'react'
import { formatarMoeda } from '@/lib/formatters'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { KpiCard, CardShell, EmptyState, TabSkeleton, TabErro, COLORS } from './shared'

interface PedidosInsightData {
  kpis: {
    taxa_conclusao: number
    taxa_cancelamento: number
    pedidos_com_cartao: number
    frete_medio: number
    tempo_medio_conclusao_horas: number | null
  }
  por_status: { status: string; total: number }[]
  por_dia_semana: { dia: number; label: string; total: number }[]
  por_faixa_horario: { faixa: string; total: number }[]
  cancelamentos_por_motivo: { motivo: string; total: number; pct: number }[]
  por_tipo_zona: { tipo: string; zona: string; total: number; receita: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_preparo: 'Em preparo',
  pronto: 'Pronto',
  saiu_entrega: 'Saiu p/ entrega',
  entregue: 'Entregue',
  retirado: 'Retirado',
  vendido: 'Vendido',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pendente: '#94a3b8',
  em_preparo: '#f59e0b',
  pronto: '#3b82f6',
  saiu_entrega: '#8b5cf6',
  entregue: '#22c55e',
  retirado: '#166534',
  vendido: '#0369a1',
  cancelado: '#ef4444',
}

const TIPO_LABELS: Record<string, string> = {
  entrega: 'Entrega',
  retirada: 'Retirada',
  balcao: 'Balcão',
}

function formatarHoras(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}min`
  return `${h.toFixed(1)}h`
}

export default function PedidosInsights({ dias }: Readonly<{ dias: number }>) {
  const [dados, setDados] = useState<PedidosInsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  function carregar() {
    setLoading(true)
    setErro(null)
    fetch(`/api/analytics/pedidos-insight?dias=${dias}`)
      .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json() })
      .then((d) => { setDados(d); setLoading(false) })
      .catch((e: Error) => { setErro(e.message.slice(0, 200)); setLoading(false) })
  }

  useEffect(() => { carregar() }, [dias])

  if (loading) return <TabSkeleton />
  if (erro || !dados) return <TabErro erro={erro} onRetry={carregar} />

  const { kpis, por_status, por_dia_semana, por_faixa_horario, cancelamentos_por_motivo, por_tipo_zona } = dados
  const statusOrdenado = [...por_status].sort((a, b) => b.total - a.total)
  const maxStatus = Math.max(...statusOrdenado.map((s) => s.total), 1)
  const totalFaixas = por_faixa_horario.reduce((s, f) => s + f.total, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Taxa de Conclusão" value={`${kpis.taxa_conclusao}%`} color={COLORS.secondary} />
        <KpiCard label="Taxa de Cancelamento" value={`${kpis.taxa_cancelamento}%`} color={kpis.taxa_cancelamento > 10 ? COLORS.danger : COLORS.gray[500]} />
        <KpiCard label="Com Cartão-Mensagem" value={String(kpis.pedidos_com_cartao)} color={COLORS.accent} />
        <KpiCard label="Frete Médio" value={formatarMoeda(kpis.frete_medio)} sub="Pedidos de entrega" color={COLORS.info} />
        <KpiCard
          label="Tempo Médio Conclusão"
          value={kpis.tempo_medio_conclusao_horas !== null ? formatarHoras(kpis.tempo_medio_conclusao_horas) : '—'}
          sub="Criação até entrega"
          color={COLORS.warning}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell title="Distribuição por Status">
          {por_status.length === 0 ? <EmptyState /> : (
            <div className="space-y-3 pt-1">
              {statusOrdenado.map((s) => {
                const pct = Math.round((s.total / maxStatus) * 100)
                const color = STATUS_COLORS[s.status] ?? COLORS.gray[400]
                return (
                  <div key={s.status}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{STATUS_LABELS[s.status] ?? s.status}</span>
                      <span className="text-xs font-black text-slate-500">{s.total}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardShell>

        <CardShell title="Volume por Dia da Semana">
          {por_dia_semana.every((d) => d.total === 0) ? <EmptyState /> : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={por_dia_semana} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.gray[100]} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: COLORS.gray[400], fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: COLORS.gray[400], fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }} formatter={(v: any) => [v, 'Pedidos']} />
                  <Bar dataKey="total" name="Pedidos" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell title="Faixa de Horário de Entrega">
          {por_faixa_horario.length === 0 ? <EmptyState /> : (
            <div className="space-y-4 pt-2">
              {por_faixa_horario.map((f) => {
                const pct = totalFaixas > 0 ? Math.round((f.total / totalFaixas) * 100) : 0
                return (
                  <div key={f.faixa}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-slate-700">{f.faixa}</span>
                      <span className="text-xs font-black text-slate-500">{f.total} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div className="h-full rounded-full bg-green-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardShell>

        <CardShell title="Tipo × Zona de Frete">
          {por_tipo_zona.length === 0 ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-3 pr-3">Tipo</th>
                    <th className="text-left pb-3 pr-3">Zona</th>
                    <th className="text-right pb-3 pr-3">Pedidos</th>
                    <th className="text-right pb-3">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {por_tipo_zona.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 pr-3 font-medium text-slate-700">{TIPO_LABELS[r.tipo] ?? r.tipo}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{r.zona}</td>
                      <td className="py-2.5 pr-3 text-right font-bold text-slate-900">{r.total}</td>
                      <td className="py-2.5 text-right text-slate-600">{formatarMoeda(r.receita)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardShell>
      </div>

      {cancelamentos_por_motivo.length > 0 && (
        <CardShell title="Cancelamentos por Motivo">
          <div className="space-y-3 pt-1">
            {cancelamentos_por_motivo.map((m) => (
              <div key={m.motivo}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[60%]">{m.motivo}</span>
                  <span className="text-xs font-black text-slate-500">{m.total} ({m.pct}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-rose-400" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardShell>
      )}
    </div>
  )
}
