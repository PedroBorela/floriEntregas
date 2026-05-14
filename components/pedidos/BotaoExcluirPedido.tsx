'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Props {
  pedidoId: string
  codigo: string
}

export default function BotaoExcluirPedido({ pedidoId, codigo }: Props) {
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleExcluir() {
    setLoading(true)
    const res = await fetch(`/api/pedidos/${pedidoId}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) {
      router.push('/pedidos')
    } else {
      const err = await res.json()
      toast('Erro ao excluir: ' + err.error)
      setAberto(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition"
      >
        Excluir
      </button>

      <Modal open={aberto} onClose={() => { if (!loading) setAberto(false) }} title="Excluir pedido">
        <p className="text-sm text-gray-600 mb-6">
          O pedido <span className="font-mono font-semibold text-green-900">{codigo}</span> e todos os seus
          dados (itens, pagamento, histórico de status) serão excluídos permanentemente. Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setAberto(false)}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExcluir}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Excluindo...' : 'Excluir permanentemente'}
          </button>
        </div>
      </Modal>
    </>
  )
}
