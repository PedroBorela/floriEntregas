'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ZonaFrete {
  id: string
  nome: string
  bairros: string[]
  valor: number
}

export function useFrete(bairro: string) {
  const [zonas, setZonas] = useState<ZonaFrete[]>([])
  const [zonaMatch, setZonaMatch] = useState<ZonaFrete | null>(null)
  const [semZona, setSemZona] = useState(false)

  useEffect(() => {
    supabase
      .from('zonas_frete')
      .select('id, nome, bairros, valor')
      .eq('ativo', true)
      .then(({ data }) => setZonas(data ?? []))
  }, [])

  useEffect(() => {
    const b = bairro.trim().toLowerCase()
    if (!b || zonas.length === 0) {
      setZonaMatch(null)
      setSemZona(false)
      return
    }
    const match = zonas.find((z) =>
      z.bairros.some((zb) => zb.toLowerCase() === b)
    )
    setZonaMatch(match ?? null)
    setSemZona(!match)
  }, [bairro, zonas])

  return { zonaMatch, semZona }
}
