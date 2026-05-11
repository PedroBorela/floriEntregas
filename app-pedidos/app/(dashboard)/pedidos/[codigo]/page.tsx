import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/ui/StatusBadge'
import StatusDropdown from '@/components/pedidos/StatusDropdown'
import { formatarMoeda, formatarData, formatarDataHora } from '@/lib/formatters'
import Link from 'next/link'
import type { Pedido, PedidoItem } from '@/lib/types'

interface PageProps {
  params: Promise<{ codigo: string }>
}

export default async function DetalhePedidoPage({ params }: PageProps) {
  const { codigo } = await params

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('*, pedido_itens(*)')
    .eq('codigo', codigo.toUpperCase())
    .single()

  if (error || !pedido) notFound()

  const p = pedido as Pedido & { pedido_itens: PedidoItem[] }
  const itens = p.pedido_itens ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/pedidos" className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</Link>
        <h1 className="text-xl font-bold text-green-900 font-mono">{p.codigo}</h1>
        <StatusBadge status={p.status} />
      </div>

      <div className="section-card">
        <StatusDropdown pedidoId={p.id} statusAtual={p.status} tipo={p.tipo} />
      </div>

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
          {itens.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantidade}x {item.nome_produto}</span>
              <span className="text-gray-600">{formatarMoeda(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between font-semibold">
          <span>Total dos produtos</span>
          <span>{formatarMoeda(p.valor_produtos)}</span>
        </div>
        {p.valor_frete > 0 && (
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Frete</span>
            <span>{formatarMoeda(p.valor_frete)}</span>
          </div>
        )}
        <div className="flex justify-between text-green-900 font-bold text-lg mt-2">
          <span>Total</span>
          <span>{formatarMoeda(p.valor_total)}</span>
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">Agendamento</h2>
        <p className="text-sm text-gray-700">
          <span className="capitalize">{p.tipo}</span>
          {p.data_entrega && ` em ${formatarData(p.data_entrega)}`}
          {p.horario_entrega && ` às ${p.horario_entrega.slice(0, 5)}`}
        </p>
      </div>

      <div className="section-card">
        <h2 className="section-title">Pagamento</h2>
        <div className="flex gap-3 flex-wrap text-sm">
          <span className={`px-2 py-1 rounded-full ${p.pago ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
            {p.pago ? 'Pago' : 'Não pago'}
          </span>
          {p.pagamento_tipo && (
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
              {p.pagamento_tipo.replace('_', ' ')}
            </span>
          )}
          {p.pagamento_parcial && (
            <span className="text-gray-500">Pago: {formatarMoeda(p.valor_pago)}</span>
          )}
        </div>
      </div>

      {p.tem_cartao && p.mensagem_cartao && (
        <div className="section-card">
          <h2 className="section-title">Cartão</h2>
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
