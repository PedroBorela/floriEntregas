import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatarMoeda, formatarDataHora, formatarData } from '@/lib/formatters'
import type { Pedido } from '@/lib/types'

const STATUS_ATIVOS = ['pendente', 'em_preparo', 'saiu_entrega']

function calcularAlerta(pedido: Pedido): 'atrasado' | 'hoje' | null {
  if (!pedido.data_entrega) return null
  if (!STATUS_ATIVOS.includes(pedido.status)) return null

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const entrega = new Date(pedido.data_entrega + 'T00:00:00')

  if (entrega < hoje) return 'atrasado'
  if (entrega.getTime() === hoje.getTime()) return 'hoje'
  return null
}

export default function CardPedido({ pedido }: { pedido: Pedido }) {
  const alerta = calcularAlerta(pedido)

  const bordaClasse = alerta === 'atrasado'
    ? 'border-red-300 bg-red-50'
    : 'border-gray-100 bg-white'

  return (
    <Link href={`/pedidos/${pedido.codigo}`} className="block">
      <div className={`rounded-xl border shadow-sm p-4 hover:shadow-md transition ${bordaClasse}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono font-semibold text-green-900 text-sm">{pedido.codigo}</p>
              {alerta === 'atrasado' && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">Atrasado</span>
              )}
              {alerta === 'hoje' && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Hoje</span>
              )}
            </div>
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
            <span>📅 {formatarData(pedido.data_entrega)}{pedido.horario_entrega ? ` — ${pedido.horario_entrega}` : ''}</span>
          )}
          <span className="ml-auto">{formatarDataHora(pedido.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
