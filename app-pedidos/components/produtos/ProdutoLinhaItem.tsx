'use client'

import { useState, useRef, useEffect } from 'react'
import { useProdutos } from '@/hooks/useProdutos'
import { formatarMoeda } from '@/lib/formatters'
import type { ItemPedido } from '@/components/formulario/CampoProdutos'

interface Props {
  item: ItemPedido
  onChange: (item: ItemPedido) => void
  onRemove: () => void
  podRemover: boolean
}

export default function ProdutoLinhaItem({ item, onChange, onRemove, podRemover }: Props) {
  const [termoBusca, setTermoBusca] = useState(item.nome_produto)
  const [aberto, setAberto] = useState(false)
  const [doCatalogo, setDoCatalogo] = useState(false)
  const { sugestoes, buscando } = useProdutos(termoBusca)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  function handleNomeChange(valor: string) {
    setTermoBusca(valor)
    setDoCatalogo(false)
    onChange({ ...item, nome_produto: valor })
    setAberto(valor.trim().length >= 2)
  }

  function selecionarSugestao(nome: string, preco: number) {
    setTermoBusca(nome)
    setDoCatalogo(true)
    setAberto(false)
    onChange({ ...item, nome_produto: nome, valor_unitario: preco })
  }

  function handlePrecoChange(valor: string) {
    onChange({ ...item, valor_unitario: parseFloat(valor) || 0 })
  }

  function handleQuantidade(delta: number) {
    onChange({ ...item, quantidade: Math.max(1, item.quantidade + delta) })
  }

  const subtotal = item.valor_unitario * item.quantidade

  return (
    <div className="flex gap-2 items-start">
      {/* Nome / autocomplete */}
      <div className="flex-1 relative" ref={wrapRef}>
        <input
          type="text"
          className="form-input"
          placeholder="Nome do produto"
          value={termoBusca}
          onChange={(e) => handleNomeChange(e.target.value)}
          onFocus={() => { if (termoBusca.trim().length >= 2) setAberto(true) }}
          autoComplete="off"
        />
        {aberto && (sugestoes.length > 0 || buscando) && (
          <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-auto text-sm">
            {buscando && (
              <li className="px-3 py-2 text-gray-400">Buscando...</li>
            )}
            {sugestoes.map((s) => (
              <li
                key={s.id}
                className="flex justify-between items-center px-3 py-2 hover:bg-green-50 cursor-pointer"
                onMouseDown={(e) => { e.preventDefault(); selecionarSugestao(s.nome, s.preco_padrao) }}
              >
                <span>{s.nome}</span>
                <span className="text-green-700 font-medium ml-4 shrink-0">{formatarMoeda(s.preco_padrao)}</span>
              </li>
            ))}
            {!buscando && sugestoes.length === 0 && (
              <li className="px-3 py-2 text-gray-400 italic">Nenhum produto no catálogo — use valor livre</li>
            )}
          </ul>
        )}
        {doCatalogo && (
          <span className="absolute right-2 top-2.5 text-xs text-green-600">catálogo</span>
        )}
      </div>

      {/* Valor unitário */}
      <div className="w-24">
        <input
          type="number"
          className="form-input"
          placeholder="R$ 0"
          min="0"
          step="0.01"
          value={item.valor_unitario || ''}
          onChange={(e) => handlePrecoChange(e.target.value)}
        />
      </div>

      {/* Quantidade */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleQuantidade(-1)}
          className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg leading-none"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantidade}</span>
        <button
          type="button"
          onClick={() => handleQuantidade(1)}
          className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="w-20 text-right text-sm text-gray-600 pt-2 shrink-0">
        {formatarMoeda(subtotal)}
      </div>

      {/* Remover */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!podRemover}
        className="text-red-400 hover:text-red-600 pt-2 text-lg disabled:opacity-20"
        aria-label="Remover"
      >
        ×
      </button>
    </div>
  )
}
