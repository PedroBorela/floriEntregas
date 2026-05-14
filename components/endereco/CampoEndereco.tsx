'use client'

import { useState, useRef, useEffect } from 'react'
import { useCep } from '@/hooks/useCep'
import { useGeocoding } from '@/hooks/useGeocoding'
import { useFrete } from '@/hooks/useFrete'
import { formatarMoeda } from '@/lib/formatters'

export interface EnderecoData {
  endereco_id: string | null
  apelido: string
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

export interface EnderecoExistente {
  id: string
  apelido: string | null
  logradouro: string
  numero: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string | null
  referencia: string | null
  latitude: number | null
  longitude: number | null
}

export const ENDERECO_VAZIO: EnderecoData = {
  endereco_id: null,
  apelido: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
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
  enderecosExistentes?: EnderecoExistente[]
}

function mascaraCep(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export default function CampoEndereco({ value, onChange, enderecosExistentes }: Props) {
  const { buscarCep, buscando: buscandoCep, erro: erroCep, setErro: setErroCep } = useCep()
  const { zonaMatch, semZona } = useFrete(value.bairro)

  const [termoBusca, setTermoBusca] = useState(value.logradouro)
  const [geocAberto, setGeocAberto] = useState(false)
  const geocRef = useRef<HTMLDivElement>(null)
  const { sugestoes: sugestoesGeo, buscando: buscandoGeo } = useGeocoding(termoBusca)
  const [badgeSelecionadoId, setBadgeSelecionadoId] = useState<string | null>(null)

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (geocRef.current && !geocRef.current.contains(e.target as Node)) {
        setGeocAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  useEffect(() => {
    if (zonaMatch) {
      onChange({ ...value, valor_frete: zonaMatch.valor, zona_frete_id: zonaMatch.id, zona_frete_nome: zonaMatch.nome })
    } else if (value.bairro.trim() && semZona) {
      if (value.zona_frete_id) {
        onChange({ ...value, valor_frete: 0, zona_frete_id: null, zona_frete_nome: null })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaMatch, semZona])

  // De-duplica por logradouro+numero para não mostrar badges repetidos
  const badges = enderecosExistentes
    ? [...enderecosExistentes
        .reduce((map, end) => {
          const key = `${end.logradouro}|${end.numero ?? ''}`
          if (!map.has(key)) map.set(key, end)
          return map
        }, new Map<string, EnderecoExistente>())
        .values()]
    : []

  function usarEndereco(end: EnderecoExistente) {
    setBadgeSelecionadoId(end.id)
    setTermoBusca(end.logradouro)
    onChange({
      ...value,
      endereco_id: end.id,
      apelido: end.apelido ?? '',
      cep: end.cep ?? '',
      logradouro: end.logradouro,
      numero: end.numero ?? '',
      bairro: end.bairro,
      cidade: end.cidade,
      estado: end.estado,
      referencia: end.referencia ?? '',
      latitude: end.latitude,
      longitude: end.longitude,
      zona_frete_id: null,
    })
  }

  async function handleCepChange(raw: string) {
    const mascarado = mascaraCep(raw)
    onChange({ ...value, cep: mascarado })
    setErroCep(null)

    const digits = raw.replace(/\D/g, '')
    if (digits.length === 8) {
      const dados = await buscarCep(digits)
      if (dados) {
        setTermoBusca(dados.logradouro)
        onChange({ ...value, endereco_id: null, cep: mascarado, logradouro: dados.logradouro, bairro: dados.bairro, cidade: dados.cidade, estado: dados.estado })
      }
    }
  }

  function handleLogradouroChange(val: string) {
    setTermoBusca(val)
    setBadgeSelecionadoId(null)
    onChange({ ...value, endereco_id: null, logradouro: val })
    setGeocAberto(val.trim().length >= 3)
  }

  function selecionarSugestao(s: { display_name: string; lat: string; lon: string; address: { road?: string; suburb?: string; neighbourhood?: string; city_district?: string; city?: string; town?: string; village?: string; municipality?: string } }) {
    const rua = s.address?.road ?? s.display_name.split(',')[0]?.trim()
    const bairroDisplayName = s.display_name.split(',')[1]?.trim()
    const bairroGeo = bairroDisplayName || s.address?.suburb || s.address?.neighbourhood || s.address?.city_district || value.bairro
    const cidadeGeo = s.address?.city || s.address?.town || s.address?.village || s.address?.municipality || value.cidade
    setTermoBusca(rua)
    setGeocAberto(false)
    onChange({ ...value, endereco_id: null, logradouro: rua, bairro: bairroGeo, cidade: cidadeGeo, latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) })
  }

  function set(field: keyof EnderecoData, val: string | number | null) {
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="space-y-3">
      {/* Badges de endereços salvos */}
      {badges.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Endereços salvos</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((end) => (
              <button
                key={end.id}
                type="button"
                onClick={() => usarEndereco(end)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  badgeSelecionadoId === end.id
                    ? 'bg-green-800 text-white border-green-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-green-700 hover:text-green-800'
                }`}
              >
                {end.apelido || `${end.logradouro}${end.numero ? `, ${end.numero}` : ''}`}
              </button>
            ))}
          </div>
        </div>
      )}

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
                <li key={i} className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                  onMouseDown={(e) => { e.preventDefault(); selecionarSugestao(s) }}>
                  <div className="text-sm text-gray-800">{ruaExtraida}</div>
                  {bairroExtraido && <div className="text-xs text-gray-500 mt-0.5">Bairro: {bairroExtraido}</div>}
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
          <label className="form-label">Cidade</label>
          <input
            className="form-input"
            placeholder="Cidade"
            value={value.cidade}
            onChange={(e) => set('cidade', e.target.value)}
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

      {/* Apelido */}
      {value.logradouro.trim() && (
        <div>
          <label className="form-label">
            Salvar endereço como{' '}
            <span className="text-xs text-gray-400 font-normal">(apelido opcional)</span>
          </label>
          <input
            className="form-input"
            placeholder='Ex: "casa", "mãe", "trabalho"'
            value={value.apelido}
            onChange={(e) => set('apelido', e.target.value)}
          />
        </div>
      )}

      {/* Badge de frete */}
      {value.bairro.trim() && (
        <div className="mt-1">
          {zonaMatch ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-700 text-sm font-medium">Frete — {zonaMatch.nome}</span>
                {value.valor_frete !== zonaMatch.valor && (
                  <button
                    type="button"
                    onClick={() => set('valor_frete', zonaMatch.valor)}
                    className="text-xs text-gray-400 hover:text-green-700 transition"
                  >
                    Restaurar padrão ({formatarMoeda(zonaMatch.valor)})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  className="form-input w-28"
                  min="0"
                  step="0.50"
                  value={value.valor_frete || ''}
                  onChange={(e) => set('valor_frete', parseFloat(e.target.value) || 0)}
                />
              </div>
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
