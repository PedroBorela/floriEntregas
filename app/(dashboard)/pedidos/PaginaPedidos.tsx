'use client'

import { useState, Suspense, lazy } from 'react'
import ListaPedidos from '@/components/pedidos/ListaPedidos'
import PainelStatus from '@/components/pedidos/PainelStatus'
import { usePedidosDia } from '@/hooks/usePedidosDia'
import { useRouter } from 'next/navigation'

const MapaEntregas = lazy(() => import('@/components/mapa/MapaEntregas'))

type Tab = 'lista' | 'mapa'

export default function PaginaPedidos() {
  const [tab, setTab] = useState<Tab>('lista')
  const { pedidos, loading, avancarStatus } = usePedidosDia()
  const router = useRouter()

  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {([
          { value: 'lista', label: 'Lista' },
          { value: 'mapa', label: `Mapa do Dia${pedidos.length ? ` (${pedidos.length})` : ''}` },
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

      {tab === 'lista' && <ListaPedidos />}

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
                  pedidos={pedidos.filter((p) => p.tipo === 'entrega')}
                  onClickPedido={(codigo) => router.push(`/pedidos/${codigo}`)}
                />
              </Suspense>

              <PainelStatus pedidos={pedidos} onAvancar={avancarStatus} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
