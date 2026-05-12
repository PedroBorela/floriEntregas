'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CampoProdutos, { type ItemPedido } from './CampoProdutos'
import CampoEndereco, { type EnderecoData, ENDERECO_VAZIO } from '@/components/endereco/CampoEndereco'
import Modal from '@/components/ui/Modal'
import { formatarMoeda } from '@/lib/formatters'
import type { PagamentoTipo } from '@/lib/types'

const hoje = new Date().toISOString().split('T')[0]

export default function FormularioEntrega() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null)

  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')

  const [itens, setItens] = useState<ItemPedido[]>([{ nome_produto: '', valor_unitario: 0, quantidade: 1 }])

  const [dataEntrega, setDataEntrega] = useState(hoje)
  const [horarioEntrega, setHorarioEntrega] = useState('12:00')

  const [destinatarioNome, setDestinatarioNome] = useState('')
  const [destinatarioTelefone, setDestinatarioTelefone] = useState('')
  const [endereco, setEndereco] = useState<EnderecoData>(ENDERECO_VAZIO)

  const [temCartao, setTemCartao] = useState(false)
  const [mensagemCartao, setMensagemCartao] = useState('')

  const [pago, setPago] = useState(true)
  const [pagamentoParcial, setPagamentoParcial] = useState(false)
  const [valorPago, setValorPago] = useState('')
  const [pagamentoTipo, setPagamentoTipo] = useState<PagamentoTipo>('pix')

  const [observacoes, setObservacoes] = useState('')

  const valorProdutos = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0)
  const valorFrete = endereco.valor_frete
  const valorTotal = valorProdutos + valorFrete
  const valorPagoNum = parseFloat(valorPago) || 0
  const valorRestante = Math.max(0, valorTotal - valorPagoNum)

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
        tipo: 'entrega',
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        destinatario_nome: destinatarioNome || null,
        destinatario_telefone: destinatarioTelefone || null,
        cep: endereco.cep || null,
        logradouro: endereco.logradouro || null,
        numero: endereco.numero || null,
        bairro: endereco.bairro || null,
        cidade: endereco.cidade || 'Manhuaçu',
        estado: endereco.estado || 'MG',
        referencia: endereco.referencia || null,
        latitude: endereco.latitude,
        longitude: endereco.longitude,
        zona_frete_id: endereco.zona_frete_id,
        data_entrega: dataEntrega || null,
        horario_entrega: horarioEntrega || null,
        tem_cartao: temCartao,
        mensagem_cartao: temCartao ? mensagemCartao : null,
        pago,
        pagamento_tipo: pagamentoTipo,
        pagamento_parcial: pago ? pagamentoParcial : false,
        valor_pago: pago && pagamentoParcial ? parseFloat(valorPago) || 0 : pago ? valorTotal : 0,
        valor_produtos: valorProdutos,
        valor_frete: valorFrete,
        valor_total: valorTotal,
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

  function resetForm() {
    setClienteNome('')
    setClienteTelefone('')
    setItens([{ nome_produto: '', valor_unitario: 0, quantidade: 1 }])
    setDataEntrega(hoje)
    setHorarioEntrega('12:00')
    setDestinatarioNome('')
    setDestinatarioTelefone('')
    setEndereco(ENDERECO_VAZIO)
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
      <form onSubmit={handleSubmit} className="space-y-0">
        <div className="section-card">
          <h2 className="section-title">Cliente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Nome do cliente</label>
              <input className="form-input" placeholder="Nome completo" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Telefone do cliente</label>
              <input className="form-input" placeholder="(35) 99999-9999" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} required />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Produtos</h2>
          <CampoProdutos itens={itens} onChange={setItens} />
        </div>

        <div className="section-card">
          <h2 className="section-title">Data e Horário de Entrega</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Data</label>
              <input type="date" className="form-input" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Horário</label>
              <input type="time" className="form-input" value={horarioEntrega} onChange={(e) => setHorarioEntrega(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Destinatário</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Nome de quem vai receber</label>
              <input className="form-input" placeholder="Nome do destinatário" value={destinatarioNome} onChange={(e) => setDestinatarioNome(e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Telefone de quem vai receber</label>
              <input className="form-input" placeholder="(35) 99999-9999" value={destinatarioTelefone} onChange={(e) => setDestinatarioTelefone(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Endereço de Entrega</h2>
          <CampoEndereco value={endereco} onChange={setEndereco} />
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
                  max={valorTotal}
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
            <div className="flex justify-between text-sm text-gray-500">
              <span>Produtos</span>
              <span>{formatarMoeda(valorProdutos)}</span>
            </div>
            {valorFrete > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Frete{endereco.zona_frete_nome ? ` (${endereco.zona_frete_nome})` : ''}</span>
                <span>{formatarMoeda(valorFrete)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-green-900 text-xl pt-1 border-t border-gray-100">
              <span>Total</span>
              <span>{formatarMoeda(valorTotal)}</span>
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
            <button onClick={() => router.push('/pedidos')} className="btn-secondary flex-1">
              Ver pedidos
            </button>
            <button onClick={resetForm} className="btn-primary flex-1">
              Novo pedido
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
