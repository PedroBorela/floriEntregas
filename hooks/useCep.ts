'use client'

import { useState, useCallback } from 'react'

export interface DadosCep {
  logradouro: string
  bairro: string
  cidade: string
  estado: string
}

export function useCep() {
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const buscarCep = useCallback(async (cep: string): Promise<DadosCep | null> => {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return null

    setBuscando(true)
    setErro(null)

    try {
      const res = await fetch(`/api/cep/${digits}`)
      const data = await res.json()

      if (!res.ok || data.erro) {
        setErro('CEP não encontrado')
        return null
      }

      if (data.uf && data.uf !== 'MG') {
        setErro('CEP fora de Minas Gerais')
        return null
      }

      return {
        logradouro: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        estado: data.uf ?? 'MG',
      }
    } catch {
      setErro('Erro ao buscar CEP')
      return null
    } finally {
      setBuscando(false)
    }
  }, [])

  return { buscarCep, buscando, erro, setErro }
}
