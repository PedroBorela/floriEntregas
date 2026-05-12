import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { itens, ...pedidoData } = body

  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .upsert(
      { nome: pedidoData.cliente_nome, telefone: pedidoData.cliente_telefone },
      { onConflict: 'telefone' }
    )
    .select('id')
    .single()

  if (clienteError) {
    return NextResponse.json({ error: clienteError.message }, { status: 400 })
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({ ...pedidoData, codigo: '', cliente_id: cliente.id })
    .select()
    .single()

  if (pedidoError) {
    return NextResponse.json({ error: pedidoError.message }, { status: 400 })
  }

  if (itens && itens.length > 0) {
    const linhas = itens.map((item: { nome_produto: string; valor_unitario: number; quantidade: number; observacao?: string }, idx: number) => ({
      pedido_id: pedido.id,
      nome_produto: item.nome_produto,
      valor_unitario: item.valor_unitario,
      quantidade: item.quantidade,
      observacao: item.observacao ?? null,
      ordem: idx,
    }))

    const { error: itensError } = await supabase.from('pedido_itens').insert(linhas)

    if (itensError) {
      return NextResponse.json({ error: itensError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ pedido }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const codigo = searchParams.get('codigo')
  const status = searchParams.get('status')
  const data = searchParams.get('data')
  const tipo = searchParams.get('tipo')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 20

  let query = supabase
    .from('pedidos')
    .select('*, pedido_itens(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (codigo) query = query.ilike('codigo', `%${codigo}%`)
  if (status) query = query.eq('status', status)
  if (data) query = query.eq('data_entrega', data)
  if (tipo) query = query.eq('tipo', tipo)

  const { data: pedidos, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ pedidos, total: count, page, pageSize })
}
