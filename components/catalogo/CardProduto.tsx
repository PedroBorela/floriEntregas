'use client'

import { useState } from 'react'
import type { ProdutoCatalogo } from '@/lib/types'
import { formatarMoeda } from '@/lib/formatters'

const CORES_CATEGORIA: Record<string, string> = {
  Vaso:      'bg-green-100 text-green-800 border-green-200',
  Orquídea:  'bg-purple-100 text-purple-800 border-purple-200',
  Folhagem:  'bg-emerald-100 text-emerald-800 border-emerald-200',
  Flor:      'bg-pink-100 text-pink-800 border-pink-200',
  Árvore:    'bg-lime-100 text-lime-800 border-lime-200',
  Corte:     'bg-orange-100 text-orange-800 border-orange-200',
  Especiais: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

interface Props {
  produto: ProdutoCatalogo
  onPrecoChange?: (id: string, preco: number) => void
  onToggleAtivo?: (id: string, ativo: boolean) => void
  onEditar?: (produto: ProdutoCatalogo) => void
}

export default function CardProduto({ produto, onPrecoChange, onToggleAtivo, onEditar }: Readonly<Props>) {
  const [dicaAberta, setDicaAberta] = useState(false)
  const [editandoPreco, setEditandoPreco] = useState(false)
  const [precoTemp, setPrecoTemp] = useState(String(produto.preco_padrao))
  const [imgError, setImgError] = useState(false)

  const corCategoria = CORES_CATEGORIA[produto.categoria ?? ''] ?? 'bg-gray-100 text-gray-700 border-gray-200'

  function confirmarPreco() {
    const novo = parseFloat(precoTemp)
    if (!isNaN(novo) && novo > 0) {
      onPrecoChange?.(produto.id, novo)
    } else {
      setPrecoTemp(String(produto.preco_padrao))
    }
    setEditandoPreco(false)
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow ${!produto.ativo ? 'opacity-50' : ''}`}>
      {/* Imagem */}
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        {produto.imagem_url && !imgError ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            🌸
          </div>
        )}

        {/* Badge tamanho */}
        {produto.tamanho && (
          <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
            {produto.tamanho}
          </span>
        )}

        {/* Toggle ativo */}
        {onToggleAtivo && (
          <button
            type="button"
            onClick={() => onToggleAtivo(produto.id, !produto.ativo)}
            className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full shadow-sm font-medium transition-colors ${
              produto.ativo
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            {produto.ativo ? 'Ativo' : 'Inativo'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        {/* Categoria */}
        {produto.categoria && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-fit ${corCategoria}`}>
            {produto.categoria}
          </span>
        )}

        {/* Nome */}
        <p className="font-semibold text-gray-900 text-sm leading-tight">{produto.nome}</p>

        {/* Preço */}
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          {editandoPreco ? (
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xs text-gray-500">R$</span>
              <input
                type="number"
                className="w-20 text-sm border border-green-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={precoTemp}
                min="0"
                step="0.01"
                onChange={(e) => setPrecoTemp(e.target.value)}
                onBlur={confirmarPreco}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmarPreco() }}
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onPrecoChange && setEditandoPreco(true)}
              className={`text-base font-bold text-orange-600 ${onPrecoChange ? 'hover:text-orange-800 cursor-pointer' : 'cursor-default'}`}
              title={onPrecoChange ? 'Clique para editar o preço' : undefined}
            >
              {formatarMoeda(produto.preco_padrao)}
            </button>
          )}
        </div>

        {/* Botão editar */}
        {onEditar && (
          <button
            type="button"
            onClick={() => onEditar(produto)}
            className="mt-1 text-xs text-green-700 border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50 transition self-start"
          >
            Editar
          </button>
        )}

        {/* Dica de cuidado */}
        {produto.dica_cuidado && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setDicaAberta((v) => !v)}
              className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
            >
              <span>{dicaAberta ? '▲' : '▼'}</span>
              <span>Dica de cuidado</span>
            </button>
            {dicaAberta && (
              <p className="mt-1 text-xs text-gray-600 bg-orange-50 border border-orange-100 rounded p-2 leading-relaxed">
                {produto.dica_cuidado}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
