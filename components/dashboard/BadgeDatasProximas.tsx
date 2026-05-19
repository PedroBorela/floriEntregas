import { Calendar } from 'lucide-react'
import Link from 'next/link'
import type { DataProxima } from './DatasProximas'

function labelDias(dias: number): string {
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  return `em ${dias} dias`
}

export default function BadgeDatasProximas({ datas }: Readonly<{ datas: DataProxima[] }>) {
  if (!datas.length) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Calendar size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900 mb-2">
            {datas.length === 1 ? '1 data especial' : `${datas.length} datas especiais`} chegando esta semana
          </p>
          <div className="flex flex-wrap gap-1.5">
            {datas.map((d) => (
              <Link
                key={d.id}
                href={d.clientes ? `/clientes/${d.clientes.id}` : '#'}
                className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full hover:bg-amber-200 transition-colors"
              >
                {d.clientes?.nome ?? '—'} — {d.nome} ({labelDias(d.dias)})
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
