'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatarMoeda } from '@/lib/formatters'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { KpiCard, CardShell, EmptyState, TabSkeleton, TabErro, COLORS } from './shared'

interface ClientesData {
  kpis: {
    clientes_unicos: number
    clientes_novos: number
    clientes_recorrentes: number
    ltv_medio: number
    ticket_medio: number
    frequencia_media: number
  }
  top_clientes: {
    cliente_id: string
    cliente_nome: string
    total_pedidos: number
    receita: number
    ultimo_pedido: string
    ticket_medio: number
  }[]
  por_bairro: { bairro: string; total_pedidos: number; receita: number }[]
  novos_vs_recorrentes: { novos: number; recorrentes: number; ticket_novos: number; ticket_recorrentes: number }
}

function formatarUltimoPedido(iso: string): string {
  if (!iso) return '—'
  const partes = iso.split('-')
  return `${partes[2]}/${partes[1]}`
}

export default function ClientesInsights({ dias }: Readonly<{ dias: number }>) {
  const [dados, setDados] = useState<ClientesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  function carregar() {
    setLoading(true)
    setErro(null)
    fetch(`/api/analytics/clientes?dias=${dias}`)
      .then(async (r) => { if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`)); return r.json() })
      .then((d) => { setDados(d); setLoading(false) })
      .catch((e: Error) => { setErro(e.message.slice(0, 200)); setLoading(false) })
  }

  useEffect(() => { carregar() }, [dias])

  if (loading) return <TabSkeleton />
  if (erro || !dados) return <TabErro erro={erro} onRetry={carregar} />

  const { kpis, top_clientes, por_bairro, novos_vs_recorrentes: nvr } = dados
  const totalNvR = nvr.novos + nvr.recorrentes

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <KpiCard label="Clientes Únicos" value={String(kpis.clientes_unicos)} color={COLORS.primary} />
        <KpiCard label="Clientes Novos" value={String(kpis.clientes_novos)} sub="Primeiro pedido no período" color={COLORS.secondary} />
        <KpiCard label="Recorrentes" value={String(kpis.clientes_recorrentes)} sub="Voltaram a comprar" color={COLORS.info} />
        <KpiCard label="LTV Médio" value={formatarMoeda(kpis.ltv_medio)} sub="Receita lifetime por cliente" color={COLORS.accent} />
        <KpiCard label="Ticket Médio" value={formatarMoeda(kpis.ticket_medio)} sub="Por cliente no período" color={COLORS.warning} />
        <KpiCard label="Frequência Média" value={kpis.frequencia_media.toFixed(1)} sub="Pedidos por cliente" color={COLORS.gray[500]} />
      </div>

      <CardShell title="Top 10 Clientes">
        {top_clientes.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left pb-3 pr-4">#</th>
                  <th className="text-left pb-3 pr-4">Cliente</th>
                  <th className="text-right pb-3 pr-4">Pedidos</th>
                  <th className="text-right pb-3 pr-4">Receita Total</th>
                  <th className="text-right pb-3 pr-4">Ticket Médio</th>
                  <th className="text-right pb-3">Último Pedido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {top_clientes.map((c, i) => (
                  <tr key={c.cliente_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 text-slate-300 font-black text-xs">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/clientes/${c.cliente_id}`} className="font-bold text-slate-800 hover:text-green-800 transition-colors">
                        {c.cliente_nome}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-600">{c.total_pedidos}</td>
                    <td className="py-3 pr-4 text-right font-bold text-slate-900">{formatarMoeda(c.receita)}</td>
                    <td className="py-3 pr-4 text-right text-slate-600">{formatarMoeda(c.ticket_medio)}</td>
                    <td className="py-3 text-right text-slate-500">{formatarUltimoPedido(c.ultimo_pedido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardShell title="Pedidos por Bairro">
          {por_bairro.length === 0 ? <EmptyState /> : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={por_bairro} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="bairro"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: COLORS.gray[500], fontWeight: 600 }}
                    width={110}
                  />
                  <Tooltip
                    formatter={(v: any, name: string) => [v, name === 'total_pedidos' ? 'Pedidos' : 'Receita']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                  />
                  <Bar dataKey="total_pedidos" name="Pedidos" fill={COLORS.primary} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardShell>

        <CardShell title="Novos vs Recorrentes">
          {totalNvR === 0 ? <EmptyState /> : (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-center">
                  <p className="text-3xl font-black text-green-800">{nvr.novos}</p>
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1">Novos</p>
                  <p className="text-xs text-green-500 mt-1">
                    {totalNvR > 0 ? Math.round((nvr.novos / totalNvR) * 100) : 0}% do total
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
                  <p className="text-3xl font-black text-blue-800">{nvr.recorrentes}</p>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Recorrentes</p>
                  <p className="text-xs text-blue-500 mt-1">
                    {totalNvR > 0 ? Math.round((nvr.recorrentes / totalNvR) * 100) : 0}% do total
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket médio por perfil</p>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm text-green-700 font-medium">Novos</span>
                  <span className="text-sm font-bold text-slate-900">{formatarMoeda(nvr.ticket_novos)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-blue-700 font-medium">Recorrentes</span>
                  <span className="text-sm font-bold text-slate-900">{formatarMoeda(nvr.ticket_recorrentes)}</span>
                </div>
                {nvr.ticket_recorrentes > 0 && nvr.ticket_novos > 0 && (
                  <p className="text-xs text-slate-400 pt-1">
                    Recorrentes gastam {nvr.ticket_recorrentes >= nvr.ticket_novos ? 'mais' : 'menos'} que novos (
                    {Math.abs(Math.round(((nvr.ticket_recorrentes - nvr.ticket_novos) / nvr.ticket_novos) * 100))}%)
                  </p>
                )}
              </div>
            </div>
          )}
        </CardShell>
      </div>
    </div>
  )
}
