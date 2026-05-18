'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Pedido, PedidoStatus } from '@/lib/types'

const PROXIMO: Partial<Record<PedidoStatus, string>> = {
  pendente:     'Em preparo',
  em_preparo:   'Saiu p/ entrega',
  pronto:       'Saiu p/ entrega',
  saiu_entrega: 'Entregue',
}

const CANCELAVEL: PedidoStatus[] = ['pendente', 'em_preparo', 'saiu_entrega']

interface Props {
  pedido: Pedido | null
  onClose: () => void
  onAvancar: (id: string) => Promise<void>
  onCancelar: (id: string) => Promise<void>
}

export default function ModalStatus({ pedido, onClose, onAvancar, onCancelar }: Props) {
  const [processando, setProcessando] = useState<'avancar' | 'cancelar' | null>(null)

  if (!pedido) return null

  const labelProximo = pedido.tipo === 'balcao' && pedido.status === 'pronto'
    ? 'Vendido'
    : pedido.tipo === 'retirada' && pedido.status === 'saiu_entrega'
      ? 'Retirado'
      : PROXIMO[pedido.status]

  const podeCancelar = CANCELAVEL.includes(pedido.status)

  async function handleAvancar() {
    setProcessando('avancar')
    await onAvancar(pedido!.id)
    setProcessando(null)
    onClose()
  }

  async function handleCancelar() {
    setProcessando('cancelar')
    await onCancelar(pedido!.id)
    setProcessando(null)
    onClose()
  }

  return (
    <Modal open={!!pedido} onClose={processando ? () => {} : onClose} title="Alterar status">
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <span className="font-mono text-sm font-semibold text-green-900">{pedido.codigo}</span>
          <StatusBadge status={pedido.status} />
        </div>

        <p className="text-sm text-gray-500 font-medium truncate">{pedido.cliente_nome}</p>

        {labelProximo ? (
          <button
            onClick={handleAvancar}
            disabled={!!processando}
            className="w-full py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 disabled:opacity-50 transition"
          >
            {processando === 'avancar' ? 'Atualizando…' : `→ Marcar como ${labelProximo}`}
          </button>
        ) : (
          <p className="text-center text-sm text-gray-400 py-2">Status final — nenhuma ação disponível.</p>
        )}

        {podeCancelar && (
          <button
            onClick={handleCancelar}
            disabled={!!processando}
            className="w-full py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition"
          >
            {processando === 'cancelar' ? 'Cancelando…' : 'Cancelar pedido'}
          </button>
        )}

        <button
          onClick={onClose}
          disabled={!!processando}
          className="w-full py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Fechar
        </button>
      </div>
    </Modal>
  )
}
