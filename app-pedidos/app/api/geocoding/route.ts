import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.trim().length < 3) return NextResponse.json([])

  const query = `${q}, Manhuaçu, MG, Brasil`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'NaturezaEmFlores/1.0 (pborela2014@gmail.com)',
      'Accept-Language': 'pt-BR',
    },
  })

  if (!res.ok) return NextResponse.json([])

  const data = await res.json()
  return NextResponse.json(data)
}
