'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DatasEspeciais from '@/components/clientes/DatasEspeciais'
import NotasCliente from '@/components/clientes/NotasCliente'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { formatarMoeda, formatarData } from '@/lib/formatters'
import type { ClienteNota, Cliente, ClienteData } from '@/lib/types'
import { useCep } from '@/hooks/useCep'

function mascaraCep(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export default function ClientePerfilPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [datas, setDatas] = useState<ClienteData[]>([])
  const [notas, setNotas] = useState<ClienteNota[]>([])
  const [loading, setLoading] = useState(true)

  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)

  // Edição de endereços
  const { buscarCep, buscando: buscandoCepEnd } = useCep()
  const [enderecoEditando, setEnderecoEditando] = useState<any | null>(null)
  const [editApelido, setEditApelido] = useState('')
  const [editCep, setEditCep] = useState('')
  const [editLogradouro, setEditLogradouro] = useState('')
  const [editNumero, setEditNumero] = useState('')
  const [editBairro, setEditBairro] = useState('')
  const [editCidade, setEditCidade] = useState('')
  const [editReferencia, setEditReferencia] = useState('')
  const [salvandoEndereco, setSalvandoEndereco] = useState(false)
  const [excluindoEndereco, setExcluindoEndereco] = useState<string | null>(null)
  const [modalExcluirEndereco, setModalExcluirEndereco] = useState<any | null>(null)

  useEffect(() => {
    async function carregar() {
      const res = await fetch(`/api/clientes/${id}`)
      if (!res.ok) { router.push('/clientes'); return }
      const json = await res.json()
      const c: Cliente = json.cliente
      setCliente(c)
      setDatas(c.cliente_datas ?? [])
      setNotas((c as any).cliente_notas ?? [])
      setNome(c.nome)
      setTelefone(c.telefone)
      setWhatsapp(c.whatsapp ?? '')
      setLoading(false)
    }
    carregar()
  }, [id, router])

  async function handleExcluir() {
    setExcluindo(true)
    const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
    setExcluindo(false)
    if (res.ok) {
      router.push('/clientes')
    } else {
      const err = await res.json()
      toast(err.error)
      setModalExcluir(false)
    }
  }

  async function salvarEdicao() {
    setSalvando(true)
    const res = await fetch(`/api/clientes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone, whatsapp }),
    })
    setSalvando(false)
    if (res.ok) {
      const json = await res.json()
      setCliente(json.cliente)
      setEditando(false)
    }
  }

  function abrirEditarEndereco(end: any) {
    setEnderecoEditando(end)
    setEditApelido(end.apelido ?? '')
    setEditCep(end.cep ?? '')
    setEditLogradouro(end.logradouro ?? '')
    setEditNumero(end.numero ?? '')
    setEditBairro(end.bairro ?? '')
    setEditCidade(end.cidade ?? '')
    setEditReferencia(end.referencia ?? '')
  }

  async function handleCepEditarChange(raw: string) {
    const formatado = mascaraCep(raw)
    setEditCep(formatado)
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 8) {
      const dados = await buscarCep(digits)
      if (dados) {
        setEditLogradouro(dados.logradouro)
        setEditBairro(dados.bairro)
        setEditCidade(dados.cidade)
      }
    }
  }

  async function salvarEndereco() {
    if (!enderecoEditando) return
    setSalvandoEndereco(true)
    const res = await fetch(`/api/enderecos/${enderecoEditando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apelido: editApelido,
        logradouro: editLogradouro,
        numero: editNumero,
        bairro: editBairro,
        cidade: editCidade,
        estado: 'MG',
        cep: editCep,
        referencia: editReferencia,
      }),
    })
    setSalvandoEndereco(false)
    if (res.ok) {
      const json = await res.json()
      setCliente((prev: any) => prev ? {
        ...prev,
        enderecos: (prev.enderecos ?? []).map((e: any) =>
          e.id === enderecoEditando.id ? { ...e, ...json.endereco } : e
        ),
      } : null)
      setEnderecoEditando(null)
    } else {
      const err = await res.json()
      toast(err.error)
    }
  }

  async function confirmarExcluirEndereco() {
    if (!modalExcluirEndereco) return
    const endId = modalExcluirEndereco.id
    setExcluindoEndereco(endId)
    const res = await fetch(`/api/enderecos/${endId}`, { method: 'DELETE' })
    setExcluindoEndereco(null)
    setModalExcluirEndereco(null)
    if (res.ok) {
      setCliente((prev: any) => prev ? {
        ...prev,
        enderecos: (prev.enderecos ?? []).filter((e: any) => e.id !== endId),
      } : null)
    } else {
      const err = await res.json()
      toast(err.error)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>
  if (!cliente) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pedidos: any[] = (cliente as any).pedidos ?? []

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/clientes" className="text-gray-400 hover:text-gray-600 text-sm">← Clientes</Link>
        <h1 className="text-xl font-bold text-green-900 flex-1 truncate">{cliente.nome}</h1>
        {!editando && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditando(true)}
              className="text-sm text-green-800 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition font-medium"
            >
              Editar
            </button>
            <button
              onClick={() => setModalExcluir(true)}
              className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition font-medium"
            >
              Excluir
            </button>
          </div>
        )}
      </div>

      {/* Dados do cliente */}
      <div className="section-card space-y-3">
        <h2 className="section-title">Dados do cliente</h2>

        {editando ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Nome</label>
                <input className="form-input" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Telefone</label>
                <input className="form-input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">WhatsApp <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className="form-input" placeholder="Se diferente do telefone" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setEditando(false)} className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">Cancelar</button>
              <button onClick={salvarEdicao} disabled={salvando} className="px-4 py-1.5 text-sm font-semibold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Telefone</span>
              <span className="text-gray-800">{cliente.telefone}</span>
            </div>
            {cliente.whatsapp && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0">WhatsApp</span>
                <span className="text-gray-800">{cliente.whatsapp}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preferências e observações */}
      <div className="section-card">
        <h2 className="section-title">Preferências e observações</h2>
        <NotasCliente clienteId={id} notas={notas} onChange={setNotas} />
      </div>

      {/* Endereços de entrega */}
      {((cliente as any).enderecos ?? []).length > 0 && (
        <div className="section-card">
          <h2 className="section-title">Endereços de entrega</h2>
          <div className="divide-y divide-gray-100">
            {((cliente as any).enderecos as any[]).map((end) => (
              <div key={end.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {end.apelido && (
                    <p className="text-sm font-medium text-green-800">{end.apelido}</p>
                  )}
                  <p className="text-sm text-gray-700">
                    {end.logradouro}{end.numero ? `, ${end.numero}` : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    {end.bairro}{end.cidade ? ` — ${end.cidade}` : ''}{end.estado ? `/${end.estado}` : ''}
                    {end.cep ? ` · CEP ${end.cep}` : ''}
                  </p>
                  {end.referencia && (
                    <p className="text-xs text-gray-400 mt-0.5">Ref: {end.referencia}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirEditarEndereco(end)}
                    className="text-xs text-green-700 border border-green-200 rounded px-2 py-1 hover:bg-green-50 transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setModalExcluirEndereco(end)}
                    disabled={excluindoEndereco === end.id}
                    className="text-xs text-red-500 border border-red-200 rounded px-2 py-1 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {excluindoEndereco === end.id ? '...' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Datas especiais */}
      <div className="section-card">
        <h2 className="section-title">Datas especiais</h2>
        <DatasEspeciais clienteId={id} datas={datas} onChange={setDatas} />
      </div>

      {/* Histórico de pedidos */}
      {pedidos.length > 0 && (
        <div className="section-card">
          <h2 className="section-title">Histórico de pedidos</h2>
          <div className="space-y-2">
            {pedidos.slice(0, 10).map((p) => (
              <Link key={p.id} href={`/pedidos/${p.codigo}?from=/clientes/${id}`} className="flex items-center justify-between text-sm py-1.5 hover:text-green-800 transition">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-green-800">{p.codigo}</span>
                  {p.data_entrega && <span className="text-gray-400">{formatarData(p.data_entrega)}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'cancelado' ? 'bg-red-100 text-red-600'
                    : p.status === 'entregue' || p.status === 'retirado' ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>{p.status.replace(/_/g, ' ')}</span>
                  <span className="text-gray-600 font-medium">{formatarMoeda(p.valor_total)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modal excluir cliente */}
      <Modal open={modalExcluir} onClose={() => { if (!excluindo) setModalExcluir(false) }} title="Excluir cliente">
        <p className="text-sm text-gray-600 mb-6">
          O cliente <span className="font-semibold text-gray-800">{cliente.nome}</span> será excluído permanentemente.
          Se houver pedidos vinculados, a exclusão será bloqueada.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setModalExcluir(false)}
            disabled={excluindo}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExcluir}
            disabled={excluindo}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {excluindo ? 'Excluindo...' : 'Excluir permanentemente'}
          </button>
        </div>
      </Modal>

      {/* Modal editar endereço */}
      <Modal open={!!enderecoEditando} onClose={() => { if (!salvandoEndereco) setEnderecoEditando(null) }} title="Editar endereço">
        <div className="space-y-3">
          <div>
            <label className="form-label">Apelido <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
            <input
              className="form-input"
              placeholder='Ex: "casa", "trabalho", "mãe"'
              value={editApelido}
              onChange={(e) => setEditApelido(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">CEP</label>
              <div className="relative">
                <input
                  className="form-input pr-8"
                  placeholder="00000-000"
                  maxLength={9}
                  value={editCep}
                  onChange={(e) => handleCepEditarChange(e.target.value)}
                />
                {buscandoCepEnd && (
                  <span className="absolute right-2 top-2.5 text-xs text-gray-400 animate-pulse">...</span>
                )}
              </div>
            </div>
            <div>
              <label className="form-label">Número</label>
              <input
                className="form-input"
                placeholder="Nº"
                value={editNumero}
                onChange={(e) => setEditNumero(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Logradouro</label>
            <input
              className="form-input"
              placeholder="Rua, Avenida..."
              value={editLogradouro}
              onChange={(e) => setEditLogradouro(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Bairro</label>
              <input
                className="form-input"
                placeholder="Bairro"
                value={editBairro}
                onChange={(e) => setEditBairro(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Cidade</label>
              <input
                className="form-input"
                placeholder="Cidade"
                value={editCidade}
                onChange={(e) => setEditCidade(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Referência <span className="text-gray-400 font-normal text-xs">(opcional)</span></label>
            <input
              className="form-input"
              placeholder="Ex: casa azul, próximo ao mercado..."
              value={editReferencia}
              onChange={(e) => setEditReferencia(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => setEnderecoEditando(null)}
              disabled={salvandoEndereco}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={salvarEndereco}
              disabled={salvandoEndereco}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
            >
              {salvandoEndereco ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal excluir endereço */}
      <Modal
        open={!!modalExcluirEndereco}
        onClose={() => { if (!excluindoEndereco) setModalExcluirEndereco(null) }}
        title="Excluir endereço"
      >
        <p className="text-sm text-gray-600 mb-1">
          O endereço abaixo será excluído permanentemente:
        </p>
        {modalExcluirEndereco && (
          <p className="text-sm font-medium text-gray-800 mb-6">
            {modalExcluirEndereco.apelido ? `"${modalExcluirEndereco.apelido}" — ` : ''}
            {modalExcluirEndereco.logradouro}{modalExcluirEndereco.numero ? `, ${modalExcluirEndereco.numero}` : ''}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => setModalExcluirEndereco(null)}
            disabled={!!excluindoEndereco}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarExcluirEndereco}
            disabled={!!excluindoEndereco}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {excluindoEndereco ? 'Excluindo...' : 'Excluir permanentemente'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
