import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('vendedores')
    .select('*')
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ vendedores: data })
}

export async function POST(req: NextRequest) {
  const { nome } = await req.json()
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const { data, error } = await supabase
    .from('vendedores')
    .insert({ nome: nome.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ vendedor: data }, { status: 201 })
}
