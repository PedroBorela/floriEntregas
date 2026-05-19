import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(1, Number.parseInt(searchParams.get('dias') ?? '30')))
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  const desdeStr = desde.toISOString()

  const seisMesesAtras = new Date()
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5)
  seisMesesAtras.setDate(1)
  seisMesesAtras.setHours(0, 0, 0, 0)

  const [{ data: vendedoresList }, { data: pedidos, error }] = await Promise.all([
    supabase.from('vendedores').select('id, nome').eq('ativo', true),
    supabase
      .from('pedidos')
      .select('id, vendedor_id, valor_total, tipo, status, created_at')
      .gte('created_at', desdeStr),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const vNames = new Map((vendedoresList ?? []).map((v) => [v.id, v.nome]))
  const lista = pedidos ?? []

  const rankMap = new Map<string, { nome: string; total_pedidos: number; receita: number; entregas: number; retiradas: number; cancelados: number }>()
  for (const v of vendedoresList ?? []) {
    rankMap.set(v.id, { nome: v.nome, total_pedidos: 0, receita: 0, entregas: 0, retiradas: 0, cancelados: 0 })
  }
  for (const p of lista) {
    const vid = p.vendedor_id ?? 'sem_vendedor'
    const cur = rankMap.get(vid) ?? { nome: vNames.get(vid) ?? 'Sem Vendedor', total_pedidos: 0, receita: 0, entregas: 0, retiradas: 0, cancelados: 0 }
    cur.total_pedidos++
    if (p.status === 'cancelado') {
      cur.cancelados++
    } else {
      cur.receita += Number.parseFloat(String(p.valor_total ?? 0))
      if (p.tipo === 'entrega') cur.entregas++
      else if (p.tipo === 'retirada') cur.retiradas++
    }
    rankMap.set(vid, cur)
  }

  const ranking = [...rankMap.values()]
    .filter((v) => v.total_pedidos > 0)
    .sort((a, b) => b.receita - a.receita)
    .map((v) => ({
      ...v,
      ticket_medio: (v.total_pedidos - v.cancelados) > 0 ? v.receita / (v.total_pedidos - v.cancelados) : 0,
      pct_cancelamento: v.total_pedidos > 0 ? Math.round((v.cancelados / v.total_pedidos) * 100) : 0,
    }))

  const vendedores_ativos = ranking.length
  const maior_receita = ranking[0] ? { nome: ranking[0].nome, valor: ranking[0].receita } : { nome: '—', valor: 0 }
  const porVolume = [...ranking].sort((a, b) => b.total_pedidos - a.total_pedidos)
  const maior_volume = porVolume[0] ? { nome: porVolume[0].nome, total: porVolume[0].total_pedidos } : { nome: '—', total: 0 }

  const { data: pedidosMensais } = await supabase
    .from('pedidos')
    .select('vendedor_id, valor_total, created_at')
    .gte('created_at', seisMesesAtras.toISOString())
    .neq('status', 'cancelado')

  const mesVendedorMap = new Map<string, Map<string, number>>()
  for (const p of pedidosMensais ?? []) {
    const mes = (p.created_at as string).slice(0, 7)
    const vid = p.vendedor_id ?? 'sem_vendedor'
    const nome = vNames.get(vid) ?? 'Sem Vendedor'
    if (!mesVendedorMap.has(mes)) mesVendedorMap.set(mes, new Map())
    const mm = mesVendedorMap.get(mes)!
    mm.set(nome, (mm.get(nome) ?? 0) + Number.parseFloat(String(p.valor_total ?? 0)))
  }
  const evolucao_mensal = [...mesVendedorMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vendMap]) => ({
      mes,
      por_vendedor: [...vendMap.entries()].map(([nome, receita]) => ({ nome, receita })),
    }))

  return NextResponse.json({ kpis: { vendedores_ativos, maior_receita, maior_volume }, ranking, evolucao_mensal })
}
