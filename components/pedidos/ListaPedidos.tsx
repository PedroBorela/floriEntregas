'use client'

import { useState, useEffect, useCallback } from 'react'
import CardPedido from './CardPedido'
import type { Pedido, PedidoStatus } from '@/lib/types'

const statusOpcoes: { value: PedidoStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_preparo', label: 'Em preparo' },
  { value: 'saiu_entrega', label: 'Saiu p/ entrega' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'retirado', label: 'Retirado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function formatISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function atalhosDatas() {
  const hoje = new Date()
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  return {
    hoje: { inicio: formatISO(hoje), fim: formatISO(hoje) },
    semana: { inicio: formatISO(inicioSemana), fim: formatISO(hoje) },
    mes: { inicio: formatISO(inicioMes), fim: formatISO(fimMes) },
  }
}

const pageSize = 20

export default function ListaPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<PedidoStatus | ''>('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  const carregar = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (busca) params.set('busca', busca)
    if (filtroStatus) params.set('status', filtroStatus)
    if (dataInicio) params.set('dataInicio', dataInicio)
    if (dataFim) params.set('dataFim', dataFim)
    if (filtroTipo) params.set('tipo', filtroTipo)

    const res = await fetch(`/api/pedidos?${params}`)
    const json = await res.json()
    setPedidos(json.pedidos ?? [])
    setTotal(json.total ?? 0)
    setPage(p)
    setLoading(false)
  }, [busca, filtroStatus, dataInicio, dataFim, filtroTipo])

  useEffect(() => { carregar(1) }, [carregar])

  function aplicarAtalho(atalho: 'hoje' | 'semana' | 'mes') {
    const at = atalhosDatas()
    setDataInicio(at[atalho].inicio)
    setDataFim(at[atalho].fim)
  }

  function limparFiltros() {
    setBusca('')
    setFiltroStatus('')
    setDataInicio('')
    setDataFim('')
    setFiltroTipo('')
  }

  const totalPages = Math.ceil(total / pageSize)
  const temFiltroAtivo = busca || filtroStatus || dataInicio || dataFim || filtroTipo

  return (
    <div>
      <div className="section-card space-y-3">
        {/* Busca por cliente (nome ou telefone) */}
        <div className="flex gap-2">
          <input
            className="form-input flex-1"
            placeholder="Buscar por cliente, telefone ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar(1)}
          />
          {temFiltroAtivo && (
            <button
              onClick={limparFiltros}
              className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Chips de status */}
        <div className="flex flex-wrap gap-1.5">
          {statusOpcoes.map((op) => (
            <button
              key={op.value}
              onClick={() => setFiltroStatus(op.value)}
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

        {/* Filtro de data */}
        <div className="space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {(['hoje', 'semana', 'mes'] as const).map((a) => {
              const labels = { hoje: 'Hoje', semana: 'Esta semana', mes: 'Este mês' }
              const at = atalhosDatas()
              const ativo = dataInicio === at[a].inicio && dataFim === at[a].fim
              return (
                <button
                  key={a}
                  onClick={() => aplicarAtalho(a)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    ativo ? 'bg-green-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {labels[a]}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="date"
                className="form-input"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <span className="text-gray-400 text-sm shrink-0">até</span>
              <input
                type="date"
                className="form-input"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <select
                className="form-input"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="entrega">Entrega</option>
                <option value="retirada">Retirada</option>
              </select>
            </div>
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-400">{total} pedido{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        )}
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
          <button
            disabled={page <= 1}
            onClick={() => carregar(page - 1)}
            className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500 py-1">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => carregar(page + 1)}
            className="btn-secondary px-3 py-1 text-xs disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
