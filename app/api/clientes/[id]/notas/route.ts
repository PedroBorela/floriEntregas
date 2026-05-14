import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { tipo, texto } = await req.json()

  if (!['preferencia', 'observacao'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  if (!texto?.trim()) {
    return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cliente_notas')
    .insert({ cliente_id: id, tipo, texto: texto.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ nota: data }, { status: 201 })
}
