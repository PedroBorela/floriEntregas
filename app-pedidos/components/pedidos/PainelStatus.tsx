'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatarMoeda } from '@/lib/formatters'
import { haversine, formatarDistancia } from '@/lib/haversine'
import type { Pedido, PedidoStatus } from '@/lib/types'

const LOJA = { lat: -20.2578, lng: -42.0339 }

const PROXIMO_STATUS: Partial<Record<PedidoStatus, string>> = {
  pendente:     'Em preparo',
  em_preparo:   'Saiu p/ entrega',
  saiu_entrega: 'Entregue',
}

const COR_AVANCAR: Partial<Record<PedidoStatus, string>> = {
  pendente:     'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  em_preparo:   'bg-blue-100 text-blue-800 hover:bg-blue-200',
  saiu_entrega: 'bg-green-100 text-green-800 hover:bg-green-200',
}

const STATUS_FILTROS: { value: PedidoStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_preparo', label: 'Em preparo' },
  { value: 'saiu_entrega', label: 'Saiu p/ entrega' },
  { value: 'entregue', label: 'Entregue' },
]

type Ordenacao = 'horario' | 'distancia'

interface Props {
  pedidos: Pedido[]
  onAvancar: (id: string) => Promise<void>
}

export default function PainelStatus({ pedidos, onAvancar }: Props) {
  const [filtro, setFiltro] = useState<PedidoStatus | ''>('')
  const [ordem, setOrdem] = useState<Ordenacao>('horario')
  const [avancando, setAvancando] = useState<string | null>(null)

  async function handleAvancar(id: string) {
    setAvancando(id)
    await onAvancar(id)
    setAvancando(null)
  }

  const filtrados = pedidos.filter((p) => !filtro || p.status === filtro)

  const ordenados = [...filtrados].sort((a, b) => {
    if (ordem === 'distancia') {
      const da = a.latitude != null
        ? haversine(LOJA.lat, LOJA.lng, a.latitude, a.longitude!)
        : Infinity
      const db = b.latitude != null
        ? haversine(LOJA.lat, LOJA.lng, b.latitude, b.longitude!)
        : Infinity
      return da - db
    }
    return (a.horario_entrega ?? '99:99').localeCompare(b.horario_entrega ?? '99:99')
  })

  return (
    <div>
      {/* Filtros e ordenação */}
      <div className="section-card">
        <div className="flex flex-wrap gap-2 mb-3">
          {STATUS_FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filtro === f.value
                  ? 'bg-green-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setOrdem('horario')}
            className={`px-3 py-1 rounded border transition ${
              ordem === 'horario' ? 'border-green-700 text-green-800 bg-green-50' : 'border-gray-200 text-gray-500'
            }`}
          >
            Por horário
          </button>
          <button
            onClick={() => setOrdem('distancia')}
            className={`px-3 py-1 rounded border transition ${
              ordem === 'distancia' ? 'border-green-700 text-green-800 bg-green-50' : 'border-gray-200 text-gray-500'
            }`}
          >
            Por distância
          </button>
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total', valor: pedidos.length, cor: 'text-gray-700' },
          { label: 'Pendentes', valor: pedidos.filter(p => p.status === 'pendente').length, cor: 'text-red-600' },
          { label: 'A caminho', valor: pedidos.filter(p => p.status === 'saiu_entrega').length, cor: 'text-blue-600' },
          { label: 'Entregues', valor: pedidos.filter(p => p.status === 'entregue' || p.status === 'retirado').length, cor: 'text-green-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg border border-gray-100 p-3 text-center">
            <p className={`text-2xl font-bold ${item.cor}`}>{item.valor}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Lista de cards */}
      {ordenados.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Nenhum pedido para hoje com este filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {ordenados.map((p) => {
            const distKm = p.latitude != null
              ? haversine(LOJA.lat, LOJA.lng, p.latitude, p.longitude!)
              : null
            const proximo = p.tipo === 'retirada' && p.status === 'saiu_entrega'
              ? 'Retirado'
              : PROXIMO_STATUS[p.status]
            const corBtn = COR_AVANCAR[p.status]
            const isAvancando = avancando === p.id

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/pedidos/${p.codigo}`} className="font-mono text-sm font-semibold text-green-900 hover:underline">
                        {p.codigo}
                      </Link>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-gray-800 text-sm font-medium truncate">{p.cliente_nome}</p>
                    {p.logradouro && (
                      <p className="text-gray-400 text-xs truncate mt-0.5">
                        {[p.logradouro, p.numero, p.bairro].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {p.horario_entrega && <span>🕐 {p.horario_entrega.slice(0, 5)}</span>}
                      {distKm != null && <span>📍 {formatarDistancia(distKm)}</span>}
                      <span className="font-medium text-green-800">{formatarMoeda(p.valor_total)}</span>
                    </div>
                  </div>

                  {proximo && corBtn && (
                    <button
                      onClick={() => handleAvancar(p.id)}
                      disabled={isAvancando}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition ${corBtn} disabled:opacity-50`}
                    >
                      {isAvancando ? '...' : `→ ${proximo}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
