'use client'

import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import type { ClienteNota } from '@/lib/types'

const TIPOS = [
  { value: 'preferencia', label: 'Preferência', icon: Star,          cor: 'bg-purple-100 text-purple-700' },
  { value: 'observacao',  label: 'Observação',  icon: MessageSquare, cor: 'bg-amber-100 text-amber-700'  },
] as const

interface Props {
  clienteId: string
  notas: ClienteNota[]
  onChange: (notas: ClienteNota[]) => void
}

export default function NotasCliente({ clienteId, notas, onChange }: Readonly<Props>) {
  const [tipo, setTipo] = useState<'preferencia' | 'observacao'>('preferencia')
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function adicionar() {
    if (!texto.trim()) { setErro('Informe o texto.'); return }
    setErro('')
    setSalvando(true)
    const res = await fetch(`/api/clientes/${clienteId}/notas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, texto }),
    })
    setSalvando(false)
    if (res.ok) {
      const json = await res.json()
      onChange([...notas, json.nota])
      setTexto('')
    } else {
      const json = await res.json()
      setErro(json.error ?? 'Erro ao salvar.')
    }
  }

  async function remover(id: string) {
    const res = await fetch(`/api/clientes/${clienteId}/notas/${id}`, { method: 'DELETE' })
    if (res.ok) onChange(notas.filter((n) => n.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* Lista agrupada por tipo */}
      {notas.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {notas.map((n) => {
            const def = TIPOS.find((t) => t.value === n.tipo)!
            const Icon = def.icon
            return (
              <li key={n.id} className="flex items-start justify-between py-2.5 gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className={`mt-0.5 inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium ${def.cor}`}>
                    <Icon size={10} />
                    {def.label}
                  </span>
                  <p className="text-sm text-gray-800 leading-snug">{n.texto}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remover(n.id)}
                  className="text-gray-300 hover:text-red-400 transition text-lg leading-none shrink-0 mt-0.5"
                  aria-label="Remover"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 italic">Nenhuma nota cadastrada.</p>
      )}

      {/* Formulário de adição */}
      <div className="pt-2 border-t border-gray-100 space-y-2">
        <p className="text-xs text-gray-500 font-medium">Adicionar nota</p>
        <div className="flex gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => { setTipo(t.value); setErro('') }}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${
                tipo === t.value
                  ? 'bg-green-800 text-white border-green-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="form-input flex-1"
            placeholder={tipo === 'preferencia' ? 'Ex: prefere rosas, não gosta de orquídeas...' : 'Ex: cliente VIP, liga antes de entregar...'}
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setErro('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }}
          />
          <button
            type="button"
            onClick={adicionar}
            disabled={salvando}
            className="px-4 py-1.5 text-sm font-medium text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50 shrink-0"
          >
            {salvando ? '...' : '+ Adicionar'}
          </button>
        </div>
        {erro && <p className="text-xs text-red-500">{erro}</p>}
      </div>
    </div>
  )
}
