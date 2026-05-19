import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cliente_id } = await params
  const { nome, data, vendedor_id } = await req.json()

  if (!nome?.trim() || !data) {
    return NextResponse.json({ error: 'Nome e data são obrigatórios' }, { status: 400 })
  }

  const { data: criada, error } = await supabase
    .from('cliente_datas')
    .insert({ cliente_id, nome: nome.trim(), data, vendedor_id: vendedor_id ?? null })
    .select('*, vendedor:vendedores(nome)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const v = criada.vendedor as any
  const vnome = v ? (Array.isArray(v) ? v[0]?.nome : v.nome) : null
  
  const responseData = { ...criada, vendedor_nome: vnome }
  delete responseData.vendedor

  return NextResponse.json({ data: responseData }, { status: 201 })
}