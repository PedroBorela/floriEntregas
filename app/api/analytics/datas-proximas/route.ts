import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function diasAte(iso: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const [anoStr, mesStr, diaStr] = iso.split('-')
  const ano = parseInt(anoStr)
  const mes = parseInt(mesStr) - 1
  const dia = parseInt(diaStr)
  const anoBase = ano > 0 ? ano : hoje.getFullYear()
  let proxima = new Date(anoBase, mes, dia)
  proxima.setHours(0, 0, 0, 0)
  if (proxima < hoje) proxima = new Date(hoje.getFullYear() + 1, mes, dia)
  if (proxima < hoje) proxima.setFullYear(proxima.getFullYear() + 1)
  return Math.round((proxima.getTime() - hoje.getTime()) / 86400000)
}

export async function GET() {
  const { data } = await supabase
    .from('cliente_datas')
    .select('id, nome, data, cliente_id, clientes(id, nome)')

  if (!data?.length) return NextResponse.json([])

  return NextResponse.json(
    data
      .filter(d => d.data)
      .map(d => ({ ...d, dias: diasAte(d.data as string) }))
      .filter(d => d.dias <= 60)
      .sort((a, b) => a.dias - b.dias)
  )
}
