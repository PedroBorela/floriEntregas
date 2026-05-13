import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { count } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Este cliente possui ${count} pedido${count > 1 ? 's' : ''}. Exclua os pedidos antes de excluir o cliente.` },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('clientes')
    .select('*, cliente_datas(*), enderecos(id, apelido, logradouro, numero, bairro, cidade, estado, cep, referencia, latitude, longitude, zona_frete_id), pedidos(id, codigo, status, valor_total, data_entrega, created_at)')
    .eq('id', id)
    .order('created_at', { referencedTable: 'pedidos', ascending: false })
    .single()

  if (error || !data) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  return NextResponse.json({ cliente: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { nome, telefone, whatsapp, preferencias, observacoes } = body

  const { data, error } = await supabase
    .from('clientes')
    .update({ nome, telefone, whatsapp: whatsapp || null, preferencias: preferencias || null, observacoes: observacoes || null })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ cliente: data })
}
