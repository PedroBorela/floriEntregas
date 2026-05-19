'use client'

import { useState, useEffect } from 'react'
import { Gift } from 'lucide-react'
import type { ClienteData, Vendedor } from '@/lib/types'

const SUGESTOES = ['Aniversário', 'Data de casamento']

interface Props {
  clienteId: string | null
  datas: ClienteData[]
  onChange: (datas: ClienteData[]) => void
}

function formatarDataExibicao(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function formatarDataCompleta(iso: string) {
  const [ano, mes, dia] = iso.split('-')
  if (!ano || ano === '0000') return `${dia}/${mes}`
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function DatasEspeciais({ clienteId, datas, onChange }: Props) {
  const [novoNome, setNovoNome] = useState('')
  const [novaData, setNovaData] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch('/api/vendedores')
      .then((r) => r.json())
      .then((d: { vendedores?: Vendedor[] }) => setVendedores(Array.isArray(d.vendedores) ? d.vendedores.filter((v) => v.ativo) : []))
      .catch(() => {})
  }, [])

  async function adicionarData() {
    if (!clienteId) return
    if (!novoNome.trim() || !novaData) {
      setErro('Informe o nome e a data.')
      return
    }
    setErro('')
    setSalvando(true)

    const res = await fetch(`/api/clientes/${clienteId}/datas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: novoNome.trim(),
        data: novaData,
        vendedor_id: vendedorId || null,
      }),
    })

    setSalvando(false)
    if (res.ok) {
      const json = await res.json()
      onChange([...datas, json.data])
      setNovoNome('')
      setNovaData('')
      setVendedorId('')
    } else {
      const json = await res.json()
      setErro(json.error ?? 'Erro ao salvar.')
    }
  }

  async function removerData(id: string) {
    const res = await fetch(`/api/clientes/${clienteId}/datas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      onChange(datas.filter((d) => d.id !== id))
    }
  }

  function usarSugestao(nome: string) {
    setNovoNome(nome)
    setErro('')
  }

  function diasAte(iso: string): number | null {
    try {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const [ano, mes, dia] = iso.split('-').map(Number)
      const anoAlvo = ano && ano > 0 ? ano : hoje.getFullYear()
      let proxima = new Date(anoAlvo, mes - 1, dia)
      if (proxima < hoje) proxima = new Date(hoje.getFullYear() + (ano > 0 ? 0 : 1), mes - 1, dia)
      if (proxima < hoje) proxima.setFullYear(proxima.getFullYear() + 1)
      return Math.round((proxima.getTime() - hoje.getTime()) / 86400000)
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-3">
      {/* Lista de datas existentes */}
      {datas.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {datas.map((d) => {
            const faltam = diasAte(d.data)
            return (
              <li key={d.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Gift size={18} className="shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800">{d.nome}</p>
                    <p className="text-xs text-gray-500">
                      {formatarDataCompleta(d.data)}
                      {d.vendedor_nome && (
                        <span className="ml-1.5 text-green-700">· {d.vendedor_nome}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {faltam !== null && faltam <= 30 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      faltam === 0
                        ? 'bg-green-100 text-green-700'
                        : faltam <= 7
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {faltam === 0 ? 'Hoje!' : `${faltam}d`}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removerData(d.id)}
                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none"
                    aria-label="Remover"
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic">Nenhuma data especial cadastrada.</p>
      )}

      {/* Formulário de nova data */}
      <div className="pt-2 border-t border-gray-100 space-y-2">
        <p className="text-xs text-gray-500 font-medium">Adicionar data especial</p>

        {/* Chips de sugestão */}
        <div className="flex gap-1.5 flex-wrap">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => usarSugestao(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                novoNome === s
                  ? 'bg-green-800 text-white border-green-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            className="form-input flex-1"
            placeholder="Nome da data (ex: Aniversário)"
            value={novoNome}
            onChange={(e) => { setNovoNome(e.target.value); setErro('') }}
          />
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="date"
              className="form-input flex-1 md:w-40 md:shrink-0"
              value={novaData}
              onChange={(e) => { setNovaData(e.target.value); setErro('') }}
            />
            <button
              type="button"
              onClick={adicionarData}
              disabled={salvando || !clienteId}
              title={!clienteId ? 'Selecione um cliente existente para adicionar datas' : undefined}
              className="px-4 py-1.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50 shrink-0"
            >
              {salvando ? '...' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {/* Seletor de vendedor */}
        {vendedores.length > 0 && (
          <select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            className="form-input w-full text-sm text-gray-600"
          >
            <option value="">Vendedor que cadastrou (opcional)</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>{v.nome}</option>
            ))}
          </select>
        )}

        {!clienteId && (
          <p className="text-xs text-amber-600">Cliente novo — datas poderão ser adicionadas após salvar o pedido.</p>
        )}
        {erro && <p className="text-xs text-red-500">{erro}</p>}
      </div>
    </div>
  )
}