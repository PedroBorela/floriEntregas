'use client'

import { useState } from 'react'
import { User } from 'lucide-react'
import ModalSeletorVendedor from './ModalSeletorVendedor'
import { corVendedor } from '@/lib/vendedorCores'

interface Props {
  pedidoId: string
  vendedorInicial: { id: string; nome: string } | null
}

export default function BotaoVendedor({ pedidoId, vendedorInicial }: Props) {
  const [vendedor, setVendedor] = useState(vendedorInicial)
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleSelect(v: { id: string; nome: string } | null) {
    setSalvando(true)
    const res = await fetch(`/api/pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'definir_vendedor', vendedor_id: v?.id ?? null }),
    })
    setSalvando(false)
    if (res.ok) setVendedor(v)
  }

  return (
    <>
      <button
        onClick={() => setModal(true)}
        disabled={salvando}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
          vendedor
            ? corVendedor(vendedor.id).pill
            : 'border-gray-200 hover:bg-gray-50'
        }`}
      >
        <User size={13} className="shrink-0" />
        <span className={vendedor ? 'font-medium' : 'text-gray-400'}>
          {salvando ? '...' : (vendedor?.nome ?? 'Sem vendedor')}
        </span>
      </button>
      <ModalSeletorVendedor
        open={modal}
        onClose={() => setModal(false)}
        onSelect={handleSelect}
        vendedorAtualId={vendedor?.id}
      />
    </>
  )
}
