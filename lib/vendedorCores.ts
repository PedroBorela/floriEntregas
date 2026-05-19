const PALETA = [
  { pill: 'bg-red-100 text-red-800 border-red-200',         ativo: 'bg-red-500 text-white border-red-500' },
  { pill: 'bg-orange-100 text-orange-800 border-orange-200', ativo: 'bg-orange-500 text-white border-orange-500' },
  { pill: 'bg-amber-100 text-amber-800 border-amber-200',    ativo: 'bg-amber-500 text-white border-amber-500' },
  { pill: 'bg-yellow-100 text-yellow-800 border-yellow-200', ativo: 'bg-yellow-500 text-white border-yellow-500' },
  { pill: 'bg-lime-100 text-lime-800 border-lime-200',       ativo: 'bg-lime-600 text-white border-lime-600' },
  { pill: 'bg-green-100 text-green-800 border-green-200',    ativo: 'bg-green-600 text-white border-green-600' },
  { pill: 'bg-emerald-100 text-emerald-800 border-emerald-200', ativo: 'bg-emerald-600 text-white border-emerald-600' },
  { pill: 'bg-teal-100 text-teal-800 border-teal-200',       ativo: 'bg-teal-600 text-white border-teal-600' },
  { pill: 'bg-cyan-100 text-cyan-800 border-cyan-200',       ativo: 'bg-cyan-600 text-white border-cyan-600' },
  { pill: 'bg-sky-100 text-sky-800 border-sky-200',          ativo: 'bg-sky-600 text-white border-sky-600' },
  { pill: 'bg-blue-100 text-blue-800 border-blue-200',       ativo: 'bg-blue-600 text-white border-blue-600' },
  { pill: 'bg-indigo-100 text-indigo-800 border-indigo-200', ativo: 'bg-indigo-600 text-white border-indigo-600' },
  { pill: 'bg-violet-100 text-violet-800 border-violet-200', ativo: 'bg-violet-600 text-white border-violet-600' },
  { pill: 'bg-purple-100 text-purple-800 border-purple-200', ativo: 'bg-purple-600 text-white border-purple-600' },
  { pill: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200', ativo: 'bg-fuchsia-600 text-white border-fuchsia-600' },
  { pill: 'bg-pink-100 text-pink-800 border-pink-200',       ativo: 'bg-pink-600 text-white border-pink-600' },
  { pill: 'bg-rose-100 text-rose-800 border-rose-200',       ativo: 'bg-rose-600 text-white border-rose-600' },
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + (id.codePointAt(i) ?? 0)) & 0xffffffff
  return Math.abs(h)
}

export function corVendedor(id: string) {
  return PALETA[hashId(id) % PALETA.length]
}
