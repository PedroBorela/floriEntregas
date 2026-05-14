import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { apelido, logradouro, numero, bairro, cidade, estado, cep, referencia } = body

  const { data, error } = await supabase
    .from('enderecos')
    .update({
      apelido: apelido?.trim() || null,
      logradouro: logradouro?.trim() || null,
      numero: numero?.trim() || null,
      bairro: bairro?.trim() || null,
      cidade: cidade?.trim() || null,
      estado: estado?.trim() || 'MG',
      cep: cep?.trim() || null,
      referencia: referencia?.trim() || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ endereco: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await supabase.from('enderecos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
