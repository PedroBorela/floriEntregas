import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dias = Math.min(90, Math.max(1, Number.parseInt(searchParams.get('dias') ?? '30')))
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  const desdeStr = desde.toISOString()

  const empty = {
    kpis: { clientes_unicos: 0, clientes_novos: 0, clientes_recorrentes: 0, ltv_medio: 0, ticket_medio: 0, frequencia_media: 0 },
    top_clientes: [],
    por_bairro: [],
    novos_vs_recorrentes: { novos: 0, recorrentes: 0, ticket_novos: 0, ticket_recorrentes: 0 },
  }

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('id, cliente_id, cliente_nome, valor_total, data_entrega, created_at, endereco:enderecos(bairro)')
    .neq('status', 'cancelado')
    .gte('created_at', desdeStr)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lista = pedidos ?? []
  if (lista.length === 0) return NextResponse.json(empty)

  const clienteIds = [...new Set(lista.filter((p) => p.cliente_id).map((p) => p.cliente_id as string))]

  const { data: historico } = await supabase
    .from('pedidos')
    .select('cliente_id')
    .in('cliente_id', clienteIds)
    .neq('status', 'cancelado')
    .lt('created_at', desdeStr)

  const clientesComHistorico = new Set((historico ?? []).map((p) => p.cliente_id as string))

  const clienteMap = new Map<string, { nome: string; total_pedidos: number; receita: number; ultimo_pedido: string }>()
  for (const p of lista) {
    if (!p.cliente_id) continue
    const cur = clienteMap.get(p.cliente_id) ?? { nome: p.cliente_nome, total_pedidos: 0, receita: 0, ultimo_pedido: '' }
    cur.total_pedidos++
    cur.receita += Number.parseFloat(String(p.valor_total ?? 0))
    const dt = p.data_entrega ?? (p.created_at as string).slice(0, 10)
    if (!cur.ultimo_pedido || dt > cur.ultimo_pedido) cur.ultimo_pedido = dt
    clienteMap.set(p.cliente_id, cur)
  }

  const clientes_unicos = clienteMap.size
  const clientes_novos = clienteIds.filter((id) => !clientesComHistorico.has(id)).length
  const clientes_recorrentes = clienteIds.filter((id) => clientesComHistorico.has(id)).length
  const receita_total = lista.reduce((s, p) => s + Number.parseFloat(String(p.valor_total ?? 0)), 0)
  const ticket_medio = clientes_unicos > 0 ? receita_total / clientes_unicos : 0
  const frequencia_media = clientes_unicos > 0 ? lista.length / clientes_unicos : 0

  const { data: todosPedidos } = await supabase
    .from('pedidos')
    .select('cliente_id, valor_total')
    .in('cliente_id', clienteIds)
    .neq('status', 'cancelado')

  const ltvMap = new Map<string, number>()
  for (const p of todosPedidos ?? []) {
    if (!p.cliente_id) continue
    ltvMap.set(p.cliente_id, (ltvMap.get(p.cliente_id) ?? 0) + Number.parseFloat(String(p.valor_total ?? 0)))
  }
  const ltv_medio = ltvMap.size > 0 ? [...ltvMap.values()].reduce((s, v) => s + v, 0) / ltvMap.size : 0

  const top_clientes = [...clienteMap.entries()]
    .sort((a, b) => b[1].receita - a[1].receita)
    .slice(0, 10)
    .map(([cliente_id, v]) => ({
      cliente_id,
      cliente_nome: v.nome,
      total_pedidos: v.total_pedidos,
      receita: v.receita,
      ultimo_pedido: v.ultimo_pedido,
      ticket_medio: v.total_pedidos > 0 ? v.receita / v.total_pedidos : 0,
    }))

  const bairroMap = new Map<string, { label: string; total_pedidos: number; receita: number }>()
  for (const p of lista) {
    const bairroRaw = (p.endereco as any)?.bairro
    if (!bairroRaw) continue
    const key = String(bairroRaw).trim().toLowerCase()
    const label = String(bairroRaw).trim().replace(/\b\w/g, (c: string) => c.toUpperCase())
    const cur = bairroMap.get(key) ?? { label, total_pedidos: 0, receita: 0 }
    cur.total_pedidos++
    cur.receita += Number.parseFloat(String(p.valor_total ?? 0))
    bairroMap.set(key, cur)
  }
  const por_bairro = [...bairroMap.values()]
    .sort((a, b) => b.total_pedidos - a.total_pedidos)
    .slice(0, 8)
    .map(({ label, total_pedidos, receita }) => ({ bairro: label, total_pedidos, receita }))

  const novosIds = new Set(clienteIds.filter((id) => !clientesComHistorico.has(id)))
  let ticketNovosTotal = 0, ticketNovosCount = 0, ticketRecTotal = 0, ticketRecCount = 0
  for (const p of lista) {
    if (!p.cliente_id) continue
    const val = Number.parseFloat(String(p.valor_total ?? 0))
    if (novosIds.has(p.cliente_id)) { ticketNovosTotal += val; ticketNovosCount++ }
    else { ticketRecTotal += val; ticketRecCount++ }
  }

  return NextResponse.json({
    kpis: { clientes_unicos, clientes_novos, clientes_recorrentes, ltv_medio, ticket_medio, frequencia_media },
    top_clientes,
    por_bairro,
    novos_vs_recorrentes: {
      novos: clientes_novos,
      recorrentes: clientes_recorrentes,
      ticket_novos: ticketNovosCount > 0 ? ticketNovosTotal / ticketNovosCount : 0,
      ticket_recorrentes: ticketRecCount > 0 ? ticketRecTotal / ticketRecCount : 0,
    },
  })
}
