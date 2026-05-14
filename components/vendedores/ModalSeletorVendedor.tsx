'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { corVendedor } from '@/lib/vendedorCores'
import type { Vendedor } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (v: { id: string; nome: string } | null) => void
  vendedorAtualId?: string | null
}

export default function ModalSeletorVendedor({ open, onClose, onSelect, vendedorAtualId }: Props) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setBusca('')
    setLoading(true)
    fetch('/api/vendedores')
      .then((r) => r.json())
      .then((d) => setVendedores((d.vendedores ?? []).filter((v: Vendedor) => v.ativo)))
      .finally(() => setLoading(false))
  }, [open])

  const filtrados = vendedores.filter((v) =>
    v.nome.toLowerCase().includes(busca.toLowerCase())
  )

  function selecionar(v: { id: string; nome: string } | null) {
    onSelect(v)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Selecionar vendedor">
      {loading ? (
        <p className="text-center text-gray-400 py-6">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {vendedores.length > 4 && (
            <input
              autoFocus
              className="form-input"
              placeholder="Buscar vendedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filtrados.map((v) => {
              const cor = corVendedor(v.id)
              return (
                <button
                  key={v.id}
                  onClick={() => selecionar({ id: v.id, nome: v.nome })}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm transition border ${
                    v.id === vendedorAtualId ? cor.ativo : cor.pill + ' hover:opacity-80'
                  }`}
                >
                  {v.nome}
                </button>
              )
            })}
            {filtrados.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">
                {vendedores.length === 0 ? 'Nenhum vendedor cadastrado.' : 'Nenhum resultado.'}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => selecionar(null)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition border ${
                !vendedorAtualId
                  ? 'bg-gray-100 text-gray-600 border-gray-300 font-medium'
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Nenhum vendedor
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
