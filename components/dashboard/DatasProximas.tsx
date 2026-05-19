import Link from 'next/link'

export interface DataProxima {
  id: string
  nome: string
  data: string
  cliente_id: string
  clientes: { id: string; nome: string } | null
  dias: number
}

function labelDias(dias: number): { texto: string; cor: string } {
  if (dias === 0) return { texto: 'Hoje!', cor: 'bg-green-100 text-green-800' }
  if (dias === 1) return { texto: 'Amanhã', cor: 'bg-green-100 text-green-700' }
  if (dias <= 7) return { texto: `em ${dias} dias`, cor: 'bg-amber-100 text-amber-800' }
  if (dias <= 30) return { texto: `em ${dias} dias`, cor: 'bg-blue-100 text-blue-700' }
  return { texto: `em ${dias} dias`, cor: 'bg-gray-100 text-gray-600' }
}

function formatarDataExibicao(iso: string) {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

function Conteudo({ datas }: Readonly<{ datas: DataProxima[] | null }>) {
  if (datas === null) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-12 bg-slate-50 rounded-xl" />
        ))}
      </div>
    )
  }
  if (datas.length === 0) {
    return <p className="text-sm text-slate-600 text-center py-4">Nenhuma data especial nos próximos 60 dias</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {datas.slice(0, 8).map((d) => {
        const { texto, cor } = labelDias(d.dias)
        return (
          <Link
            key={d.id}
            href={d.clientes ? `/clientes/${d.clientes.id}?from=/dashboard` : '#'}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-base shrink-0">
              🎂
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-green-800 transition-colors">
                {d.clientes?.nome ?? '—'}
              </p>
              <p className="text-xs text-slate-600 truncate">{d.nome} · {formatarDataExibicao(d.data)}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cor}`}>
              {texto}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default function DatasProximas({ datas }: Readonly<{ datas: DataProxima[] | null }>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Datas especiais próximas</h2>
      <Conteudo datas={datas} />
    </div>
  )
}
