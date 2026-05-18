export type StatusContagens = {
  pendente: number
  em_preparo: number
  saiu_entrega: number
  entregue: number
  retirado: number
  vendido: number
  cancelado: number
}

const CONFIG: Record<keyof StatusContagens, { label: string; sub: string; bg: string; num: string }> = {
  pendente:     { label: 'Pendente',        sub: 'aguardando preparo',     bg: 'bg-slate-50',  num: 'text-slate-800' },
  em_preparo:   { label: 'Em Preparo',      sub: 'florista trabalhando',   bg: 'bg-slate-50',  num: 'text-slate-800' },
  saiu_entrega: { label: 'Saiu p/ Entrega', sub: 'a caminho do cliente',   bg: 'bg-amber-50',  num: 'text-amber-800' },
  entregue:     { label: 'Entregues',       sub: 'concluídos hoje',        bg: 'bg-green-50',  num: 'text-green-800' },
  retirado:     { label: 'Retirados',       sub: 'retirados na loja hoje', bg: 'bg-green-50',  num: 'text-green-800' },
  vendido:      { label: 'Vendidos',        sub: 'vendas no balcão hoje',  bg: 'bg-green-50',  num: 'text-green-800' },
  cancelado:    { label: 'Cancelados',      sub: 'cancelados hoje',        bg: 'bg-red-50',    num: 'text-red-700'  },
}

const ORDEM: (keyof StatusContagens)[] = [
  'pendente', 'em_preparo', 'saiu_entrega', 'entregue', 'retirado', 'vendido', 'cancelado',
]

export default function PulsoOperacional({
  contagens,
  total,
}: {
  contagens: StatusContagens
  total: number
}) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Pulso operacional ·{' '}
        <span className="text-slate-600">{total} pedidos</span>
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ORDEM.map((status) => {
          const { label, sub, bg, num } = CONFIG[status]
          return (
            <div
              key={status}
              className={`${bg} rounded-2xl p-4 border border-slate-100 text-center`}
            >
              <p className={`text-[22px] font-bold leading-none ${num}`}>
                {contagens[status]}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mt-2 leading-tight">
                {label}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{sub}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}