import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(1, parseInt(searchParams.get('dias') ?? '30')))
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  const hoje = new Date().toISOString().split('T')[0]

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, valor_total, tipo, status, created_at, data_entrega, cliente_id, cliente_nome, pagamentos(pago, parcial, valor_pago, tipo)')
    .neq('status', 'cancelado')
    .gte('created_at', desde.toISOString())

  if (!pedidos?.length) {
    return NextResponse.json({
      kpis: { total_pedidos: 0, receita_total: 0, ticket_medio: 0, entregas: 0, retiradas: 0, a_receber: 0, pedidos_hoje: 0 },
      top_produtos: [],
      por_dia: [],
      pagamentos: [],
      top_clientes: [],
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
  const pedidos_hoje = pedidos.filter((p) => (p.data_entrega ?? (p.created_at as string).slice(0, 10)) === hoje).length

  const a_receber = pedidos.reduce((s, p) => {
    const pag = Array.isArray(p.pagamentos) ? p.pagamentos[0] : null
    if (pag?.pago) return s
    const total = parseFloat(String(p.valor_total ?? 0))
    const pago = pag?.parcial ? parseFloat(String(pag.valor_pago ?? 0)) : 0
    return s + (total - pago)
  }, 0)

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
    const tipo = Array.isArray(p.pagamentos) ? p.pagamentos[0]?.tipo : null
    if (tipo) pagMap.set(tipo, (pagMap.get(tipo) ?? 0) + 1)
  }
  const pagamentos = [...pagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tipo, qtd]) => ({ tipo, qtd }))

  const clienteMap = new Map<string, { nome: string; pedidos: number; receita: number }>()
  for (const p of pedidos) {
    if (!p.cliente_id) continue
    const cur = clienteMap.get(p.cliente_id) ?? { nome: p.cliente_nome, pedidos: 0, receita: 0 }
    cur.pedidos++
    cur.receita += parseFloat(String(p.valor_total ?? 0))
    clienteMap.set(p.cliente_id, cur)
  }
  const top_clientes = [...clienteMap.entries()]
    .sort((a, b) => b[1].pedidos - a[1].pedidos)
    .slice(0, 5)
    .map(([id, v]) => ({ id, ...v }))

  return NextResponse.json({
    kpis: { total_pedidos, receita_total, ticket_medio, entregas, retiradas, a_receber, pedidos_hoje },
    top_produtos,
    por_dia,
    pagamentos,
    top_clientes,
  })
}
