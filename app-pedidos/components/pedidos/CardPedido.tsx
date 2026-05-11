import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatarMoeda, formatarDataHora, formatarData } from '@/lib/formatters'
import type { Pedido } from '@/lib/types'

export default function CardPedido({ pedido }: { pedido: Pedido }) {
  return (
    <Link href={`/pedidos/${pedido.codigo}`} className="block">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-green-200 transition">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono font-semibold text-green-900 text-sm">{pedido.codigo}</p>
            <p className="text-gray-800 font-medium mt-0.5">{pedido.cliente_nome}</p>
            <p className="text-gray-400 text-xs mt-0.5">{pedido.cliente_telefone}</p>
          </div>
          <div className="text-right shrink-0">
            <StatusBadge status={pedido.status} />
            <p className="text-green-900 font-semibold mt-1">{formatarMoeda(pedido.valor_total)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span className="uppercase tracking-wide">{pedido.tipo}</span>
          {pedido.data_entrega && (
            <span>📅 {formatarData(pedido.data_entrega)}{pedido.horario_entrega ? ` às ${pedido.horario_entrega.slice(0, 5)}` : ''}</span>
          )}
          <span className="ml-auto">{formatarDataHora(pedido.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
