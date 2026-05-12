'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PedidoStatus } from '@/lib/types'

const OPCOES: { value: PedidoStatus; label: string }[] = [
  { value: 'pendente',      label: 'Pendente' },
  { value: 'em_preparo',    label: 'Em preparo' },
  { value: 'saiu_entrega',  label: 'Saiu p/ entrega' },
  { value: 'entregue',      label: 'Entregue' },
  { value: 'retirado',      label: 'Retirado' },
  { value: 'cancelado',     label: 'Cancelado' },
]

const COR: Record<PedidoStatus, string> = {
  pendente:     'border-gray-300 text-gray-700',
  em_preparo:   'border-yellow-400 text-yellow-800 bg-yellow-50',
  saiu_entrega: 'border-blue-400 text-blue-800 bg-blue-50',
  entregue:     'border-green-400 text-green-800 bg-green-50',
  retirado:     'border-green-400 text-green-800 bg-green-50',
  cancelado:    'border-red-300 text-red-700 bg-red-50',
}

interface Props {
  pedidoId: string
  statusAtual: PedidoStatus
  tipo: 'entrega' | 'retirada'
}

export default function StatusDropdown({ pedidoId, statusAtual, tipo }: Props) {
  const [status, setStatus] = useState<PedidoStatus>(statusAtual)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleChange(novo: PedidoStatus) {
    if (novo === status) return
    setStatus(novo)

    await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'definir_status', status: novo }),
    })

    startTransition(() => router.refresh())
  }

  const opcoesFiltradas = tipo === 'entrega'
    ? OPCOES.filter(o => o.value !== 'retirado')
    : OPCOES.filter(o => o.value !== 'entregue')

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 font-medium shrink-0">Status:</span>
      <select
        value={status}
        onChange={e => handleChange(e.target.value as PedidoStatus)}
        disabled={isPending}
        className={`flex-1 text-sm font-medium rounded-lg border px-3 py-2 transition disabled:opacity-60 cursor-pointer ${COR[status]}`}
      >
        {opcoesFiltradas.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {isPending && <span className="text-xs text-gray-400">Salvando…</span>}
    </div>
  )
}
