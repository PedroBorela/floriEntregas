import { NextRequest, NextResponse } from 'next/server'

const HEADERS = {
  'User-Agent': 'NaturezaEmFlores/1.0 (pborela2014@gmail.com)',
  'Accept-Language': 'pt-BR',
}

async function buscar(query: string, limit: number): Promise<object[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}`
  try {
    const res = await fetch(url, { headers: HEADERS })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 3) return NextResponse.json([])

  const manhuacu = await buscar(`${q}, Manhuaçu, MG, Brasil`, 5)

  if (manhuacu.length >= 3) {
    return NextResponse.json(manhuacu.slice(0, 5))
  }

  const geral = await buscar(`${q}, MG, Brasil`, 5)
  const vistos = new Set(manhuacu.map((r: any) => r.display_name as string))
  const merged = [...manhuacu, ...geral.filter((r: any) => !vistos.has(r.display_name as string))]

  return NextResponse.json(merged.slice(0, 5))
}
