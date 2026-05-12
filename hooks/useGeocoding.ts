'use client'

import { useState, useEffect, useRef } from 'react'

export interface SugestaoEndereco {
  display_name: string
  lat: string
  lon: string
  address: {
    road?: string
    suburb?: string
    neighbourhood?: string
    city_district?: string
  }
}

export function useGeocoding(termo: string, delay = 500) {
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([])
  const [buscando, setBuscando] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const q = termo.trim()
    if (q.length < 3) {
      setSugestoes([])
      return
    }

    timer.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/geocoding?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSugestoes(Array.isArray(data) ? data : [])
      } catch {
        setSugestoes([])
      } finally {
        setBuscando(false)
      }
    }, delay)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [termo, delay])

  return { sugestoes, buscando }
}
