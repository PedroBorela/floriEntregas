import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(1, parseInt(searchParams.get('dias') ?? '30')))
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, valor_total, tipo, pagamento_tipo, status, created_at')
    .neq('status', 'cancelado')
    .gte('created_at', desde.toISOString())

  if (!pedidos?.length) {
    return NextResponse.json({
      kpis: { total_pedidos: 0, receita_total: 0, ticket_medio: 0, entregas: 0, retiradas: 0 },
      top_produtos: [],
      por_dia: [],
      pagamentos: [],
    })
  }

  const pedidoIds = pedidos.map((p) => p.id)
  const { data: itens } = await supabase
    .from('pedido_itens')
    .select('nome_produto, quantidade, subtotal')
    .in('pedido_id', pedidoIds)

  const itensList = itens ?? []

  const total_pedidos = pedidos.length
  const receita_total = pedidos.reduce((s, p) => s + parseFloat(String(p.valor_total ?? 0)), 0)
  const ticket_medio = total_pedidos > 0 ? receita_total / total_pedidos : 0
  const entregas = pedidos.filter((p) => p.tipo === 'entrega').length
  const retiradas = pedidos.filter((p) => p.tipo === 'retirada').length

  const prodMap = new Map<string, { total: number; receita: number }>()
  for (const item of itensList) {
    const cur = prodMap.get(item.nome_produto) ?? { total: 0, receita: 0 }
    cur.total += item.quantidade
    cur.receita += parseFloat(String(item.subtotal ?? 0))
    prodMap.set(item.nome_produto, cur)
  }
  const top_produtos = [...prodMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([nome, v]) => ({ nome, total: v.total, receita: v.receita }))

  const diaMap = new Map<string, { pedidos: number; receita: number }>()
  for (const p of pedidos) {
    const dia = (p.created_at as string).slice(0, 10)
    const cur = diaMap.get(dia) ?? { pedidos: 0, receita: 0 }
    cur.pedidos++
    cur.receita += parseFloat(String(p.valor_total ?? 0))
    diaMap.set(dia, cur)
  }
  const por_dia = [...diaMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, v]) => ({ dia: dia.slice(5).replace('-', '/'), ...v }))

  const pagMap = new Map<string, number>()
  for (const p of pedidos) {
    if (p.pagamento_tipo) pagMap.set(p.pagamento_tipo, (pagMap.get(p.pagamento_tipo) ?? 0) + 1)
  }
  const pagamentos = [...pagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, qtd]) => ({ tipo, qtd }))

  return NextResponse.json({ kpis: { total_pedidos, receita_total, ticket_medio, entregas, retiradas }, top_produtos, por_dia, pagamentos })
}
