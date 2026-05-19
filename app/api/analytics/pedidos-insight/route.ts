import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function faixaHorario(h: string | null): string {
  if (!h) return 'Sem horário'
  if (h.includes('Manhã') || h.includes('8h')) return 'Manhã'
  if (h.includes('Tarde') || h.includes('12h')) return 'Tarde'
  if (h.includes('Noite') || h.includes('18h')) return 'Noite'
  const m = h.match(/^(\d{1,2}):/)
  if (m) {
    const hr = Number.parseInt(m[1])
    if (hr >= 8 && hr < 12) return 'Manhã'
    if (hr >= 12 && hr < 18) return 'Tarde'
    if (hr >= 18) return 'Noite'
  }
  return 'Outro'
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(1, Number.parseInt(searchParams.get('dias') ?? '30')))
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('id, status, tipo, valor_total, valor_frete, tem_cartao, data_entrega, horario_entrega, motivo_cancelamento, zona_frete_id, created_at')
    .gte('created_at', desde.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lista = pedidos ?? []
  const total = lista.length
  const concluidos = lista.filter((p) => ['entregue', 'retirado', 'vendido'].includes(p.status)).length
  const cancelados = lista.filter((p) => p.status === 'cancelado').length
  const com_cartao = lista.filter((p) => p.tem_cartao).length
  const entregas = lista.filter((p) => p.tipo === 'entrega' && p.status !== 'cancelado')
  const frete_medio = entregas.length > 0
    ? entregas.reduce((s, p) => s + Number.parseFloat(String(p.valor_frete ?? 0)), 0) / entregas.length
    : 0
  const taxa_conclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const taxa_cancelamento = total > 0 ? Math.round((cancelados / total) * 100) : 0

  const statusMap = new Map<string, number>()
  for (const p of lista) statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1)
  const por_status = [...statusMap.entries()].map(([status, total]) => ({ status, total }))

  const dowMap = new Map<number, number>()
  for (const p of lista) {
    if (!p.data_entrega) continue
    const dow = new Date(p.data_entrega + 'T12:00:00').getDay()
    dowMap.set(dow, (dowMap.get(dow) ?? 0) + 1)
  }
  const por_dia_semana = DIAS_SEMANA.map((label, dia) => ({ dia, label, total: dowMap.get(dia) ?? 0 }))

  const horarioMap = new Map<string, number>()
  for (const p of lista) {
    const faixa = faixaHorario(p.horario_entrega)
    horarioMap.set(faixa, (horarioMap.get(faixa) ?? 0) + 1)
  }
  const ordemFaixas = ['Manhã', 'Tarde', 'Noite', 'Sem horário', 'Outro']
  const por_faixa_horario = ordemFaixas.filter((f) => horarioMap.has(f)).map((f) => ({ faixa: f, total: horarioMap.get(f) ?? 0 }))

  const motivoMap = new Map<string, number>()
  for (const p of lista) {
    if (p.status !== 'cancelado' || !p.motivo_cancelamento) continue
    motivoMap.set(p.motivo_cancelamento, (motivoMap.get(p.motivo_cancelamento) ?? 0) + 1)
  }
  const totalMotivos = [...motivoMap.values()].reduce((s, v) => s + v, 0)
  const cancelamentos_por_motivo = [...motivoMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([motivo, total]) => ({ motivo, total, pct: totalMotivos > 0 ? Math.round((total / totalMotivos) * 100) : 0 }))

  const { data: zonas } = await supabase.from('zonas_frete').select('id, nome')
  const zonaNomes = new Map((zonas ?? []).map((z) => [z.id, z.nome]))

  const tipoZonaMap = new Map<string, { total: number; receita: number }>()
  for (const p of lista.filter((p) => p.status !== 'cancelado')) {
    const zona = p.zona_frete_id ? (zonaNomes.get(p.zona_frete_id) ?? 'Outra zona') : 'Sem zona'
    const key = `${p.tipo}|${zona}`
    const cur = tipoZonaMap.get(key) ?? { total: 0, receita: 0 }
    cur.total++
    cur.receita += Number.parseFloat(String(p.valor_total ?? 0))
    tipoZonaMap.set(key, cur)
  }
  const por_tipo_zona = [...tipoZonaMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([key, v]) => { const [tipo, zona] = key.split('|'); return { tipo, zona, ...v } })

  let tempo_medio_conclusao_horas: number | null = null
  try {
    const entregueIds = lista.filter((p) => p.status === 'entregue').map((p) => p.id)
    if (entregueIds.length > 0) {
      const { data: logs } = await supabase
        .from('pedido_status_log')
        .select('pedido_id, created_at')
        .eq('status_novo', 'entregue')
        .in('pedido_id', entregueIds)
      if (logs && logs.length > 0) {
        const createdMap = new Map(lista.map((p) => [p.id, p.created_at as string]))
        const tempos = logs
          .map((l) => {
            const c = createdMap.get(l.pedido_id)
            if (!c) return null
            const diff = (new Date(l.created_at).getTime() - new Date(c).getTime()) / 3600000
            return diff > 0 ? diff : null
          })
          .filter((t): t is number => t !== null)
        if (tempos.length > 0) tempo_medio_conclusao_horas = tempos.reduce((s, t) => s + t, 0) / tempos.length
      }
    }
  } catch { /* pedido_status_log may not exist */ }

  return NextResponse.json({
    kpis: { taxa_conclusao, taxa_cancelamento, pedidos_com_cartao: com_cartao, frete_medio, tempo_medio_conclusao_horas },
    por_status,
    por_dia_semana,
    por_faixa_horario,
    cancelamentos_por_motivo,
    por_tipo_zona,
  })
}
