import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params

  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, status, tipo, cliente_nome, destinatario:destinatarios(nome, telefone), endereco:enderecos(logradouro, numero, bairro, cidade, estado, referencia), data_entrega, horario_entrega')
    .eq('codigo', codigo.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const dest = Array.isArray(data.destinatario) ? data.destinatario[0] : data.destinatario
  const end = Array.isArray(data.endereco) ? data.endereco[0] : data.endereco

  return NextResponse.json({
    pedido: {
      codigo: data.codigo,
      status: data.status,
      tipo: data.tipo,
      cliente_nome: data.cliente_nome,
      destinatario_nome: dest?.nome ?? null,
      data_entrega: data.data_entrega,
      horario_entrega: data.horario_entrega,
      logradouro: end?.logradouro ?? null,
      numero: end?.numero ?? null,
      bairro: end?.bairro ?? null,
      cidade: end?.cidade ?? null,
      referencia: end?.referencia ?? null,
    },
  })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const { codigo } = await params

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('id, status')
    .eq('codigo', codigo.toUpperCase())
    .single()

  if (error || !pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

  const STATUS_FINAIS = ['entregue', 'retirado', 'cancelado']
  if (STATUS_FINAIS.includes(pedido.status)) {
    return NextResponse.json({ error: 'Pedido já finalizado' }, { status: 400 })
  }

  const statusAnterior = pedido.status

  const { error: updErr } = await supabase
    .from('pedidos')
    .update({ status: 'entregue' })
    .eq('id', pedido.id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

  await supabase.from('pedido_status_log').insert({
    pedido_id: pedido.id,
    status_anterior: statusAnterior,
    status_novo: 'entregue',
    observacao: 'Confirmado via QR Code pelo entregador',
  })

  return NextResponse.json({ ok: true })
}
