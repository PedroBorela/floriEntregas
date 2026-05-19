'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Gift } from 'lucide-react'
import { formatarDataHora } from '@/lib/formatters'
import type { Cliente } from '@/lib/types'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<'nome' | 'recente'>('recente')
  const [loading, setLoading] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    params.set('ordem', ordem)
    const res = await fetch(`/api/clientes?${params}`)
    const json = await res.json()
    setClientes(json.clientes ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [busca, ordem])

  useEffect(() => { carregar() }, [carregar])

  function proximaData(cliente: Cliente): { nome: string; diasAte: number } | null {
    if (!cliente.cliente_datas?.length) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    let melhor: { nome: string; diasAte: number } | null = null
    for (const d of cliente.cliente_datas) {
      const [, mes, dia] = d.data.split('-').map(Number)
      let proxima = new Date(hoje.getFullYear(), mes - 1, dia)
      if (proxima < hoje) proxima = new Date(hoje.getFullYear() + 1, mes - 1, dia)
      const dias = Math.round((proxima.getTime() - hoje.getTime()) / 86400000)
      if (!melhor || dias < melhor.diasAte) melhor = { nome: d.nome, diasAte: dias }
    }
    return melhor
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-green-900">Clientes</h1>
        <span className="text-sm text-gray-400">{total} cadastrado{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="section-card mb-4 space-y-2">
        <input
          className="form-input w-full"
          placeholder="Buscar por nome, telefone ou WhatsApp..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="flex gap-1.5">
          {([
            { value: 'nome', label: 'A–Z' },
            { value: 'recente', label: 'Mais recentes' },
          ] as const).map((op) => (
            <button
              key={op.value}
              onClick={() => setOrdem(op.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                ordem === op.value
                  ? 'bg-green-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum cliente encontrado.</div>
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => {
            const prox = proximaData(c)
            return (
              <Link key={c.id} href={`/clientes/${c.id}`} className="block">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-green-200 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{c.nome}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{c.telefone}</p>
                      {c.whatsapp && c.whatsapp !== c.telefone && (
                        <p className="text-xs text-gray-400">WhatsApp: {c.whatsapp}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">Cadastrado em {formatarDataHora(c.created_at)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {c.cliente_datas && c.cliente_datas.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {c.cliente_datas.length} data{c.cliente_datas.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {prox && prox.diasAte <= 30 && (
                        <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          prox.diasAte === 0
                            ? 'bg-green-100 text-green-700'
                            : prox.diasAte <= 7
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Gift size={12} className="inline-block mr-1" />{prox.nome} {prox.diasAte === 0 ? 'hoje!' : `em ${prox.diasAte}d`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
