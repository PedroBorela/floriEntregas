import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params
  const digits = cep.replace(/\D/g, '')

  if (digits.length !== 8) {
    return NextResponse.json({ erro: 'CEP inválido' }, { status: 400 })
  }

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 86400 },
  })

  if (!res.ok) return NextResponse.json({ erro: 'Falha ao consultar ViaCEP' }, { status: 502 })

  const data = await res.json()
  if (data.erro) return NextResponse.json({ erro: 'CEP não encontrado' }, { status: 404 })

  return NextResponse.json(data)
}
