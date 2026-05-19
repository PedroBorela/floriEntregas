'use client'

import { useState, useRef, useEffect } from 'react'

interface ClienteSugestao {
  id: string
  nome: string
  telefone: string
}

interface Props {
  nome: string
  telefone: string
  onNomeChange: (v: string) => void
  onTelefoneChange: (v: string) => void
  onClienteSelect?: (id: string | null) => void
  obrigatorio?: boolean
}

export default function CampoCliente({ nome, telefone, onNomeChange, onTelefoneChange, onClienteSelect, obrigatorio = true }: Readonly<Props>) {
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([])
  const [aberto, setAberto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  function disparaBusca(termo: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (termo.trim().length < 2) {
      setSugestoes([])
      setAberto(false)
      return
    }
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await fetch(`/api/clientes?busca=${encodeURIComponent(termo)}`)
        const json = await res.json()
        const lista: ClienteSugestao[] = json.clientes ?? []
        setSugestoes(lista)
        setAberto(lista.length > 0)
      } finally {
        setBuscando(false)
      }
    }, 300)
  }

  function selecionarCliente(c: ClienteSugestao) {
    onNomeChange(c.nome)
    onTelefoneChange(c.telefone)
    onClienteSelect?.(c.id)
    setSugestoes([])
    setAberto(false)
  }

  return (
    <div ref={wrapperRef} className="grid grid-cols-2 gap-4">
      <div className="col-span-2 sm:col-span-1 relative">
        <label className="form-label">Nome do cliente</label>
        <input
          className="form-input"
          placeholder="Nome ou telefone para buscar..."
          value={nome}
          autoComplete="off"
          required={obrigatorio}
          onChange={(e) => {
            onNomeChange(e.target.value)
            onClienteSelect?.(null)
            disparaBusca(e.target.value)
          }}
          onFocus={() => { if (sugestoes.length > 0) setAberto(true) }}
        />
        {buscando && (
          <span className="absolute right-2 top-8 text-xs text-gray-400 animate-pulse">...</span>
        )}
        {aberto && sugestoes.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-auto text-sm">
            {sugestoes.map((c) => (
              <li
                key={c.id}
                className="px-3 py-2.5 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0"
                onMouseDown={(e) => { e.preventDefault(); selecionarCliente(c) }}
              >
                <div className="font-medium text-gray-800">{c.nome}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.telefone}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label className="form-label">Telefone do cliente</label>
        <input
          className="form-input"
          placeholder="(35) 99999-9999"
          value={telefone}
          onChange={(e) => onTelefoneChange(e.target.value)}
          required={obrigatorio}
        />
      </div>
    </div>
  )
}
