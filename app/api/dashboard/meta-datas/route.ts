import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const META = 10

export async function GET() {
  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]
  const inicioHoje = `${hoje}T00:00:00.000Z`
  const amanha = new Date(agora)
  amanha.setUTCDate(amanha.getUTCDate() + 1)
  const inicioAmanha = `${amanha.toISOString().split('T')[0]}T00:00:00.000Z`

  const { data, error } = await supabase
    .from('cliente_datas')
    .select('id, vendedor_id, vendedor:vendedores(nome)')
    .gte('created_at', inicioHoje)
    .lt('created_at', inicioAmanha)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const registros = data ?? []

  // Agrupa por vendedor
  const porVendedor: Record<string, { nome: string; total: number }> = {}
  let semVendedor = 0

  for (const r of registros) {
    const vid = r.vendedor_id as string | null
    const v = r.vendedor as any
    const vnome = typeof v === 'object' && v !== null ? (Array.isArray(v) ? v[0]?.nome : v.nome) : null
    if (vid && vnome) {
      if (!porVendedor[vid]) porVendedor[vid] = { nome: vnome, total: 0 }
      porVendedor[vid].total++
    } else {
      semVendedor++
    }
  }

  const ranking = Object.entries(porVendedor)
    .map(([vendedor_id, { nome, total }]) => ({ vendedor_id, nome, total }))
    .sort((a, b) => b.total - a.total)

  if (semVendedor > 0) {
    ranking.push({ vendedor_id: '', nome: 'Sem vendedor', total: semVendedor })
  }

  return NextResponse.json({
    meta: META,
    total: registros.length,
    pct: Math.min(100, Math.round((registros.length / META) * 100)),
    bateu_meta: registros.length >= META,
    por_vendedor: ranking,
  })
}