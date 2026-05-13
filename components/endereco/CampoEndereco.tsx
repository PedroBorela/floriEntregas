'use client'

import { useState, useRef, useEffect } from 'react'
import { useCep } from '@/hooks/useCep'
import { useGeocoding } from '@/hooks/useGeocoding'
import { useFrete } from '@/hooks/useFrete'
import { formatarMoeda } from '@/lib/formatters'

export interface EnderecoData {
  cep: string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  referencia: string
  latitude: number | null
  longitude: number | null
  valor_frete: number
  zona_frete_id: string | null
  zona_frete_nome: string | null
}

export const ENDERECO_VAZIO: EnderecoData = {
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: 'Manhuaçu',
  estado: 'MG',
  referencia: '',
  latitude: null,
  longitude: null,
  valor_frete: 0,
  zona_frete_id: null,
  zona_frete_nome: null,
}

interface Props {
  value: EnderecoData
  onChange: (data: EnderecoData) => void
}

function mascaraCep(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export default function CampoEndereco({ value, onChange }: Props) {
  const { buscarCep, buscando: buscandoCep, erro: erroCep, setErro: setErroCep } = useCep()
  const { zonaMatch, semZona } = useFrete(value.bairro)

  const [termoBusca, setTermoBusca] = useState(value.logradouro)
  const [geocAberto, setGeocAberto] = useState(false)
  const geocRef = useRef<HTMLDivElement>(null)
  const { sugestoes: sugestoesGeo, buscando: buscandoGeo } = useGeocoding(termoBusca)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (geocRef.current && !geocRef.current.contains(e.target as Node)) {
        setGeocAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  // Atualiza o frete quando a zona é encontrada
  useEffect(() => {
    if (zonaMatch) {
      onChange({
        ...value,
        valor_frete: zonaMatch.valor,
        zona_frete_id: zonaMatch.id,
        zona_frete_nome: zonaMatch.nome,
      })
    } else if (value.bairro.trim() && semZona) {
      // Só zera se havia frete de zona anterior (não manual)
      if (value.zona_frete_id) {
        onChange({ ...value, valor_frete: 0, zona_frete_id: null, zona_frete_nome: null })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaMatch, semZona])

  async function handleCepChange(raw: string) {
    const mascarado = mascaraCep(raw)
    onChange({ ...value, cep: mascarado })
    setErroCep(null)

    const digits = raw.replace(/\D/g, '')
    if (digits.length === 8) {
      const dados = await buscarCep(digits)
      if (dados) {
        setTermoBusca(dados.logradouro)
        onChange({
          ...value,
          cep: mascarado,
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.cidade,
          estado: dados.estado,
        })
      }
    }
  }

  function handleLogradouroChange(val: string) {
    setTermoBusca(val)
    onChange({ ...value, logradouro: val })
    setGeocAberto(val.trim().length >= 3)
  }

  function selecionarSugestao(s: { display_name: string; lat: string; lon: string; address: { road?: string; suburb?: string; neighbourhood?: string; city_district?: string } }) {
    const rua = s.address?.road ?? s.display_name.split(',')[0]?.trim()
    // Nominatim coloca o bairro mais específico como 2º segmento do display_name,
    // que é mais confiável do que address.suburb (que pode vir invertido)
    const bairroDisplayName = s.display_name.split(',')[1]?.trim()
    const bairroGeo = bairroDisplayName || s.address?.suburb || s.address?.neighbourhood || s.address?.city_district || value.bairro
    setTermoBusca(rua)
    setGeocAberto(false)
    onChange({
      ...value,
      logradouro: rua,
      bairro: bairroGeo,
      latitude: parseFloat(s.lat),
      longitude: parseFloat(s.lon),
    })
  }

  function set(field: keyof EnderecoData, val: string | number | null) {
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="space-y-3">
      {/* CEP */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">CEP</label>
          <div className="relative">
            <input
              className="form-input pr-8"
              placeholder="00000-000"
              value={value.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              maxLength={9}
            />
            {buscandoCep && (
              <span className="absolute right-2 top-2.5 text-xs text-gray-400 animate-pulse">...</span>
            )}
          </div>
          {erroCep && <p className="text-xs text-red-500 mt-1">{erroCep}</p>}
        </div>
        <div>
          <label className="form-label">Número</label>
          <input
            className="form-input"
            placeholder="Nº"
            value={value.numero}
            onChange={(e) => set('numero', e.target.value)}
          />
        </div>
      </div>

      {/* Logradouro com autocomplete Nominatim */}
      <div ref={geocRef} className="relative">
        <label className="form-label">Endereço</label>
        <input
          className="form-input"
          placeholder="Rua, Avenida..."
          value={termoBusca}
          onChange={(e) => handleLogradouroChange(e.target.value)}
          onFocus={() => { if (termoBusca.trim().length >= 3) setGeocAberto(true) }}
          autoComplete="off"
        />
        {geocAberto && (sugestoesGeo.length > 0 || buscandoGeo) && (
          <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto text-sm">
            {buscandoGeo && <li className="px-3 py-2 text-gray-400">Buscando...</li>}
            {sugestoesGeo.map((s, i) => {
              const ruaExtraida = s.address?.road ?? s.display_name.split(',')[0]?.trim()
              const bairroExtraido = s.display_name.split(',')[1]?.trim() || s.address?.suburb || s.address?.neighbourhood || null
              return (
                <li
                  key={i}
                  className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                  onMouseDown={(e) => { e.preventDefault(); selecionarSugestao(s) }}
                >
                  <div className="text-sm text-gray-800">{ruaExtraida}</div>
                  {bairroExtraido && (
                    <div className="text-xs text-gray-500 mt-0.5">Bairro: {bairroExtraido}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Bairro e Cidade */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Bairro</label>
          <input
            className="form-input"
            placeholder="Bairro"
            value={value.bairro}
            onChange={(e) => set('bairro', e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Cidade / Estado</label>
          <input
            className="form-input bg-gray-50"
            value={`${value.cidade} / ${value.estado}`}
            readOnly
          />
        </div>
      </div>

      {/* Referência */}
      <div>
        <label className="form-label">Referência</label>
        <input
          className="form-input"
          placeholder="Ex: casa azul, próximo ao mercado..."
          value={value.referencia}
          onChange={(e) => set('referencia', e.target.value)}
        />
      </div>

      {/* Badge de frete */}
      {value.bairro.trim() && (
        <div className="mt-1">
          {zonaMatch ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 text-sm font-medium">Frete — {zonaMatch.nome}</span>
              <span className="ml-auto font-bold text-green-900">{formatarMoeda(zonaMatch.valor)}</span>
            </div>
          ) : semZona ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
              <p className="text-amber-700 text-sm">Zona não cadastrada — informe o valor do frete:</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  className="form-input w-28"
                  min="0"
                  step="0.50"
                  placeholder="0,00"
                  value={value.valor_frete || ''}
                  onChange={(e) => set('valor_frete', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
