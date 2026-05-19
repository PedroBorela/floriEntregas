'use client'

import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import ListaPedidos from '@/components/pedidos/ListaPedidos'
import PainelStatus from '@/components/pedidos/PainelStatus'
import { usePedidosDia } from '@/hooks/usePedidosDia'
import { useRouter } from 'next/navigation'
import type { Pedido } from '@/lib/types'

const MapaEntregas = lazy(() => import('@/components/mapa/MapaEntregas'))

type Tab = 'lista' | 'amanha' | 'mapa' | 'balcao'

function formatLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function PaginaPedidos() {
  const [tab, setTab] = useState<Tab>('lista')

  const amanhaDate = new Date()
  amanhaDate.setDate(amanhaDate.getDate() + 1)
  const amanha = formatLocal(amanhaDate)
  const { pedidos, loading, avancarStatus } = usePedidosDia()
  const router = useRouter()

  // Coordenadas geocodificadas on-demand para pedidos sem lat/lon
  const [coordsExtras, setCoordsExtras] = useState<Record<string, { lat: number; lng: number }>>({})
  const geocodificadosRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (tab !== 'mapa' || loading) return

    const semCoords = pedidos.filter(
      (p) =>
        p.tipo === 'entrega' &&
        p.latitude == null &&
        (p.logradouro || p.cep) &&
        !geocodificadosRef.current.has(p.id)
    )

    if (!semCoords.length) return

    // Marca como tentados para evitar re-execução
    semCoords.forEach((p) => geocodificadosRef.current.add(p.id))

    let cancelled = false

    ;(async () => {
      for (const p of semCoords) {
        if (cancelled) break

        const q = [p.logradouro, p.numero, p.bairro].filter(Boolean).join(', ')
        if (!q) continue

        try {
          const sp = new URLSearchParams({ q })
          if (p.cidade) sp.set('cidade', p.cidade)
          const res = await fetch(`/api/geocoding?${sp}`)
          if (!res.ok || cancelled) continue
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0 && !cancelled) {
            setCoordsExtras((prev) => ({
              ...prev,
              [p.id]: { lat: Number.parseFloat(data[0].lat), lng: Number.parseFloat(data[0].lon) },
            }))
          }
        } catch {
          // geocoding falhou para este pedido, continua
        }

        // Nominatim: máx 1 req/s
        if (!cancelled) await new Promise((r) => setTimeout(r, 1100))
      }
    })()

    return () => { cancelled = true }
  }, [tab, pedidos, loading])

  // Mescla coordenadas extras nos pedidos que não tinham
  const pedidosComCoords: Pedido[] = pedidos.map((p) => {
    if (p.latitude != null || !coordsExtras[p.id]) return p
    return { ...p, latitude: coordsExtras[p.id].lat, longitude: coordsExtras[p.id].lng }
  })

  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {([
          { value: 'lista', label: 'Lista' },
          { value: 'amanha', label: 'Amanhã' },
          { value: 'mapa', label: `Mapa do Dia${pedidos.length ? ` (${pedidos.length})` : ''}` },
          { value: 'balcao', label: 'Balcão' },
        ] as { value: Tab; label: string }[]).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              tab === t.value ? 'bg-white shadow-sm text-green-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lista' && <ListaPedidos excluirBalcao />}

      {tab === 'amanha' && <ListaPedidos key="amanha" dataInicioPadrao={amanha} dataFimPadrao={amanha} excluirBalcao />}

      {tab === 'balcao' && <ListaPedidos key="balcao" tipoBloqueado="balcao" semSeparacaoFinalizado />}

      {tab === 'mapa' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Carregando pedidos do dia...</div>
          ) : (
            <>
              <Suspense fallback={
                <div className="h-96 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Carregando mapa...
                </div>
              }>
                <MapaEntregas
                  pedidos={pedidosComCoords.filter((p) => p.tipo === 'entrega')}
                  onClickPedido={(codigo) => router.push(`/pedidos/${codigo}`)}
                />
              </Suspense>

              <PainelStatus pedidos={pedidosComCoords} onAvancar={avancarStatus} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
