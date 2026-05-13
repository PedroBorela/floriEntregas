'use client'

import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '@/lib/supabase'
import { formatarDataHora } from '@/lib/formatters'
import type { Pedido, PedidoItem } from '@/lib/types'
import ComandaImpressao from './ComandaImpressao'

interface Props {
  pedido: Pedido & { pedido_itens: PedidoItem[] }
}

export default function BotaoImprimir({ pedido }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [impresso, setImpresso] = useState(pedido.impresso)
  const [impressoEm, setImpressoEm] = useState(pedido.impresso_em)

  const handlePrint = useReactToPrint({
    contentRef: ref,
    pageStyle: '@page { size: 80mm auto; margin: 0; } body { margin: 4mm; }',
    onAfterPrint: async () => {
      const agora = new Date().toISOString()
      await supabase
        .from('pedidos')
        .update({ impresso: true, impresso_em: agora })
        .eq('id', pedido.id)
      setImpresso(true)
      setImpressoEm(agora)
      setConfirmando(false)
    },
  })

  function clicarImprimir() {
    if (impresso) {
      setConfirmando(true)
    } else {
      handlePrint()
    }
  }

  return (
    <>
      <button
        onClick={clicarImprimir}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          impresso
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-green-800 text-white hover:bg-green-900'
        }`}
      >
        <span>🖨️</span>
        {impresso ? 'Reimprimir comanda' : 'Imprimir comanda'}
      </button>

      {/* Modal de confirmação de reimpressão */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-900 mb-2">Pedido já impresso</h3>
            <p className="text-sm text-gray-600 mb-4">
              Este pedido foi impresso em{' '}
              <span className="font-medium">{impressoEm ? formatarDataHora(impressoEm) : '—'}</span>.
              Deseja reimprimir?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmando(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePrint()}
                className="px-4 py-2 rounded-lg text-sm bg-green-800 text-white hover:bg-green-900 font-medium"
              >
                Reimprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout da comanda — invisível na tela, visível só ao imprimir */}
      <div className="hidden">
        <div ref={ref}>
          <ComandaImpressao pedido={{ ...pedido, impresso, impresso_em: impressoEm }} baseUrl={typeof window !== 'undefined' ? window.location.origin : ''} />
        </div>
      </div>
    </>
  )
}
