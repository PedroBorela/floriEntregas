'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Props {
  open: boolean
  codigoPedido: string
  onClose: () => void
  onConfirmar: (motivo: string) => Promise<void>
}

export default function ModalCancelamento({ open, codigoPedido, onClose, onConfirmar }: Props) {
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirmar() {
    if (!motivo.trim()) return
    setLoading(true)
    try {
      await onConfirmar(motivo.trim())
      setMotivo('')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    setMotivo('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cancelar pedido">
      <p className="text-sm text-gray-600 mb-4">
        Pedido <span className="font-mono font-semibold text-green-900">{codigoPedido}</span> será cancelado.
        Informe o motivo para registro de auditoria.
      </p>

      <div className="mb-4">
        <label className="form-label">Motivo do cancelamento <span className="text-red-500">*</span></label>
        <textarea
          className="form-input resize-none"
          rows={3}
          placeholder="Ex: cliente desistiu, produto indisponível, endereço errado..."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          disabled={loading}
          autoFocus
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={handleConfirmar}
          disabled={!motivo.trim() || loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
        </button>
      </div>
    </Modal>
  )
}
