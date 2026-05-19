'use client'

export default function HeaderSaudacao() {
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  return (
    <div>
      <p className="text-xs uppercase tracking-widest font-semibold text-green-800 opacity-60">
        Natureza Em Flores · Painel do dia
      </p>
      <p className="text-2xl font-medium text-slate-800 mt-1">
        {saudacao}{' '}
        <span className="text-slate-600 font-normal">— {dataFormatada}</span>
      </p>
    </div>
  )
}