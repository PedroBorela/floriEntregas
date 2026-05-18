import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const STATUSES_ABERTOS = ['pendente', 'em_preparo', 'saiu_entrega']
const STATUSES_TERMINAIS = ['entregue', 'retirado', 'cancelado']

export async function GET() {
  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]

  // Início e fim do dia de hoje em UTC
  // O banco armazena updated_at em UTC; pedidos marcados hoje têm updated_at >= hoje 00:00 UTC
  const inicioHoje = `${hoje}T00:00:00.000Z`
  const amanha = new Date(agora)
  amanha.setUTCDate(amanha.getUTCDate() + 1)
  const inicioAmanha = `${amanha.toISOString().split('T')[0]}T00:00:00.000Z`

  const [{ data: abertos, error: e1 }, { data: terminais, error: e2 }, { count: atrasados, error: e3 }] =
    await Promise.all([
      // Pedidos em aberto: todos (sem filtro de data)
      supabase.from('pedidos').select('status').in('status', STATUSES_ABERTOS),

      // Pedidos terminais: filtro por updated_at hoje
      // Captura pedidos entregues/retirados/cancelados HOJE independente do data_entrega
      supabase
        .from('pedidos')
        .select('status')
        .in('status', STATUSES_TERMINAIS)
        .gte('updated_at', inicioHoje)
        .lt('updated_at', inicioAmanha),

      // Atrasados: abertos com data_entrega anterior a hoje
      supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .lt('data_entrega', hoje)
        .in('status', STATUSES_ABERTOS),
    ])

  if (e1 ?? e2 ?? e3) {
    const msg = (e1 ?? e2 ?? e3)?.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const contagens = {
    pendente: 0,
    em_preparo: 0,
    saiu_entrega: 0,
    entregue: 0,
    retirado: 0,
    cancelado: 0,
  }

  for (const p of abertos ?? []) {
    const s = p.status as keyof typeof contagens
    if (s in contagens) contagens[s]++
  }
  for (const p of terminais ?? []) {
    const s = p.status as keyof typeof contagens
    if (s in contagens) contagens[s]++
  }

  const total = (Object.entries(contagens) as [keyof typeof contagens, number][])
    .filter(([k]) => k !== 'cancelado')
    .reduce((s, [, v]) => s + v, 0)

  return NextResponse.json({ contagens, total, atrasados: atrasados ?? 0 })
}