import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { nome, preco_padrao, imagem_url } = body

  const update: Record<string, unknown> = {}
  if (nome !== undefined) update.nome = String(nome).trim()
  if (preco_padrao !== undefined) update.preco_padrao = Number(preco_padrao)
  if (imagem_url !== undefined) update.imagem_url = imagem_url || null

  const { data, error } = await supabase
    .from('produtos_catalogo')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ produto: data })
}
