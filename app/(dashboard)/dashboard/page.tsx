'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import HeaderSaudacao from '@/components/dashboard/HeaderSaudacao'
import BadgeAtrasados from '@/components/dashboard/BadgeAtrasados'
import PulsoOperacional from '@/components/dashboard/PulsoOperacional'
import PedidosHoje from '@/components/dashboard/PedidosHoje'
import SinaisDeGestao from '@/components/dashboard/SinaisDeGestao'
import BadgeDevedores from '@/components/dashboard/BadgeDevedores'
import type { StatusContagens } from '@/components/dashboard/PulsoOperacional'
import type { PedidoHoje } from '@/components/dashboard/PedidosHoje'
import type { KpisData } from '@/components/dashboard/SinaisDeGestao'

const INTERVALO_MS = 30_000

type PulsoData = {
  contagens: StatusContagens
  total: number
  atrasados: number
}

type DevedoresData = {
  devedores: { id: string }[]
  total_devido: number
}

function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

function ErroState({ erro, onRetry }: { erro: string | null; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
      <p className="text-lg font-bold text-slate-800">Erro ao carregar painel</p>
      {erro && (
        <p className="text-xs text-rose-400 font-mono mt-2 break-all max-w-sm mx-auto">{erro}</p>
      )}
      <button
        onClick={onRetry}
        className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}

export default function DashboardPage() {
  const [pulso, setPulso] = useState<PulsoData | null>(null)
  const [pedidosHoje, setPedidosHoje] = useState<PedidoHoje[] | null>(null)
  const [kpis, setKpis] = useState<KpisData | null>(null)
  const [devedores, setDevedores] = useState<DevedoresData | null>(null)
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const carregar = useCallback((silencioso = false) => {
    if (silencioso) {
      setAtualizando(true)
    } else {
      setLoading(true)
    }
    setErro(null)

    Promise.all([
      fetch('/api/dashboard/pulso').then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`))
        return r.json() as Promise<PulsoData>
      }),
      fetch('/api/dashboard/pedidos-hoje').then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`))
        return r.json() as Promise<PedidoHoje[]>
      }),
      fetch('/api/dashboard/kpis').then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`))
        return r.json() as Promise<KpisData>
      }),
      fetch('/api/dashboard/devedores').then(async (r) => {
        if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`))
        return r.json() as Promise<DevedoresData>
      }),
    ])
      .then(([p, ph, k, d]) => {
        setPulso(p)
        setPedidosHoje(ph)
        setKpis(k)
        setDevedores(d)
        setAtualizadoEm(new Date())
        setLoading(false)
        setAtualizando(false)
      })
      .catch((e: Error) => {
        setErro(e.message.slice(0, 300))
        setLoading(false)
        setAtualizando(false)
      })
  }, [])

  // Carga inicial + auto-refresh
  useEffect(() => {
    carregar()
    intervalRef.current = setInterval(() => carregar(true), INTERVALO_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [carregar])

  // Atualiza ao voltar para a aba (ex: usuário marcou pedido em outra tela)
  useEffect(() => {
    const handleVisibilidade = () => {
      if (document.visibilityState === 'visible') carregar(true)
    }
    document.addEventListener('visibilitychange', handleVisibilidade)
    return () => document.removeEventListener('visibilitychange', handleVisibilidade)
  }, [carregar])

  const horaAtualizada = atualizadoEm
    ? atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Cabeçalho + controles */}
      <div className="flex items-start justify-between gap-4">
        <HeaderSaudacao />
        <div className="flex flex-col items-end gap-1 shrink-0 pt-1">
          <button
            onClick={() => carregar(true)}
            disabled={atualizando}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-green-700 disabled:opacity-40 transition-colors"
          >
            <RefreshCw
              size={13}
              className={atualizando ? 'animate-spin' : ''}
            />
            Atualizar
          </button>
          {horaAtualizada && (
            <span className="text-[10px] text-slate-300">
              atualizado às {horaAtualizada}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : erro || !pulso || !pedidosHoje || !kpis ? (
        <ErroState erro={erro} onRetry={() => carregar()} />
      ) : (
        <>
          {pulso.atrasados > 0 && <BadgeAtrasados count={pulso.atrasados} />}
          {devedores && devedores.devedores.length > 0 && (
            <BadgeDevedores count={devedores.devedores.length} totalDevido={devedores.total_devido} />
          )}
          <PulsoOperacional contagens={pulso.contagens} total={pulso.total} />
          <PedidosHoje pedidos={pedidosHoje} />
          <SinaisDeGestao kpis={kpis} />
        </>
      )}
    </div>
  )
}