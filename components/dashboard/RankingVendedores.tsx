import { formatarMoeda } from '@/lib/formatters'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export type VendedorHoje = { id: string; nome: string; pedidos: number; receita: number }

function Grafico({ vendedores }: Readonly<{ vendedores: VendedorHoje[] | null }>) {
  if (vendedores === null) {
    return <div className="h-40 animate-pulse bg-slate-50 rounded-xl" />
  }
  if (vendedores.length === 0) {
    return <p className="text-sm text-slate-600 text-center py-6">Nenhum pedido registrado hoje ainda</p>
  }
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={vendedores}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis
            dataKey="nome"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
            width={90}
          />
          <Tooltip
            formatter={(value: any) => [formatarMoeda(Number(value) || 0), 'Receita']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '10px 14px' }}
          />
          <Bar dataKey="receita" fill="#166534" radius={[0, 6, 6, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function RankingVendedores({ vendedores }: Readonly<{ vendedores: VendedorHoje[] | null }>) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">Ranking do dia</h2>
      <Grafico vendedores={vendedores} />
    </div>
  )
}
