'use client'

import { CalendarHeart, Trophy } from 'lucide-react'

type VendedorItem = {
  vendedor_id: string
  nome: string
  total: number
}

export type MetaDatasData = {
  meta: number
  total: number
  pct: number
  bateu_meta: boolean
  por_vendedor: VendedorItem[]
}

const HOJE = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

export default function TermometroDatas({ data }: Readonly<{ data: MetaDatasData }>) {
  const { meta, total, pct, bateu_meta, por_vendedor } = data
  let corBarra = 'bg-slate-400'
  if (pct >= 70) corBarra = 'bg-amber-400'
  if (bateu_meta) corBarra = 'bg-green-500'

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${
      bateu_meta
        ? 'bg-green-50 border-green-200'
        : 'bg-white border-slate-100 shadow-sm'
    }`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${bateu_meta ? 'bg-green-100' : 'bg-slate-100'}`}>
            {bateu_meta
              ? <Trophy size={16} className="text-green-700" />
              : <CalendarHeart size={16} className="text-slate-500" />
            }
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Meta de Datas Especiais</p>
            <p className="text-xs text-slate-400 capitalize">{HOJE}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-2xl font-black leading-none ${bateu_meta ? 'text-green-700' : 'text-slate-800'}`}>
            {total}<span className="text-sm font-medium text-slate-400">/{meta}</span>
          </p>
          {bateu_meta && (
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mt-0.5">Meta batida!</p>
          )}
        </div>
      </div>

      {/* Barra termômetro */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${corBarra}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
          <span>0</span>
          <span className={bateu_meta ? 'text-green-600 font-bold' : ''}>{pct}%</span>
          <span>{meta}</span>
        </div>
      </div>

      {/* Ranking por vendedor */}
      {por_vendedor.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Por vendedor</p>
          {por_vendedor.map((v) => (
            <div key={v.vendedor_id || 'sem'} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 flex-1 truncate">{v.nome}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${bateu_meta ? 'bg-green-400' : 'bg-slate-400'}`}
                    style={{ width: `${Math.min(100, (v.total / meta) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700 w-4 text-right">{v.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {por_vendedor.length === 0 && total === 0 && (
        <p className="text-xs text-slate-400 text-center pb-1">
          Nenhuma data cadastrada este mês ainda.
        </p>
      )}
    </div>
  )
}