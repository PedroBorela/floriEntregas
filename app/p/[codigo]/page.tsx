'use client'

import { use, useEffect, useState } from 'react'
import { formatarData } from '@/lib/formatters'

interface PedidoPublico {
  codigo: string
  status: string
  tipo: string
  cliente_nome: string
  destinatario_nome: string | null
  data_entrega: string | null
  horario_entrega: string | null
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  referencia: string | null
}

const STATUS_INFO: Record<string, { label: string; cor: string; icone: string }> = {
  pendente:     { label: 'Pendente',       cor: 'bg-gray-100 text-gray-600',   icone: '⏳' },
  em_preparo:   { label: 'Em preparo',     cor: 'bg-blue-100 text-blue-700',   icone: '🌸' },
  saiu_entrega: { label: 'Saiu para entrega', cor: 'bg-amber-100 text-amber-700', icone: '🛵' },
  entregue:     { label: 'Entregue',       cor: 'bg-green-100 text-green-700', icone: '✅' },
  retirado:     { label: 'Retirado',       cor: 'bg-green-100 text-green-700', icone: '✅' },
  cancelado:    { label: 'Cancelado',      cor: 'bg-red-100 text-red-600',     icone: '❌' },
}

export default function RastreioPedidoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = use(params)
  const [pedido, setPedido] = useState<PedidoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/p/${codigo}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then((d) => {
        if (d) setPedido(d.pedido)
        setLoading(false)
      })
  }, [codigo])

  async function confirmarEntrega() {
    setConfirmando(true)
    setErro('')
    const res = await fetch(`/api/p/${codigo}`, { method: 'POST' })
    if (res.ok) {
      setConfirmado(true)
      setPedido((p) => p ? { ...p, status: 'entregue' } : p)
    } else {
      const d = await res.json()
      setErro(d.error ?? 'Erro ao confirmar entrega.')
    }
    setConfirmando(false)
  }

  const statusInfo = pedido ? (STATUS_INFO[pedido.status] ?? { label: pedido.status, cor: 'bg-gray-100 text-gray-600', icone: '📦' }) : null
  const podeCofirmar = pedido?.status === 'saiu_entrega' && !confirmado

  return (
    <div className="min-h-screen bg-green-900 flex flex-col items-center justify-start pt-10 px-4 pb-10">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <p className="text-green-300 text-xs tracking-widest uppercase mb-1">Natureza Em Flores</p>
        <p className="text-white/60 text-xs">Rastreio de pedido</p>
      </div>

      {loading && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-400 animate-pulse">Carregando...</p>
        </div>
      )}

      {notFound && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 text-center space-y-2">
          <p className="text-4xl">🌿</p>
          <p className="font-semibold text-gray-700">Pedido não encontrado</p>
          <p className="text-sm text-gray-400">Verifique o código do pedido.</p>
        </div>
      )}

      {pedido && statusInfo && (
        <div className="w-full max-w-sm space-y-3">
          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Status banner */}
            <div className={`px-5 py-4 flex items-center gap-3 ${
              confirmado || pedido.status === 'entregue' || pedido.status === 'retirado'
                ? 'bg-green-50'
                : pedido.status === 'saiu_entrega'
                ? 'bg-amber-50'
                : 'bg-gray-50'
            }`}>
              <span className="text-2xl">{statusInfo.icone}</span>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className="font-bold text-gray-800">{confirmado ? 'Entregue' : statusInfo.label}</p>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Código */}
              <div className="text-center pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Pedido</p>
                <p className="text-3xl font-bold font-mono text-green-900 tracking-widest">{pedido.codigo}</p>
              </div>

              {/* Data/horário */}
              {(pedido.data_entrega || pedido.horario_entrega) && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📅</span>
                  <span>
                    {pedido.data_entrega && formatarData(pedido.data_entrega)}
                    {pedido.horario_entrega && ` — ${pedido.horario_entrega}`}
                  </span>
                </div>
              )}

              {/* Destinatário */}
              {pedido.tipo === 'entrega' && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5">👤</span>
                  <div>
                    <p className="text-xs text-gray-400">Destinatário</p>
                    <p className="font-medium text-gray-800">{pedido.destinatario_nome ?? pedido.cliente_nome}</p>
                  </div>
                </div>
              )}

              {/* Endereço */}
              {pedido.logradouro && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5">📍</span>
                  <div>
                    <p className="text-xs text-gray-400">Endereço</p>
                    <p className="font-medium text-gray-800">
                      {pedido.logradouro}{pedido.numero ? `, ${pedido.numero}` : ''}
                    </p>
                    <p className="text-gray-500">{pedido.bairro}{pedido.cidade ? ` — ${pedido.cidade}` : ''}</p>
                    {pedido.referencia && <p className="text-gray-400 text-xs mt-0.5">Ref: {pedido.referencia}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botão de confirmação */}
          {podeCofirmar && (
            <button
              onClick={confirmarEntrega}
              disabled={confirmando}
              className="w-full py-4 rounded-2xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-bold text-lg shadow-lg transition disabled:opacity-60"
            >
              {confirmando ? 'Confirmando...' : '✓ Confirmar entrega recebida'}
            </button>
          )}

          {/* Confirmação feita */}
          {(confirmado || (!podeCofirmar && (pedido.status === 'entregue' || pedido.status === 'retirado'))) && (
            <div className="bg-green-500 rounded-2xl px-5 py-4 text-center text-white shadow-lg">
              <p className="text-2xl mb-1">🌷</p>
              <p className="font-bold text-lg">Entrega confirmada!</p>
              <p className="text-green-100 text-sm mt-1">Obrigado por usar a Natureza Em Flores.</p>
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          {/* Status que não permite ação */}
          {!podeCofirmar && pedido.status !== 'entregue' && pedido.status !== 'retirado' && pedido.status !== 'cancelado' && (
            <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-green-200 text-sm">O pedido ainda não saiu para entrega.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
