import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/ui/StatusBadge'
import StatusDropdown from '@/components/pedidos/StatusDropdown'
import BotaoImprimir from '@/components/impressao/BotaoImprimir'
import BotaoCopiar from '@/components/ui/BotaoCopiar'
import BotaoCancelar from '@/components/pedidos/BotaoCancelar'
import BotaoEditar from '@/components/pedidos/BotaoEditar'
import BotaoWhatsApp from '@/components/pedidos/BotaoWhatsApp'
import { formatarMoeda, formatarData, formatarDataHora } from '@/lib/formatters'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/lib/types'

interface ItemDetalhado extends PedidoItem {
  produtos_catalogo?: { categoria: string | null; imagem_url: string | null } | null
}

const CORES_CATEGORIA: Record<string, string> = {
  Vaso:      'bg-green-100 text-green-800',
  Orquídea:  'bg-purple-100 text-purple-800',
  Folhagem:  'bg-emerald-100 text-emerald-800',
  Flor:      'bg-pink-100 text-pink-800',
  Árvore:    'bg-lime-100 text-lime-800',
  Corte:     'bg-orange-100 text-orange-800',
  Especiais: 'bg-yellow-100 text-yellow-800',
}

interface PageProps {
  params: Promise<{ codigo: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function DetalhePedidoPage({ params, searchParams }: PageProps) {
  const { codigo } = await params
  const { from } = await searchParams
  const voltarHref = from?.startsWith('/') ? from : '/pedidos'

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('*, pedido_itens(*, produtos_catalogo(categoria, imagem_url))')
    .eq('codigo', codigo.toUpperCase())
    .single()

  if (error || !pedido) notFound()

  const p = pedido as Pedido
  const itens = (p.pedido_itens ?? []) as ItemDetalhado[]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Link href={voltarHref} className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</Link>
        <h1 className="text-xl font-bold text-green-900 font-mono">{p.codigo}</h1>
        <StatusBadge status={p.status} />
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <BotaoEditar pedido={p as Pedido} />
          <BotaoCancelar pedidoId={p.id} codigo={p.codigo} status={p.status} />
          <BotaoImprimir pedido={{ ...p, pedido_itens: itens as PedidoItem[] }} />
        </div>
      </div>

      {p.status === 'cancelado' && p.motivo_cancelamento && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700 mb-1">Motivo do cancelamento</p>
          <p className="text-sm text-red-600">{p.motivo_cancelamento}</p>
        </div>
      )}

      <div className="section-card">
        <StatusDropdown pedidoId={p.id} statusAtual={p.status} tipo={p.tipo} />
      </div>

      {p.status !== 'cancelado' && (
        <div className="section-card flex flex-wrap gap-2">
          <BotaoWhatsApp pedido={p as Pedido} tipo="confirmacao" />
          {(p.status === 'saiu_entrega' || p.status === 'entregue' || p.status === 'retirado') && (
            <BotaoWhatsApp pedido={p as Pedido} tipo="saiu_entrega" />
          )}
        </div>
      )}

      <div className="section-card">
        <h2 className="section-title">Cliente</h2>
        <p className="font-medium">{p.cliente_nome}</p>
        <p className="text-gray-500 text-sm">{p.cliente_telefone}</p>
      </div>

      {(p.destinatario_nome || p.logradouro) && (
        <div className="section-card">
          <h2 className="section-title">
            {p.tipo === 'entrega' ? 'Destinatário e Endereço' : 'Quem vai retirar'}
          </h2>
          {p.destinatario_nome && <p className="font-medium">{p.destinatario_nome}</p>}
          {p.destinatario_telefone && <p className="text-gray-500 text-sm">{p.destinatario_telefone}</p>}
          {p.logradouro && (
            <p className="text-gray-700 text-sm mt-2">
              {p.logradouro}{p.numero ? `, ${p.numero}` : ''} — {p.bairro} — {p.cidade}/{p.estado}
            </p>
          )}
          {p.referencia && <p className="text-gray-500 text-xs mt-1">Ref: {p.referencia}</p>}
        </div>
      )}

      <div className="section-card">
        <h2 className="section-title">Produtos</h2>
        <div className="space-y-2">
          {itens.map((item) => {
            const cat = item.produtos_catalogo?.categoria
            const cor = cat ? (CORES_CATEGORIA[cat] ?? 'bg-gray-100 text-gray-700') : null
            return (
              <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-700 truncate">{item.quantidade}× {item.nome_produto}</span>
                  {cat && cor && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${cor}`}>{cat}</span>
                  )}
                </div>
                <span className="text-gray-600 shrink-0">{formatarMoeda(item.subtotal)}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal produtos</span>
            <span>{formatarMoeda(p.valor_produtos)}</span>
          </div>
          {p.valor_frete > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Frete</span>
              <span>{formatarMoeda(p.valor_frete)}</span>
            </div>
          )}
          <div className="flex justify-between text-green-900 font-bold text-lg pt-1 border-t border-gray-100">
            <span>Total</span>
            <span>{formatarMoeda(p.valor_total)}</span>
          </div>
          {p.pagamento_parcial && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Valor pago</span>
                <span>{formatarMoeda(p.valor_pago)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-orange-600">
                <span>Restante a pagar</span>
                <span>{formatarMoeda(Math.max(0, p.valor_total - p.valor_pago))}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">Agendamento</h2>
        <p className="text-sm text-gray-700">
          <span className="capitalize">{p.tipo}</span>
          {p.data_entrega && ` em ${formatarData(p.data_entrega)}`}
          {p.horario_entrega && ` — ${p.horario_entrega}`}
        </p>
      </div>

      <div className="section-card">
        <h2 className="section-title">Pagamento</h2>
        <div className="flex gap-2 flex-wrap text-sm mb-3">
          <span className={`px-2.5 py-1 rounded-full font-medium ${
            p.pagamento_parcial
              ? 'bg-orange-100 text-orange-700'
              : p.pago
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-700'
          }`}>
            {p.pagamento_parcial ? 'Parcialmente pago' : p.pago ? 'Pago' : 'Não pago'}
          </span>
          {p.pagamento_tipo && (
            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
              {p.pagamento_tipo.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {p.pagamento_parcial && (
          <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total do pedido</span>
              <span className="font-medium text-gray-700">{formatarMoeda(p.valor_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Valor pago</span>
              <span className="font-medium text-gray-700">{formatarMoeda(p.valor_pago)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-orange-200 pt-2">
              <span className="text-orange-700">Restante a pagar</span>
              <span className="text-orange-700">{formatarMoeda(Math.max(0, p.valor_total - p.valor_pago))}</span>
            </div>
          </div>
        )}
      </div>

      {p.tem_cartao && p.mensagem_cartao && (
        <div className="section-card">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-base font-semibold text-green-900">Cartão</h2>
            <BotaoCopiar texto={p.mensagem_cartao} />
          </div>
          <p className="text-gray-700 text-sm italic">"{p.mensagem_cartao}"</p>
        </div>
      )}

      {p.observacoes && (
        <div className="section-card">
          <h2 className="section-title">Observações</h2>
          <p className="text-gray-700 text-sm">{p.observacoes}</p>
        </div>
      )}

      <div className="section-card text-xs text-gray-400">
        <p>Criado em: {formatarDataHora(p.created_at)}</p>
        <p>Atualizado em: {formatarDataHora(p.updated_at)}</p>
      </div>
    </div>
  )
}
