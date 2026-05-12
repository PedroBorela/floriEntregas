'use client'

import { useState, useEffect, useCallback } from 'react'
import CardPedido from './CardPedido'
import type { Pedido, PedidoStatus } from '@/lib/types'

const statusOpcoes: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_preparo', label: 'Em preparo' },
  { value: 'saiu_entrega', label: 'Saiu p/ entrega' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'retirado', label: 'Retirado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export default function ListaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<PedidoStatus | ''>('')
  const [filtroData, setFiltroData] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const pageSize = 20

  const carregar = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (busca) params.set('codigo', busca)
    if (filtroStatus) params.set('status', filtroStatus)
    if (filtroData) params.set('data', filtroData)
    if (filtroTipo) params.set('tipo', filtroTipo)

    const res = await fetch(`/api/pedidos?${params}`)
    const json = await res.json()
    setPedidos(json.pedidos ?? [])
    setTotal(json.total ?? 0)
    setPage(p)
    setLoading(false)
  }, [busca, filtroStatus, filtroData, filtroTipo])

  useEffect(() => { carregar(1) }, [carregar])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="section-card">
        <div className="flex gap-2 mb-4">
          <input
            className="form-input flex-1"
            placeholder="Buscar por código (ex: NEF-20260511-001)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar(1)}
          />
          <button onClick={() => carregar(1)} className="btn-primary px-4">Buscar</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOpcoes.map((op) => (
            <button
              key={op.value}
              onClick={() => setFiltroStatus(op.value as PedidoStatus | '')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filtroStatus === op.value
                  ? 'bg-green-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <input type="date" className="form-input" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
          <select className="form-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="entrega">Entrega</option>
            <option value="retirada">Retirada</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum pedido encontrado.</div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((p) => <CardPedido key={p.id} pedido={p} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => carregar(page - 1)} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">
            ← Anterior
          </button>
          <span className="text-sm text-gray-500 py-1">
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => carregar(page + 1)} className="btn-secondary px-3 py-1 text-xs disabled:opacity-40">
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
