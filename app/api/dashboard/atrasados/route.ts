import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type ItemRow = { nome_produto: string; ordem: number }

const STATUSES_ABERTOS = ['pendente', 'em_preparo', 'saiu_entrega']

export async function GET() {
  const hoje = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, tipo, status, cliente_nome, data_entrega, horario_entrega, endereco:enderecos(bairro), pedido_itens(nome_produto, ordem)')
    .lt('data_entrega', hoje)
    .in('status', STATUSES_ABERTOS)
    .order('data_entrega', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pedidos = (data ?? []).map((p) => {
    const itens = (p.pedido_itens as ItemRow[] | null) ?? []
    const itens_resumo =
      itens
        .sort((a, b) => a.ordem - b.ordem)
        .slice(0, 2)
        .map((i) => i.nome_produto)
        .join(', ') || '—'

    const endRaw = p.endereco as unknown
    const bairro: string | null = Array.isArray(endRaw)
      ? ((endRaw as { bairro: string | null }[])[0]?.bairro ?? null)
      : ((endRaw as { bairro: string | null } | null)?.bairro ?? null)

    const dataEntrega = p.data_entrega as string
    const diasAtraso = Math.floor(
      (new Date(hoje).getTime() - new Date(dataEntrega).getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      id: p.id as string,
      codigo: p.codigo as string,
      tipo: p.tipo as 'entrega' | 'retirada',
      status: p.status as string,
      cliente_nome: p.cliente_nome as string,
      data_entrega: dataEntrega,
      horario_entrega: p.horario_entrega as string | null,
      bairro,
      itens_resumo,
      dias_atraso: diasAtraso,
    }
  })

  return NextResponse.json(pedidos)
}