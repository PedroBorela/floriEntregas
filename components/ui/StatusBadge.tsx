import type { PedidoStatus } from '@/lib/types'

const config: Record<PedidoStatus, { label: string; className: string }> = {
  pendente:      { label: 'Pendente',         className: 'bg-gray-100 text-gray-700' },
  em_preparo:    { label: 'Em preparo',        className: 'bg-yellow-100 text-yellow-800' },
  saiu_entrega:  { label: 'Saiu p/ entrega',  className: 'bg-blue-100 text-blue-800' },
  entregue:      { label: 'Entregue',          className: 'bg-green-100 text-green-800' },
  retirado:      { label: 'Retirado',          className: 'bg-green-100 text-green-800' },
  cancelado:     { label: 'Cancelado',         className: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }: { status: PedidoStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
