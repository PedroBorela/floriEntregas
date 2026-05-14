'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { Vendedor } from '@/lib/types'

export default function VendedoresPage() {
  const { toast } = useToast()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const res = await fetch('/api/vendedores')
    const json = await res.json()
    setVendedores(json.vendedores ?? [])
    setLoading(false)
  }

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    setSalvando(true)
    const res = await fetch('/api/vendedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome }),
    })
    setSalvando(false)
    if (res.ok) {
      const json = await res.json()
      setVendedores((prev) => [...prev, json.vendedor].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovoNome('')
    } else {
      const err = await res.json()
      toast(err.error)
    }
  }

  async function toggleAtivo(v: Vendedor) {
    const res = await fetch(`/api/vendedores/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !v.ativo }),
    })
    if (res.ok) {
      setVendedores((prev) => prev.map((x) => x.id === v.id ? { ...x, ativo: !v.ativo } : x))
    }
  }

  async function salvarEdicao(id: string) {
    if (!editNome.trim()) return
    const res = await fetch(`/api/vendedores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editNome }),
    })
    if (res.ok) {
      setVendedores((prev) => prev.map((x) => x.id === id ? { ...x, nome: editNome.trim() } : x))
      setEditandoId(null)
    } else {
      const err = await res.json()
      toast(err.error)
    }
  }

  const ativos = vendedores.filter((v) => v.ativo)
  const inativos = vendedores.filter((v) => !v.ativo)

  return (
    <div>
      <h1 className="text-xl font-bold text-green-900 mb-6">Vendedores</h1>

      <div className="section-card">
        <h2 className="section-title">Adicionar vendedor</h2>
        <form onSubmit={handleAdicionar} className="flex gap-2">
          <input
            className="form-input flex-1"
            placeholder="Nome do vendedor"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
          <button
            type="submit"
            disabled={salvando || !novoNome.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50 transition shrink-0"
          >
            {salvando ? '...' : 'Adicionar'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Carregando...</div>
      ) : (
        <>
          <div className="section-card">
            <h2 className="section-title">Ativos ({ativos.length})</h2>
            {ativos.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum vendedor ativo.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {ativos.map((v) => (
                  <div key={v.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                    {editandoId === v.id ? (
                      <>
                        <input
                          autoFocus
                          className="form-input flex-1 text-sm"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao(v.id)
                            if (e.key === 'Escape') setEditandoId(null)
                          }}
                        />
                        <button
                          onClick={() => salvarEdicao(v.id)}
                          className="text-xs text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-50 transition"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-gray-800">{v.nome}</span>
                        <button
                          onClick={() => { setEditandoId(v.id); setEditNome(v.nome) }}
                          className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition"
                        >
                          Renomear
                        </button>
                        <button
                          onClick={() => toggleAtivo(v)}
                          className="text-xs text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition"
                        >
                          Desativar
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {inativos.length > 0 && (
            <div className="section-card opacity-70">
              <h2 className="section-title">Inativos ({inativos.length})</h2>
              <div className="divide-y divide-gray-100">
                {inativos.map((v) => (
                  <div key={v.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-400 line-through">{v.nome}</span>
                    <button
                      onClick={() => toggleAtivo(v)}
                      className="text-xs text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-50 transition"
                    >
                      Reativar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
