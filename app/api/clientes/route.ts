import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const busca = searchParams.get('busca')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 30

  const ordem = searchParams.get('ordem') ?? 'nome'
  const ordemConfig = ordem === 'recente'
    ? { column: 'created_at', ascending: false }
    : { column: 'nome', ascending: true }

  let query = supabase
    .from('clientes')
    .select('*, cliente_datas(*)', { count: 'exact' })
    .order(ordemConfig.column, { ascending: ordemConfig.ascending })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%,whatsapp.ilike.%${busca}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ clientes: data, total: count, page, pageSize })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, telefone, whatsapp, preferencias, observacoes } = body

  if (!nome?.trim() || !telefone?.trim()) {
    return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({ nome: nome.trim(), telefone: telefone.trim(), whatsapp: whatsapp || null, preferencias: preferencias || null, observacoes: observacoes || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ cliente: data }, { status: 201 })
}
