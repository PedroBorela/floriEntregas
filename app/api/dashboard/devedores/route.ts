import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const STATUS_FINAIS = ['entregue', 'retirado', 'vendido']

export async function GET() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, tipo, status, cliente_nome, cliente_telefone, pago, pagamento_parcial, valor_pago, valor_total, data_entrega, created_at')
    .in('status', STATUS_FINAIS)
    .eq('pago', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const devedores = (data ?? []).map((p) => ({
    id: p.id,
    codigo: p.codigo,
    tipo: p.tipo,
    status: p.status,
    cliente_nome: p.cliente_nome,
    cliente_telefone: p.cliente_telefone,
    parcial: p.pagamento_parcial,
    valor_pago: p.valor_pago ?? 0,
    valor_total: p.valor_total,
    valor_devido: p.valor_total - (p.valor_pago ?? 0),
    data_entrega: p.data_entrega,
    created_at: p.created_at,
  }))

  const total_devido = devedores.reduce((s, p) => s + p.valor_devido, 0)

  return NextResponse.json({ devedores, total_devido })
}
