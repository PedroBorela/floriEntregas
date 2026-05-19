import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]
  const amanha = new Date(agora)
  amanha.setDate(amanha.getDate() + 1)
  const amanhaStr = amanha.toISOString().split('T')[0]

  const [{ data: pedidos }, { data: vendedoresData }] = await Promise.all([
    supabase
      .from('pedidos')
      .select('vendedor_id, valor_total')
      .gte('created_at', `${hoje}T00:00:00`)
      .lt('created_at', `${amanhaStr}T00:00:00`)
      .neq('status', 'cancelado'),
    supabase
      .from('vendedores')
      .select('id, nome'),
  ])

  if (!pedidos?.length) return NextResponse.json([])

  const vNames = new Map((vendedoresData ?? []).map(v => [v.id, v.nome as string]))
  const vMap = new Map<string, { nome: string; pedidos: number; receita: number }>()

  for (const p of pedidos) {
    const vid = (p.vendedor_id as string | null) ?? 'sem_vendedor'
    const cur = vMap.get(vid) ?? { nome: vNames.get(vid) ?? 'Sem Vendedor', pedidos: 0, receita: 0 }
    cur.pedidos++
    cur.receita += Number.parseFloat(String(p.valor_total ?? 0))
    vMap.set(vid, cur)
  }

  return NextResponse.json(
    [...vMap.entries()]
      .sort((a, b) => b[1].receita - a[1].receita)
      .map(([id, v]) => ({ id, ...v }))
  )
}
