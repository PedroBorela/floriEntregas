import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatarMoeda } from '@/lib/formatters'

export type KpiDia = { receita: number; pedidos: number; ticket: number }

export type KpisData = {
  hoje: KpiDia & { a_receber: number }
  semana_passada: KpiDia
  mes_passado: KpiDia
  variacoes: {
    receita_7d: number | null
    receita_28d: number | null
    pedidos_7d: number | null
    pedidos_28d: number | null
    ticket_7d: number | null
    ticket_28d: number | null
  }
}

function Variacao({ pct, label }: Readonly<{ pct: number | null; label: string }>) {
  if (pct === null) {
    return <span className="text-[10px] text-slate-300">{label}: sem comparativo</span>
  }
  const abs = Math.abs(pct)
  const estavel = abs < 3
  const positivo = pct > 0
  const cor = estavel ? 'text-slate-400' : positivo ? 'text-green-600' : 'text-red-500'
  const Icon = estavel ? Minus : positivo ? TrendingUp : TrendingDown

  return (
    <div className={`flex items-center gap-1 ${cor}`}>
      <Icon size={11} />
      <span className="text-[10px] font-semibold">
        {positivo && !estavel ? '+' : ''}
        {pct.toFixed(1)}% {label}
      </span>
    </div>
  )
}

function KpiCard({
  label,
  valor,
  var7d,
  var28d,
  valorCor,
}: Readonly<{
  label: string
  valor: string
  var7d: number | null
  var28d: number | null
  valorCor?: string
}>) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-[22px] font-bold mt-1 leading-none ${valorCor ?? 'text-slate-800'}`}>
        {valor}
      </p>
      <hr className="my-3 border-slate-100" />
      <div className="space-y-1">
        <Variacao pct={var7d} label="vs. sem. passada" />
        <Variacao pct={var28d} label="vs. mês passado" />
      </div>
    </div>
  )
}

export default function SinaisDeGestao({ kpis }: Readonly<{ kpis: KpisData }>) {
  const { hoje, variacoes } = kpis

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Sinais de gestão
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Receita hoje"
          valor={formatarMoeda(hoje.receita)}
          var7d={variacoes.receita_7d}
          var28d={variacoes.receita_28d}
        />
        <KpiCard
          label="Pedidos hoje"
          valor={String(hoje.pedidos)}
          var7d={variacoes.pedidos_7d}
          var28d={variacoes.pedidos_28d}
        />
        <KpiCard
          label="Ticket médio"
          valor={formatarMoeda(hoje.ticket)}
          var7d={variacoes.ticket_7d}
          var28d={variacoes.ticket_28d}
        />
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            A receber
          </p>
          <p
            className={`text-[22px] font-bold mt-1 leading-none ${
              hoje.a_receber > 0 ? 'text-rose-600' : 'text-green-700'
            }`}
          >
            {formatarMoeda(hoje.a_receber)}
          </p>
          <hr className="my-3 border-slate-100" />
          <p className="text-[10px] text-slate-400">saldo total em aberto</p>
        </div>
      </div>
    </section>
  )
}