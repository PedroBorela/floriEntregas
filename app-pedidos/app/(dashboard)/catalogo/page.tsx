'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProdutoCatalogo } from '@/lib/types'
import CardProduto from '@/components/catalogo/CardProduto'
import FiltroCategorias from '@/components/catalogo/FiltroCategorias'

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [apenasAtivos, setApenasAtivos] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const { data } = await supabase
        .from('produtos_catalogo')
        .select('*')
        .order('categoria')
        .order('nome')
      setProdutos((data as ProdutoCatalogo[]) ?? [])
      setCarregando(false)
    }
    carregar()
  }, [])

  const contagens = useMemo(() => {
    const base = apenasAtivos ? produtos.filter((p) => p.ativo) : produtos
    return base.reduce<Record<string, number>>((acc, p) => {
      if (p.categoria) acc[p.categoria] = (acc[p.categoria] ?? 0) + 1
      return acc
    }, {})
  }, [produtos, apenasAtivos])

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      if (apenasAtivos && !p.ativo) return false
      if (categoria && p.categoria !== categoria) return false
      if (busca.trim().length > 0) {
        const termo = busca.toLowerCase()
        return (
          p.nome.toLowerCase().includes(termo) ||
          p.categoria?.toLowerCase().includes(termo) ||
          p.tamanho?.toLowerCase().includes(termo)
        )
      }
      return true
    })
  }, [produtos, busca, categoria, apenasAtivos])

  async function handlePrecoChange(id: string, preco: number) {
    await supabase
      .from('produtos_catalogo')
      .update({ preco_padrao: preco })
      .eq('id', id)
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, preco_padrao: preco } : p))
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    await supabase
      .from('produtos_catalogo')
      .update({ ativo })
      .eq('id', id)
    setProdutos((prev) => prev.map((p) => p.id === id ? { ...p, ativo } : p))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-green-900">Catálogo de Produtos</h1>
        <span className="text-sm text-gray-500">
          {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Barra de busca + toggle ativos */}
      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar por nome, categoria ou tamanho..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 form-input"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={apenasAtivos}
            onChange={(e) => setApenasAtivos(e.target.checked)}
            className="accent-green-700 w-4 h-4"
          />
          Só ativos
        </label>
      </div>

      {/* Filtros por categoria */}
      <div className="mb-5">
        <FiltroCategorias
          categoriaSelecionada={categoria}
          onChange={setCategoria}
          contagens={contagens}
        />
      </div>

      {/* Grid de produtos */}
      {carregando ? (
        <div className="text-center py-16 text-gray-400">Carregando catálogo...</div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhum produto encontrado.
          {busca && (
            <button onClick={() => setBusca('')} className="ml-2 text-green-700 hover:underline">
              Limpar busca
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {produtosFiltrados.map((p) => (
            <CardProduto
              key={p.id}
              produto={p}
              onPrecoChange={handlePrecoChange}
              onToggleAtivo={handleToggleAtivo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
