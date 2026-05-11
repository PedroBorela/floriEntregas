import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { PedidoStatus } from '@/lib/types'

const PROGRESSAO: Partial<Record<PedidoStatus, PedidoStatus>> = {
  pendente: 'em_preparo',
  em_preparo: 'saiu_entrega',
  saiu_entrega: 'entregue',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { acao } = body

  if (acao === 'avancar_status') {
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('status, tipo')
      .eq('id', id)
      .single()

    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

    const proximo = pedido.tipo === 'retirada' && pedido.status === 'saiu_entrega'
      ? 'retirado'
      : PROGRESSAO[pedido.status as PedidoStatus]

    if (!proximo) return NextResponse.json({ error: 'Status já é final' }, { status: 400 })

    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: proximo })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ pedido: data })
  }

  if (acao === 'cancelar') {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ pedido: data })
  }

  if (acao === 'marcar_impresso') {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ impresso: true, impresso_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ pedido: data })
  }

  if (acao === 'definir_status') {
    const { status } = body
    const validos: PedidoStatus[] = ['pendente', 'em_preparo', 'saiu_entrega', 'entregue', 'retirado', 'cancelado']
    if (!validos.includes(status)) return NextResponse.json({ error: 'Status inválido' }, { status: 400 })

    const { data, error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ pedido: data })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}
