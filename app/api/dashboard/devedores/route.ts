import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const STATUS_FINAIS = ['entregue', 'retirado', 'vendido']

export async function GET() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, codigo, tipo, status, cliente_nome, cliente_telefone, valor_total, data_entrega, created_at, pagamento:pagamentos(pago, parcial, valor_pago)')
    .in('status', STATUS_FINAIS)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const devedores = (data ?? [])
    .map((p) => {
      const pag = Array.isArray(p.pagamento) ? p.pagamento[0] : p.pagamento
      return {
        id: p.id,
        codigo: p.codigo,
        tipo: p.tipo,
        status: p.status,
        cliente_nome: p.cliente_nome,
        cliente_telefone: p.cliente_telefone,
        parcial: pag?.parcial ?? false,
        valor_pago: pag?.valor_pago ?? 0,
        valor_total: p.valor_total,
        valor_devido: p.valor_total - (pag?.valor_pago ?? 0),
        pago: pag?.pago ?? false,
        data_entrega: p.data_entrega,
        created_at: p.created_at,
      }
    })
    .filter((p) => !p.pago)
    .map(({ pago: _, ...rest }) => rest)

  const total_devido = devedores.reduce((s, p) => s + p.valor_devido, 0)

  return NextResponse.json({ devedores, total_devido })
}