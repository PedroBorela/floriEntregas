'use client'

import { useState } from 'react'
import ProdutoLinhaItem from '@/components/produtos/ProdutoLinhaItem'
import { formatarMoeda } from '@/lib/formatters'
import { CATEGORIAS_PRODUTO } from '@/lib/types'

export interface ItemPedido {
  nome_produto: string
  valor_unitario: number
  quantidade: number
  observacao?: string
}

interface CampoProdutosProps {
  itens: ItemPedido[]
  onChange: (itens: ItemPedido[]) => void
}

export default function CampoProdutos({ itens, onChange }: CampoProdutosProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)

  function addItem() {
    onChange([...itens, { nome_produto: '', valor_unitario: 0, quantidade: 1 }])
  }

  function removeItem(idx: number) {
    onChange(itens.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, item: ItemPedido) {
    onChange(itens.map((it, i) => (i === idx ? item : it)))
  }

  const total = itens.reduce((sum, i) => sum + i.valor_unitario * i.quantidade, 0)

  return (
    <div>
      {/* Chips de filtro por categoria */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          type="button"
          onClick={() => setCategoriaAtiva(null)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            categoriaAtiva === null
              ? 'bg-green-800 text-white border-green-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-800'
          }`}
        >
          Todas
        </button>
        {CATEGORIAS_PRODUTO.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoriaAtiva(categoriaAtiva === cat ? null : cat)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              categoriaAtiva === cat
                ? 'bg-green-800 text-white border-green-800'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-600 hover:text-green-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {itens.map((item, idx) => (
          <ProdutoLinhaItem
            key={idx}
            item={item}
            onChange={(updated) => updateItem(idx, updated)}
            onRemove={() => removeItem(idx)}
            podRemover={itens.length > 1}
            categoriaFiltro={categoriaAtiva}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 text-sm text-green-800 hover:text-green-900 font-medium flex items-center gap-1"
      >
        + Adicionar produto
      </button>

      {itens.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Total dos produtos</span>
          <span className="font-semibold text-green-900">{formatarMoeda(total)}</span>
        </div>
      )}
    </div>
  )
}
