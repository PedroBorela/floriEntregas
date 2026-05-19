'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'

const POR_PAGINA = 4

type Devedor = {
  id: string
  codigo: string
  tipo: string
  status: string
  cliente_nome: string
  cliente_telefone: string
  parcial: boolean
  valor_pago: number
  valor_total: number
  valor_devido: number
  data_entrega: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  entregue: 'Entregue',
  retirado: 'Retirado',
  vendido:  'Vendido',
}

const TIPO_LABEL: Record<string, string> = {
  entrega:  'Entrega',
  retirada: 'Retirada',
  balcao:   'Balcão',
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

export default function BadgeDevedores({ count, totalDevido }: Readonly<{ count: number; totalDevido: number }>) {
  const [aberto, setAberto] = useState(false)
  const [devedores, setDevedores] = useState<Devedor[]>([])
  const [loading, setLoading] = useState(false)
  const [carregado, setCarregado] = useState(false)
  const [pagina, setPagina] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch('/api/dashboard/devedores')
      .then((r) => r.json())
      .then((d) => {
        setDevedores(Array.isArray(d.devedores) ? d.devedores : [])
        setCarregado(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalPaginas = Math.ceil(devedores.length / POR_PAGINA)
  const paginaAtual = devedores.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA)

  return (
    <div className="rounded-xl overflow-hidden border border-amber-200">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between bg-amber-50 px-4 py-3 gap-4 hover:bg-amber-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {count} pedido{count !== 1 ? 's' : ''} com pagamento pendente
            </p>
            <p className="text-xs text-amber-600 font-medium">
              Total em aberto: {formatarMoeda(totalDevido)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {loading && <span className="text-xs text-amber-400 animate-pulse">carregando…</span>}
          {aberto ? <ChevronUp size={16} className="text-amber-400" /> : <ChevronDown size={16} className="text-amber-400" />}
        </div>
      </button>

      {aberto && carregado && (
        <>
          <div className="bg-white divide-y divide-slate-50">
            {devedores.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Nenhum devedor encontrado</p>
            ) : (
              paginaAtual.map((p) => (
                <Link
                  key={p.id}
                  href={`/pedidos/${p.codigo}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  {/* Valor devido */}
                  <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 shrink-0 min-w-[72px]">
                    <span className="text-xs font-black text-amber-700 leading-none">
                      {formatarMoeda(p.valor_devido)}
                    </span>
                    {p.parcial && (
                      <span className="text-[9px] text-amber-500 mt-0.5">parcial</span>
                    )}
                  </div>

                  {/* Dados */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{p.codigo}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-sm text-slate-600 truncate">{p.cliente_nome}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.cliente_telefone}
                      {p.data_entrega ? ` · ${formatarData(p.data_entrega)}` : ''}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {TIPO_LABEL[p.tipo] ?? p.tipo}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between bg-amber-50 border-t border-amber-100 px-4 py-2">
              <button
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 disabled:text-amber-200 hover:text-amber-800 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <span className="text-xs text-amber-400 font-medium">
                {pagina + 1} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina === totalPaginas - 1}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 disabled:text-amber-200 hover:text-amber-800 disabled:cursor-not-allowed transition-colors"
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
