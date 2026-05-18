import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function calcKpi(pedidos: { valor_total: unknown }[]) {
  const count = pedidos.length
  const receita = pedidos.reduce((s, p) => s + Number(p.valor_total ?? 0), 0)
  const ticket = count > 0 ? receita / count : 0
  return { receita, pedidos: count, ticket }
}

function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Number((((atual - anterior) / anterior) * 100).toFixed(1))
}

export async function GET() {
  const hoje = new Date().toISOString().split('T')[0]

  const d7 = new Date()
  d7.setDate(d7.getDate() - 7)
  const data7 = d7.toISOString().split('T')[0]

  const d28 = new Date()
  d28.setDate(d28.getDate() - 28)
  const data28 = d28.toISOString().split('T')[0]

  // KPIs diários e pagamentos não quitados em paralelo
  const [r1, r2, r3, rPag] = await Promise.all([
    supabase.from('pedidos').select('valor_total').eq('data_entrega', hoje).neq('status', 'cancelado'),
    supabase.from('pedidos').select('valor_total').eq('data_entrega', data7).neq('status', 'cancelado'),
    supabase.from('pedidos').select('valor_total').eq('data_entrega', data28).neq('status', 'cancelado'),
    // a_receber: part da tabela pagamentos (pago e valor_pago estão lá, não em pedidos)
    supabase.from('pagamentos').select('pedido_id, pago, parcial, valor_pago, valor').eq('pago', false),
  ])

  for (const r of [r1, r2, r3, rPag]) {
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 })
  }

  const kHoje = calcKpi(r1.data ?? [])
  const k7 = calcKpi(r2.data ?? [])
  const k28 = calcKpi(r3.data ?? [])

  // Para cada pagamento não pago, busca o pedido correspondente para checar status e valor_total
  let a_receber = 0
  const pagNaoPagos = rPag.data ?? []
  if (pagNaoPagos.length > 0) {
    const ids = pagNaoPagos.map((p) => p.pedido_id as string)
    const { data: pedidosRef } = await supabase
      .from('pedidos')
      .select('id, valor_total, status')
      .in('id', ids)
      .neq('status', 'cancelado')

    const pedidosMap = new Map(
      (pedidosRef ?? []).map((p) => [p.id as string, p])
    )

    a_receber = pagNaoPagos.reduce((s, pg) => {
      const pedido = pedidosMap.get(pg.pedido_id as string)
      if (!pedido) return s
      const total = Number(pedido.valor_total ?? 0)
      const pago = pg.parcial ? Number(pg.valor_pago ?? 0) : 0
      return s + (total - pago)
    }, 0)
  }

  return NextResponse.json({
    hoje: { ...kHoje, a_receber },
    semana_passada: k7,
    mes_passado: k28,
    variacoes: {
      receita_7d: variacao(kHoje.receita, k7.receita),
      receita_28d: variacao(kHoje.receita, k28.receita),
      pedidos_7d: variacao(kHoje.pedidos, k7.pedidos),
      pedidos_28d: variacao(kHoje.pedidos, k28.pedidos),
      ticket_7d: variacao(kHoje.ticket, k7.ticket),
      ticket_28d: variacao(kHoje.ticket, k28.ticket),
    },
  })
}