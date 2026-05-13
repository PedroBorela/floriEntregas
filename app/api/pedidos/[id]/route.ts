import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { PedidoStatus, PagamentoTipo } from '@/lib/types'

const JOIN_SELECT = '*, pedido_itens(*), endereco:enderecos(*), destinatario:destinatarios(*), pagamento:pagamentos(*), notificacoes:notificacoes_whatsapp(*)'

function aplanarPedido(p: Record<string, any>) {
  const end = p.endereco as Record<string, any> | null
  const dest = p.destinatario as Record<string, any> | null
  const pag = Array.isArray(p.pagamento) ? p.pagamento[0] as Record<string, any> | undefined : null
  const notifs: Record<string, any>[] = Array.isArray(p.notificacoes) ? p.notificacoes : []
  const { endereco, destinatario, pagamento, notificacoes, ...rest } = p
  return {
    ...rest,
    cep: end?.cep ?? null,
    logradouro: end?.logradouro ?? null,
    numero: end?.numero ?? null,
    bairro: end?.bairro ?? null,
    cidade: end?.cidade ?? 'Manhuaçu',
    estado: end?.estado ?? 'MG',
    referencia: end?.referencia ?? null,
    latitude: end?.latitude ?? null,
    longitude: end?.longitude ?? null,
    destinatario_nome: dest?.nome ?? null,
    destinatario_telefone: dest?.telefone ?? null,
    pago: pag?.pago ?? false,
    pagamento_tipo: pag?.tipo ?? null,
    pagamento_parcial: pag?.parcial ?? false,
    valor_pago: pag?.valor_pago ?? 0,
    whatsapp_confirmacao_enviado: notifs.some(n => n.tipo === 'confirmacao' && n.enviado),
    whatsapp_saiu_enviado: notifs.some(n => n.tipo === 'saiu_entrega' && n.enviado),
  }
}

const PROGRESSAO: Partial<Record<PedidoStatus, PedidoStatus>> = {
  pendente: 'em_preparo',
  em_preparo: 'saiu_entrega',
  saiu_entrega: 'entregue',
}

async function logStatus(pedido_id: string, status_anterior: string | null, status_novo: string, observacao?: string) {
  await supabase.from('pedido_status_log').insert({ pedido_id, status_anterior, status_novo, observacao: observacao ?? null })
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
    await logStatus(id, pedido.status, proximo)
    return NextResponse.json({ pedido: data })
  }

  if (acao === 'cancelar') {
    const { motivo_cancelamento } = body

    const { data: atual } = await supabase.from('pedidos').select('status').eq('id', id).single()

    const { data, error } = await supabase
      .from('pedidos')
      .update({ status: 'cancelado', motivo_cancelamento: motivo_cancelamento ?? null })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await logStatus(id, atual?.status ?? null, 'cancelado', motivo_cancelamento)
    return NextResponse.json({ pedido: data })
  }

  if (acao === 'marcar_whatsapp') {
    const { campo } = body
    const campos_validos = ['whatsapp_confirmacao', 'whatsapp_saiu']
    if (!campos_validos.includes(campo)) return NextResponse.json({ error: 'Campo inválido' }, { status: 400 })

    const agora = new Date().toISOString()
    const tipo_notif = campo === 'whatsapp_confirmacao' ? 'confirmacao' : 'saiu_entrega'

    const { data: pedido } = await supabase.from('pedidos').select('cliente_telefone').eq('id', id).single()

    const { error } = await supabase.from('notificacoes_whatsapp').insert({
      pedido_id: id,
      tipo: tipo_notif,
      destinatario_telefone: pedido?.cliente_telefone ?? '',
      enviado: true,
      enviado_em: agora,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
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

    const { data: atual } = await supabase.from('pedidos').select('status').eq('id', id).single()

    const { data, error } = await supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await logStatus(id, atual?.status ?? null, status)
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

    // busca pedido atual para saber endereco_id e destinatario_id existentes
    const { data: pedidoAtual } = await supabase
      .from('pedidos')
      .select('endereco_id, destinatario_id, cliente_id')
      .eq('id', id)
      .single()

    // atualiza ou cria endereco
    let endereco_id = pedidoAtual?.endereco_id ?? null
    if (logradouro) {
      const endFields = {
        cep: cep ?? null, logradouro, numero: numero ?? null,
        bairro: bairro ?? '', cidade: cidade ?? 'Manhuaçu', estado: estado ?? 'MG',
        referencia: referencia ?? null, latitude: latitude ?? null, longitude: longitude ?? null,
      }
      if (endereco_id) {
        await supabase.from('enderecos').update(endFields).eq('id', endereco_id)
      } else if (pedidoAtual?.cliente_id) {
        const { data: novoEnd } = await supabase
          .from('enderecos')
          .insert({ cliente_id: pedidoAtual.cliente_id, ...endFields })
          .select('id').single()
        if (novoEnd) endereco_id = novoEnd.id
      }
    }

    // atualiza ou cria destinatario
    let destinatario_id = pedidoAtual?.destinatario_id ?? null
    if (destinatario_nome && destinatario_nome !== cliente_nome) {
      const destFields = { nome: destinatario_nome, telefone: destinatario_telefone ?? null }
      if (destinatario_id) {
        await supabase.from('destinatarios').update(destFields).eq('id', destinatario_id)
      } else if (pedidoAtual?.cliente_id) {
        const { data: novoDest } = await supabase
          .from('destinatarios')
          .insert({ cliente_id: pedidoAtual.cliente_id, ...destFields })
          .select('id').single()
        if (novoDest) destinatario_id = novoDest.id
      }
    } else if (!destinatario_nome) {
      destinatario_id = null
    }

    // atualiza pedido — apenas campos não-normalizados + FKs
    const { error: updErr } = await supabase
      .from('pedidos')
      .update({
        cliente_nome, cliente_telefone,
        zona_frete_id, data_entrega, horario_entrega,
        tem_cartao, mensagem_cartao,
        valor_produtos, valor_frete, valor_total,
        observacoes,
        endereco_id, destinatario_id,
      })
      .eq('id', id)

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

    // atualiza pagamento (upsert pelo pedido_id)
    const { data: pgExistente } = await supabase
      .from('pagamentos')
      .select('id')
      .eq('pedido_id', id)
      .maybeSingle()

    if (pgExistente) {
      await supabase.from('pagamentos').update({
        tipo: pagamento_tipo ?? 'pix',
        valor: valor_total,
        pago,
        parcial: pagamento_parcial,
        valor_pago: valor_pago ?? 0,
        pago_em: pago ? new Date().toISOString() : null,
      }).eq('id', pgExistente.id)
    } else {
      await supabase.from('pagamentos').insert({
        pedido_id: id,
        tipo: pagamento_tipo ?? 'pix',
        valor: valor_total,
        pago,
        parcial: pagamento_parcial,
        valor_pago: valor_pago ?? 0,
        pago_em: pago ? new Date().toISOString() : null,
      })
    }

    // substitui itens
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
      .select(JOIN_SELECT)
      .eq('id', id)
      .single()

    return NextResponse.json({ pedido: pedidoAtualizado ? aplanarPedido(pedidoAtualizado) : null })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}
