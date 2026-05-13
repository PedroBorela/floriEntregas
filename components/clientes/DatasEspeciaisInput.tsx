'use client'

const SUGESTOES = ['Aniversário', 'Data de casamento']

export interface DataEspecialRascunho {
  nome: string
  data: string
}

interface Props {
  value: DataEspecialRascunho[]
  onChange: (v: DataEspecialRascunho[]) => void
}

export default function DatasEspeciaisInput({ value, onChange }: Props) {
  function atualizar(idx: number, field: 'nome' | 'data', v: string) {
    onChange(value.map((d, i) => (i === idx ? { ...d, [field]: v } : d)))
  }

  function remover(idx: number) {
    const novo = value.filter((_, i) => i !== idx)
    onChange(novo.length > 0 ? novo : [{ nome: '', data: '' }])
  }

  return (
    <div className="space-y-2">
      {value.map((d, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex gap-1.5 flex-wrap">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => atualizar(idx, 'nome', d.nome === s ? '' : s)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  d.nome === s
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-green-600 hover:text-green-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Nome da data"
              value={d.nome}
              onChange={(e) => atualizar(idx, 'nome', e.target.value)}
            />
            <input
              type="date"
              className="form-input w-40 shrink-0"
              value={d.data}
              onChange={(e) => atualizar(idx, 'data', e.target.value)}
            />
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => remover(idx)}
                className="text-gray-300 hover:text-red-400 transition text-xl leading-none px-1"
                aria-label="Remover"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { nome: '', data: '' }])}
        className="text-xs text-green-700 hover:text-green-900 transition"
      >
        + Adicionar outra data
      </button>
    </div>
  )
}
