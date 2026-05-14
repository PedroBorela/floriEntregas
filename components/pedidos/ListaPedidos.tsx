'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

const STATUS_FINALIZADO = new Set<PedidoStatus>(['entregue', 'retirado', 'cancelado'])

function formatLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function atalhosDatas() {
  const hoje = new Date()
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  return {
    hoje: { inicio: formatLocal(hoje), fim: formatLocal(hoje) },
    semana: { inicio: formatLocal(inicioSemana), fim: formatLocal(hoje) },
    mes: { inicio: formatLocal(inicioMes), fim: formatLocal(fimMes) },
  }
}

function labelData(iso: string, hoje: string, ontem: string): string {
  if (iso === hoje) return 'Hoje'
  if (iso === ontem) return 'Ontem'
  const [, mm, dd] = iso.split('-')
  return `${dd}/${mm}`
}

const pageSize = 20

export default function ListaPedidos({ dataInicioPadrao = '', dataFimPadrao = '' }: { dataInicioPadrao?: string; dataFimPadrao?: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [finalizadosAbertos, setFinalizadosAbertos] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<PedidoStatus | ''>('')
  const [dataInicio, setDataInicio] = useState(dataInicioPadrao)
  const [dataFim, setDataFim] = useState(dataFimPadrao)
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

  const hoje = formatLocal(new Date())
  const ontemDate = new Date()
  ontemDate.setDate(ontemDate.getDate() - 1)
  const ontem = formatLocal(ontemDate)

  const { ativos, finalizados } = useMemo(() => {
    const ativos: Pedido[] = []
    const finalizados: Pedido[] = []
    for (const p of pedidos) {
      if (STATUS_FINALIZADO.has(p.status)) finalizados.push(p)
      else ativos.push(p)
    }
    return { ativos, finalizados }
  }, [pedidos])

  // Group active orders by data_entrega (fallback: created_at date), today first
  const gruposPorData = useMemo(() => {
    const map = new Map<string, Pedido[]>()
    for (const p of ativos) {
      const key = p.data_entrega ?? p.created_at.slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === hoje) return -1
      if (b === hoje) return 1
      return a.localeCompare(b)
    })
  }, [ativos, hoje])

  const totalPages = Math.ceil(total / pageSize)
  const temFiltroAtivo = busca || filtroStatus || dataInicio || dataFim || filtroTipo

  return (
    <div>
      <div className="section-card space-y-3">
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
        <div className="space-y-6 mt-2">
          {gruposPorData.map(([data, lista]) => {
            const isHoje = data === hoje
            return (
              <div key={data}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${
                    isHoje
                      ? 'bg-green-800 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {labelData(data, hoje, ontem)} — {lista.length} pedido{lista.length !== 1 ? 's' : ''}
                  </span>
                  <div className={`flex-1 h-px ${isHoje ? 'bg-green-200' : 'bg-gray-100'}`} />
                </div>
                <div className={`space-y-3 ${isHoje ? 'pl-2 border-l-2 border-green-200' : ''}`}>
                  {lista.map((p) => <CardPedido key={p.id} pedido={p} />)}
                </div>
              </div>
            )
          })}

          {finalizados.length > 0 && (
            <div>
              <button
                onClick={() => setFinalizadosAbertos((v) => !v)}
                className="flex items-center gap-3 w-full mb-3 group"
              >
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 group-hover:bg-gray-200 transition whitespace-nowrap">
                  Finalizados — {finalizados.length} pedido{finalizados.length !== 1 ? 's' : ''}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 group-hover:text-gray-600 transition shrink-0">
                  {finalizadosAbertos ? '▲ ocultar' : '▼ mostrar'}
                </span>
              </button>
              {finalizadosAbertos && (
                <div className="space-y-3 opacity-75">
                  {finalizados.map((p) => <CardPedido key={p.id} pedido={p} />)}
                </div>
              )}
            </div>
          )}
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
