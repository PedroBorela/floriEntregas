'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProdutoCatalogo } from '@/lib/types'

export type { ProdutoCatalogo }

export function useProdutos(termo: string, categoria?: string | null, delay = 300) {
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
      let query = supabase
        .from('produtos_catalogo')
        .select('id, nome, preco_padrao, tamanho, categoria, dica_cuidado, imagem_url, ativo, created_at')
        .ilike('nome', `%${q}%`)
        .eq('ativo', true)
        .limit(10)

      if (categoria) {
        query = query.eq('categoria', categoria)
      }

      const { data } = await query
      setSugestoes((data as ProdutoCatalogo[]) ?? [])
      setBuscando(false)
    }, delay)

    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [termo, categoria, delay])

  return { sugestoes, buscando }
}
