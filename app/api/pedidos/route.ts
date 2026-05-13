import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { itens, ...pedidoData } = body

  // 1. upsert cliente
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes')
    .upsert(
      { nome: pedidoData.cliente_nome, telefone: pedidoData.cliente_telefone },
      { onConflict: 'telefone' }
    )
    .select('id')
    .single()

  if (clienteError) return NextResponse.json({ error: clienteError.message }, { status: 400 })

  // 2. usar endereco existente ou criar novo
  let endereco_id: string | null = pedidoData.endereco_id ?? null
  if (endereco_id) {
    // atualiza apenas o apelido no endereço existente
    await supabase
      .from('enderecos')
      .update({ apelido: pedidoData.endereco_apelido ?? null })
      .eq('id', endereco_id)
  } else if (pedidoData.logradouro) {
    const { data: endereco } = await supabase
      .from('enderecos')
      .insert({
        cliente_id: cliente.id,
        apelido: pedidoData.endereco_apelido ?? null,
        cep: pedidoData.cep ?? null,
        logradouro: pedidoData.logradouro,
        numero: pedidoData.numero ?? null,
        bairro: pedidoData.bairro ?? '',
        cidade: pedidoData.cidade ?? 'Manhuaçu',
        estado: pedidoData.estado ?? 'MG',
        referencia: pedidoData.referencia ?? null,
        latitude: pedidoData.latitude ?? null,
        longitude: pedidoData.longitude ?? null,
      })
      .select('id')
      .single()
    if (endereco) endereco_id = endereco.id
  }

  // 3. criar destinatario (se nome diferente do cliente)
  let destinatario_id: string | null = null
  if (pedidoData.destinatario_nome && pedidoData.destinatario_nome !== pedidoData.cliente_nome) {
    const { data: dest } = await supabase
      .from('destinatarios')
      .insert({
        cliente_id: cliente.id,
        nome: pedidoData.destinatario_nome,
        telefone: pedidoData.destinatario_telefone ?? null,
      })
      .select('id')
      .single()
    if (dest) destinatario_id = dest.id
  }

  // 4. criar pedido — apenas campos não-normalizados
  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert({
      tipo: pedidoData.tipo,
      cliente_nome: pedidoData.cliente_nome,
      cliente_telefone: pedidoData.cliente_telefone,
      zona_frete_id: pedidoData.zona_frete_id ?? null,
      data_entrega: pedidoData.data_entrega ?? null,
      horario_entrega: pedidoData.horario_entrega ?? null,
      tem_cartao: pedidoData.tem_cartao ?? false,
      mensagem_cartao: pedidoData.mensagem_cartao ?? null,
      valor_produtos: pedidoData.valor_produtos,
      valor_frete: pedidoData.valor_frete,
      valor_total: pedidoData.valor_total,
      observacoes: pedidoData.observacoes ?? null,
      codigo: '',
      cliente_id: cliente.id,
      endereco_id,
      destinatario_id,
    })
    .select()
    .single()

  if (pedidoError) return NextResponse.json({ error: pedidoError.message }, { status: 400 })

  // 5. criar itens
  if (itens && itens.length > 0) {
    const linhas = itens.map((item: { nome_produto: string; valor_unitario: number; quantidade: number; observacao?: string }, idx: number) => ({
      pedido_id: pedido.id,
      nome_produto: item.nome_produto,
      valor_unitario: item.valor_unitario,
      quantidade: item.quantidade,
      observacao: item.observacao ?? null,
      ordem: idx,
    }))
    const { error: itensError } = await supabase.from('pedido_itens').insert(linhas)
    if (itensError) return NextResponse.json({ error: itensError.message }, { status: 400 })
  }

  // 6. criar pagamento
  await supabase.from('pagamentos').insert({
    pedido_id: pedido.id,
    tipo: pedidoData.pagamento_tipo ?? 'pix',
    valor: pedidoData.valor_total,
    pago: pedidoData.pago ?? false,
    parcial: pedidoData.pagamento_parcial ?? false,
    valor_pago: pedidoData.valor_pago ?? 0,
    pago_em: pedidoData.pago ? new Date().toISOString() : null,
  })

  return NextResponse.json({ pedido }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const codigo = searchParams.get('codigo')
  const busca = searchParams.get('busca')
  const status = searchParams.get('status')
  const data = searchParams.get('data')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')
  const tipo = searchParams.get('tipo')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 20

  let query = supabase
    .from('pedidos')
    .select('*, pedido_itens(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (codigo) query = query.ilike('codigo', `%${codigo}%`)
  if (busca) query = query.or(`cliente_nome.ilike.%${busca}%,cliente_telefone.ilike.%${busca}%`)
  if (status) query = query.eq('status', status)
  if (data) query = query.eq('data_entrega', data)
  if (dataInicio) query = query.gte('data_entrega', dataInicio)
  if (dataFim) query = query.lte('data_entrega', dataFim)
  if (tipo) query = query.eq('tipo', tipo)

  const { data: pedidos, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ pedidos, total: count, page, pageSize })
}
