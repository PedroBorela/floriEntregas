import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { PedidoStatus, PagamentoTipo } from '@/lib/types'

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
    const { motivo_cancelamento } = body
    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado', motivo_cancelamento: motivo_cancelamento ?? null })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ pedido: data })
  }

  if (acao === 'marcar_whatsapp') {
    const { campo } = body
    const campos_validos = ['whatsapp_confirmacao', 'whatsapp_saiu']
    if (!campos_validos.includes(campo)) return NextResponse.json({ error: 'Campo inválido' }, { status: 400 })

    const agora = new Date().toISOString()
    const update = campo === 'whatsapp_confirmacao'
      ? { whatsapp_confirmacao_enviado: true, whatsapp_confirmacao_em: agora }
      : { whatsapp_saiu_enviado: true, whatsapp_saiu_em: agora }

    const { data, error } = await supabase
      .from('pedidos')
      .update(update)
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

  if (acao === 'editar') {
    const {
      itens, cliente_nome, cliente_telefone, destinatario_nome, destinatario_telefone,
      cep, logradouro, numero, bairro, cidade, estado, referencia, latitude, longitude,
      zona_frete_id, data_entrega, horario_entrega, tem_cartao, mensagem_cartao,
      pago, pagamento_tipo, pagamento_parcial, valor_pago,
      valor_produtos, valor_frete, valor_total, observacoes,
    } = body as {
      itens: { nome_produto: string; valor_unitario: number; quantidade: number; observacao?: string }[]
      cliente_nome: string; cliente_telefone: string
      destinatario_nome: string | null; destinatario_telefone: string | null
      cep: string | null; logradouro: string | null; numero: string | null
      bairro: string | null; cidade: string; estado: string
      referencia: string | null; latitude: number | null; longitude: number | null
      zona_frete_id: string | null; data_entrega: string | null; horario_entrega: string | null
      tem_cartao: boolean; mensagem_cartao: string | null
      pago: boolean; pagamento_tipo: PagamentoTipo | null; pagamento_parcial: boolean; valor_pago: number
      valor_produtos: number; valor_frete: number; valor_total: number
      observacoes: string | null
    }

    const { error: updErr } = await supabase
      .from('pedidos')
      .update({
        cliente_nome, cliente_telefone, destinatario_nome, destinatario_telefone,
        cep, logradouro, numero, bairro, cidade, estado, referencia, latitude, longitude,
        zona_frete_id, data_entrega, horario_entrega, tem_cartao, mensagem_cartao,
        pago, pagamento_tipo, pagamento_parcial, valor_pago,
        valor_produtos, valor_frete, valor_total, observacoes,
      })
      .eq('id', id)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

    // Substitui os itens
    await supabase.from('pedido_itens').delete().eq('pedido_id', id)

    if (itens && itens.length > 0) {
      const linhas = itens.map((item, idx) => ({
        pedido_id: id,
        nome_produto: item.nome_produto,
        valor_unitario: item.valor_unitario,
        quantidade: item.quantidade,
        observacao: item.observacao ?? null,
        ordem: idx,
      }))
      const { error: itensErr } = await supabase.from('pedido_itens').insert(linhas)
      if (itensErr) return NextResponse.json({ error: itensErr.message }, { status: 400 })
    }

    const { data: pedidoAtualizado } = await supabase
      .from('pedidos')
      .select('*, pedido_itens(*)')
      .eq('id', id)
      .single()

    return NextResponse.json({ pedido: pedidoAtualizado })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}
