'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProdutoCatalogo {
  id: string
  nome: string
  preco_padrao: number
}

export function useProdutos(termo: string, delay = 300) {
  const [sugestoes, setSugestoes] = useState<ProdutoCatalogo[]>([])
  const [buscando, setBuscando] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const q = termo.trim()
    if (q.length < 2) {
      setSugestoes([])
      return
    }

    timer.current = setTimeout(async () => {
      setBuscando(true)
      const { data } = await supabase
        .from('produtos_catalogo')
        .select('id, nome, preco_padrao')
        .ilike('nome', `%${q}%`)
        .eq('ativo', true)
        .limit(8)
      setSugestoes(data ?? [])
      setBuscando(false)
    }, delay)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [termo, delay])

  return { sugestoes, buscando }
}
