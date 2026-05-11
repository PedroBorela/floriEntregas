'use client'

import { CATEGORIAS_PRODUTO } from '@/lib/types'

interface Props {
  categoriaSelecionada: string | null
  onChange: (cat: string | null) => void
  contagens?: Record<string, number>
}

export default function FiltroCategorias({ categoriaSelecionada, onChange, contagens }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          categoriaSelecionada === null
            ? 'bg-green-800 text-white border-green-800'
            : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-800'
        }`}
      >
        Todas {contagens && <span className="opacity-70 ml-1">({Object.values(contagens).reduce((a, b) => a + b, 0)})</span>}
      </button>

      {CATEGORIAS_PRODUTO.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(categoriaSelecionada === cat ? null : cat)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            categoriaSelecionada === cat
              ? 'bg-green-800 text-white border-green-800'
              : 'bg-white text-gray-700 border-gray-300 hover:border-green-600 hover:text-green-800'
          }`}
        >
          {cat}
          {contagens?.[cat] !== undefined && (
            <span className="opacity-70 ml-1">({contagens[cat]})</span>
          )}
        </button>
      ))}
    </div>
  )
}
