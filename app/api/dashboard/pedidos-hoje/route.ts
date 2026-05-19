import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type ItemRow = { nome_produto: string; ordem: number }
export async function GET() {
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, tipo, status, cliente_nome, horario_entrega, endereco:enderecos(bairro), pedido_itens(nome_produto, ordem)')
    .eq('data_entrega', hoje)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pedidos = (data ?? []).map((p) => {
    const itens = (p.pedido_itens as ItemRow[] | null) ?? []
    const itens_resumo =
      [...itens]
        .sort((a, b) => a.ordem - b.ordem)
        .slice(0, 2)
        .map((i) => i.nome_produto)
        .join(', ') || '—'

    const endRaw = p.endereco as unknown
    const bairro: string | null = Array.isArray(endRaw)
      ? ((endRaw as { bairro: string | null }[])[0]?.bairro ?? null)
      : ((endRaw as { bairro: string | null } | null)?.bairro ?? null)

    return {
      id: p.id as string,
      codigo: p.codigo as string,
      tipo: p.tipo as 'entrega' | 'retirada',
      status: p.status as string,
      cliente_nome: p.cliente_nome as string,
      horario_entrega: p.horario_entrega as string | null,
      bairro,
      itens_resumo,
    }
  })

  pedidos.sort((a, b) => {
    const ha = a.horario_entrega ?? 'zzz'
    const hb = b.horario_entrega ?? 'zzz'
    const tA = ha.match(/^(\d{1,2}):(\d{2})/)
    const tB = hb.match(/^(\d{1,2}):(\d{2})/)
    if (tA && tB) {
      return (Number.parseInt(tA[1]) * 60 + Number.parseInt(tA[2])) - (Number.parseInt(tB[1]) * 60 + Number.parseInt(tB[2]))
    }
    return ha.localeCompare(hb, 'pt-BR')
  })

  return NextResponse.json(pedidos)
}