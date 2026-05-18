'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronDown, ChevronUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

const POR_PAGINA = 3

type PedidoAtrasado = {
  id: string
  codigo: string
  tipo: 'entrega' | 'retirada' | 'balcao'
  status: string
  cliente_nome: string
  data_entrega: string
  horario_entrega: string | null
  bairro: string | null
  itens_resumo: string
  dias_atraso: number
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_preparo: 'Em Preparo',
  saiu_entrega: 'A Caminho',
}

const STATUS_BADGE: Record<string, string> = {
  pendente: 'bg-slate-100 text-slate-600',
  em_preparo: 'bg-amber-100 text-amber-800',
  saiu_entrega: 'bg-blue-100 text-blue-800',
}

function formatarData(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

export default function BadgeAtrasados({ count }: { count: number }) {
  const [aberto, setAberto] = useState(false)
  const [pedidos, setPedidos] = useState<PedidoAtrasado[]>([])
  const [loading, setLoading] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [pagina, setPagina] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch('/api/dashboard/atrasados')
      .then((r) => r.json())
      .then((d: PedidoAtrasado[]) => {
        setPedidos(Array.isArray(d) ? d : [])
        setCarregado(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalPaginas = Math.ceil(pedidos.length / POR_PAGINA)
  const paginaAtual = pedidos.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA)

  return (
    <div className="rounded-xl overflow-hidden border border-red-200">
      {/* Cabeçalho clicável */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between bg-red-50 px-4 py-3 gap-4 hover:bg-red-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm font-semibold text-red-800">
            {count} pedido{count !== 1 ? 's' : ''} com data de entrega vencida
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {loading && (
            <span className="text-xs text-red-400 animate-pulse">carregando…</span>
          )}
          {aberto ? (
            <ChevronUp size={16} className="text-red-400" />
          ) : (
            <ChevronDown size={16} className="text-red-400" />
          )}
        </div>
      </button>

      {/* Lista paginada */}
      {aberto && carregado && (
        <>
          <div className="bg-white divide-y divide-slate-50">
            {pedidos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum pedido encontrado</p>
            ) : (
              paginaAtual.map((p) => (
                <Link
                  key={p.id}
                  href={`/pedidos/${p.codigo}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  {/* Indicador de atraso */}
                  <div className="flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-xl px-3 py-2 shrink-0 min-w-[56px]">
                    <Clock size={12} className="text-red-400 mb-0.5" />
                    <span className="text-sm font-black text-red-600 leading-none">
                      -{p.dias_atraso}d
                    </span>
                    <span className="text-[9px] text-red-400 leading-none mt-0.5">
                      {formatarData(p.data_entrega)}
                    </span>
                  </div>

                  {/* Dados do pedido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800">{p.codigo}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-sm text-slate-600 truncate">{p.cliente_nome}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {p.itens_resumo}
                      {p.bairro ? ` · ${p.bairro}` : ''}
                      {p.horario_entrega ? ` · ${p.horario_entrega}` : ''}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[p.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.tipo === 'entrega' ? 'bg-blue-50 text-blue-600' : p.tipo === 'balcao' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {p.tipo === 'entrega' ? 'Entrega' : p.tipo === 'balcao' ? 'Balcão' : 'Retirada'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between bg-red-50 border-t border-red-100 px-4 py-2">
              <button
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 disabled:text-red-200 hover:text-red-800 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>

              <span className="text-xs text-red-400 font-medium">
                {pagina + 1} de {totalPaginas}
              </span>

              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina === totalPaginas - 1}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 disabled:text-red-200 hover:text-red-800 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}