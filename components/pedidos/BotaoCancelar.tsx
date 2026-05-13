'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ModalCancelamento from './ModalCancelamento'
import type { PedidoStatus } from '@/lib/types'

interface Props {
  pedidoId: string
  codigo: string
  status: PedidoStatus
}

const STATUS_CANCELAVEIS: PedidoStatus[] = ['pendente', 'em_preparo', 'saiu_entrega']

export default function BotaoCancelar({ pedidoId, codigo, status }: Props) {
  const [aberto, setAberto] = useState(false)
  const router = useRouter()

  if (!STATUS_CANCELAVEIS.includes(status)) return null

  async function handleCancelar(motivo: string) {
    const res = await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'cancelar', motivo_cancelamento: motivo }),
    })
    if (res.ok) {
      setAberto(false)
      router.refresh()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition"
      >
        Cancelar pedido
      </button>

      <ModalCancelamento
        open={aberto}
        codigoPedido={codigo}
        onClose={() => setAberto(false)}
        onConfirmar={handleCancelar}
      />
    </>
  )
}
