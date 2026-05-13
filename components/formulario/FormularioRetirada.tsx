'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CampoProdutos, { type ItemPedido } from './CampoProdutos'
import CampoCliente from './CampoCliente'
import DatasEspeciais from '@/components/clientes/DatasEspeciais'
import Modal from '@/components/ui/Modal'
import { formatarMoeda } from '@/lib/formatters'
import type { PagamentoTipo, ClienteData } from '@/lib/types'

const hoje = new Date().toISOString().split('T')[0]

const JANELAS_RETIRADA = [
  { value: 'manha', label: 'Manhã (8h–12h)' },
  { value: 'tarde', label: 'Tarde (12h–18h)' },
  { value: 'noite', label: 'Noite (18h–21h)' },
  { value: 'livre', label: 'Horário específico...' },
]

export default function FormularioRetirada() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null)

  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [clienteDatas, setClienteDatas] = useState<ClienteData[]>([])
  const [nomeRetirada, setNomeRetirada] = useState('')
  const [telefoneRetirada, setTelefoneRetirada] = useState('')

  const [itens, setItens] = useState<ItemPedido[]>([{ nome_produto: '', valor_unitario: 0, quantidade: 1 }])

  const [dataRetirada, setDataRetirada] = useState(hoje)
  const [janelaRetirada, setJanelaRetirada] = useState('tarde')
  const [horarioLivre, setHorarioLivre] = useState('')

  const [temCartao, setTemCartao] = useState(false)
  const [mensagemCartao, setMensagemCartao] = useState('')

  const [pago, setPago] = useState(true)
  const [pagamentoParcial, setPagamentoParcial] = useState(false)
  const [valorPago, setValorPago] = useState('')
  const [pagamentoTipo, setPagamentoTipo] = useState<PagamentoTipo>('pix')

  const [observacoes, setObservacoes] = useState('')

  const valorProdutos = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0)
  const valorPagoNum = parseFloat(valorPago) || 0
  const valorRestante = Math.max(0, valorProdutos - valorPagoNum)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const itensFilled = itens.filter((i) => i.nome_produto.trim())
    if (itensFilled.length === 0) {
      alert('Adicione pelo menos um produto.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'retirada',
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        destinatario_nome: nomeRetirada || null,
        destinatario_telefone: telefoneRetirada || null,
        data_entrega: dataRetirada || null,
        horario_entrega: janelaRetirada === 'livre' ? (horarioLivre || null) : JANELAS_RETIRADA.find(j => j.value === janelaRetirada)?.label ?? null,
        tem_cartao: temCartao,
        mensagem_cartao: temCartao ? mensagemCartao : null,
        pago,
        pagamento_tipo: pagamentoTipo,
        pagamento_parcial: pago ? pagamentoParcial : false,
        valor_pago: pago && pagamentoParcial ? parseFloat(valorPago) || 0 : pago ? valorProdutos : 0,
        valor_produtos: valorProdutos,
        valor_frete: 0,
        valor_total: valorProdutos,
        observacoes: observacoes || null,
        itens: itensFilled,
      }),
    })

    setLoading(false)
    if (res.ok) {
      const json = await res.json()
      setCodigoPedido(json.pedido.codigo)
    } else {
      const err = await res.json()
      alert('Erro ao salvar pedido: ' + err.error)
    }
  }

  async function handleClienteSelect(id: string | null) {
    setClienteId(id)
    setClienteDatas([])
    if (id) {
      const res = await fetch(`/api/clientes/${id}`)
      if (res.ok) {
        const json = await res.json()
        setClienteDatas(json.cliente.cliente_datas ?? [])
      }
    }
  }

  function resetForm() {
    setClienteNome('')
    setClienteTelefone('')
    setClienteId(null)
    setClienteDatas([])
    setNomeRetirada('')
    setTelefoneRetirada('')
    setItens([{ nome_produto: '', valor_unitario: 0, quantidade: 1 }])
    setDataRetirada(hoje)
    setJanelaRetirada('tarde')
    setHorarioLivre('')
    setTemCartao(false)
    setMensagemCartao('')
    setPago(true)
    setPagamentoParcial(false)
    setValorPago('')
    setPagamentoTipo('pix')
    setObservacoes('')
    setCodigoPedido(null)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="section-card">
          <h2 className="section-title">Cliente</h2>
          <CampoCliente
            nome={clienteNome}
            telefone={clienteTelefone}
            onNomeChange={setClienteNome}
            onTelefoneChange={setClienteTelefone}
            onClienteSelect={handleClienteSelect}
          />
          {clienteId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Datas especiais do cliente</p>
              <DatasEspeciais clienteId={clienteId} datas={clienteDatas} onChange={setClienteDatas} />
            </div>
          )}
        </div>

        <div className="section-card">
          <h2 className="section-title">Produtos</h2>
          <CampoProdutos itens={itens} onChange={setItens} />
        </div>

        <div className="section-card">
          <h2 className="section-title">Data e Horário de Retirada</h2>
          <div className="flex gap-2 mb-3">
            {[{ label: 'Hoje', offset: 0 }, { label: 'Amanhã', offset: 1 }, { label: 'Depois de amanhã', offset: 2 }].map(({ label, offset }) => {
              const d = new Date(); d.setDate(d.getDate() + offset)
              const val = d.toISOString().split('T')[0]
              return (
                <button key={label} type="button" onClick={() => setDataRetirada(val)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${dataRetirada === val ? 'bg-green-800 text-white border-green-800' : 'border-gray-300 text-gray-500 hover:border-green-700 hover:text-green-800'}`}>
                  {label}
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={dataRetirada} onChange={(e) => setDataRetirada(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Horário</label>
              <select
                className="form-input"
                value={janelaRetirada}
                onChange={(e) => setJanelaRetirada(e.target.value)}
              >
                {JANELAS_RETIRADA.map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
              {janelaRetirada === 'livre' && (
                <input
                  type="time"
                  className="form-input mt-1.5"
                  value={horarioLivre}
                  onChange={(e) => setHorarioLivre(e.target.value)}
                  placeholder="HH:MM"
                />
              )}
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Quem vai retirar</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Nome</label>
              <input className="form-input" placeholder="Nome de quem vai retirar" value={nomeRetirada} onChange={(e) => setNomeRetirada(e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Telefone</label>
              <input className="form-input" placeholder="(35) 99999-9999" value={telefoneRetirada} onChange={(e) => setTelefoneRetirada(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Cartão</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={temCartao} onChange={(e) => setTemCartao(e.target.checked)} className="w-4 h-4 accent-green-800" />
            <span className="text-sm text-gray-700">Tem cartão com mensagem?</span>
          </label>
          {temCartao && (
            <div className="mt-3">
              <label className="form-label">Mensagem do cartão</label>
              <textarea
                className="form-textarea"
                rows={3}
                maxLength={200}
                placeholder="Digite a mensagem do cartão..."
                value={mensagemCartao}
                onChange={(e) => setMensagemCartao(e.target.value)}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{mensagemCartao.length}/200</p>
            </div>
          )}
        </div>

        <div className="section-card">
          <h2 className="section-title">Pagamento</h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="pago" checked={pago} onChange={() => setPago(true)} className="accent-green-800" />
                <span className="text-sm">Pago</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="pago" checked={!pago} onChange={() => setPago(false)} className="accent-green-800" />
                <span className="text-sm">Não pago</span>
              </label>
            </div>
            {pago && (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="parcial" checked={!pagamentoParcial} onChange={() => setPagamentoParcial(false)} className="accent-green-800" />
                  <span className="text-sm">Total</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="parcial" checked={pagamentoParcial} onChange={() => setPagamentoParcial(true)} className="accent-green-800" />
                  <span className="text-sm">Parcial</span>
                </label>
              </div>
            )}
            {pago && pagamentoParcial && (
              <div>
                <label className="form-label">Valor pago</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0,00"
                  min="0"
                  max={valorProdutos}
                  step="0.01"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
                {valorPago !== '' && (
                  <div className="mt-2 flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-orange-50 border border-orange-100">
                    <span className="text-gray-600">Restante a pagar</span>
                    <span className={`font-semibold ${valorRestante > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                      {formatarMoeda(valorRestante)}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="form-label">Tipo de pagamento</label>
              <select className="form-select" value={pagamentoTipo} onChange={(e) => setPagamentoTipo(e.target.value as PagamentoTipo)}>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
              </select>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Observações</h2>
          <textarea className="form-textarea" rows={2} placeholder="Alguma observação adicional?" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        <div className="section-card">
          <div className="space-y-1 mb-4">
            <div className="flex justify-between font-bold text-green-900 text-xl">
              <span>Total</span>
              <span>{formatarMoeda(valorProdutos)}</span>
            </div>
            {pago && pagamentoParcial && valorPago !== '' && (
              <>
                <div className="flex justify-between text-sm text-gray-500 pt-1 border-t border-gray-100">
                  <span>Valor pago</span>
                  <span>{formatarMoeda(valorPagoNum)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-orange-600">
                  <span>Restante a pagar</span>
                  <span>{formatarMoeda(valorRestante)}</span>
                </div>
              </>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Salvando...' : 'Finalizar Pedido'}
          </button>
        </div>
      </form>

      <Modal open={!!codigoPedido} onClose={resetForm} title="Pedido finalizado!">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">Código do pedido</p>
          <p className="text-3xl font-bold text-green-900 tracking-widest mb-4">{codigoPedido}</p>
          <p className="text-sm text-gray-500 mb-6">Anote ou fotografe o código para rastrear o pedido.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/pedidos')} className="btn-secondary flex-1">Ver pedidos</button>
            <button onClick={resetForm} className="btn-primary flex-1">Novo pedido</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
