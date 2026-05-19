'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ModalEdicaoPedido from './ModalEdicaoPedido'
import type { Pedido, PedidoStatus } from '@/lib/types'

interface Props {
  pedido: Pedido
}

const STATUS_EDITAVEIS: PedidoStatus[] = ['pendente', 'em_preparo', 'saiu_entrega', 'entregue', 'retirado', 'vendido']

export default function BotaoEditar({ pedido }: Props) {
  const [aberto, setAberto] = useState(false)
  const router = useRouter()

  if (!STATUS_EDITAVEIS.includes(pedido.status)) return null

  function handleSalvo() {
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-sm text-green-800 hover:text-green-900 font-medium border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition"
      >
        Editar
      </button>

      <ModalEdicaoPedido
        pedido={pedido}
        open={aberto}
        onClose={() => setAberto(false)}
        onSalvo={handleSalvo}
      />
    </>
  )
}
