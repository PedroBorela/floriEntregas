import Link from 'next/link'

export type PedidoHoje = {
  id: string
  codigo: string
  tipo: 'entrega' | 'retirada'
  status: string
  cliente_nome: string
  horario_entrega: string | null
  bairro: string | null
  itens_resumo: string
}

const STATUS_BADGE: Record<string, string> = {
  pendente:     'bg-slate-100 text-slate-600',
  em_preparo:   'bg-amber-100 text-amber-800',
  saiu_entrega: 'bg-blue-100 text-blue-800',
  entregue:     'bg-green-100 text-green-800',
  retirado:     'bg-green-100 text-green-800',
  cancelado:    'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pendente:     'Pendente',
  em_preparo:   'Em Preparo',
  saiu_entrega: 'A Caminho',
  entregue:     'Entregue',
  retirado:     'Retirado',
  cancelado:    'Cancelado',
}

export default function PedidosHoje({ pedidos }: Readonly<{ pedidos: PedidoHoje[] }>) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Pedidos de hoje ·{' '}
        <span className="text-slate-600">{pedidos.length}</span>
      </h2>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {pedidos.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            Nenhum pedido agendado para hoje
          </p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pedidos/${p.codigo}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="w-20 text-xs font-semibold text-slate-500 shrink-0 truncate">
                    {p.horario_entrega ?? '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {p.codigo} · {p.cliente_nome}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {p.itens_resumo}
                      {p.bairro ? ` · ${p.bairro}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[p.status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.tipo === 'entrega'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {p.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}