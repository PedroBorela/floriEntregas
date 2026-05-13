'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import CampoProdutos, { type ItemPedido } from '@/components/formulario/CampoProdutos'
import CampoEndereco, { type EnderecoData } from '@/components/endereco/CampoEndereco'
import { formatarMoeda } from '@/lib/formatters'
import type { Pedido, PagamentoTipo } from '@/lib/types'

const JANELAS = [
  { value: 'manha', label: 'Manhã (8h–12h)' },
  { value: 'tarde', label: 'Tarde (12h–18h)' },
  { value: 'noite', label: 'Noite (18h–21h)' },
  { value: 'livre', label: 'Horário específico...' },
]

function horarioParaJanela(h: string | null): { janela: string; livre: string } {
  if (!h) return { janela: 'tarde', livre: '' }
  const match = JANELAS.find((j) => j.label === h)
  if (match) return { janela: match.value, livre: '' }
  return { janela: 'livre', livre: h }
}

interface Props {
  pedido: Pedido
  open: boolean
  onClose: () => void
  onSalvo: () => void
}

export default function ModalEdicaoPedido({ pedido, open, onClose, onSalvo }: Props) {
  const horaInicial = horarioParaJanela(pedido.horario_entrega)

  const [clienteNome, setClienteNome] = useState(pedido.cliente_nome)
  const [clienteTelefone, setClienteTelefone] = useState(pedido.cliente_telefone)
  const [ePresente, setEPresente] = useState(!!pedido.destinatario_nome)
  const [destinatarioNome, setDestinatarioNome] = useState(pedido.destinatario_nome ?? '')
  const [destinatarioTelefone, setDestinatarioTelefone] = useState(pedido.destinatario_telefone ?? '')

  const [itens, setItens] = useState<ItemPedido[]>(
    pedido.pedido_itens?.map((i) => ({
      nome_produto: i.nome_produto,
      valor_unitario: i.valor_unitario,
      quantidade: i.quantidade,
      observacao: i.observacao ?? undefined,
    })) ?? [{ nome_produto: '', valor_unitario: 0, quantidade: 1 }]
  )

  const [endereco, setEndereco] = useState<EnderecoData>({
    apelido: (pedido as any).endereco_apelido ?? '',
    cep: pedido.cep ?? '',
    logradouro: pedido.logradouro ?? '',
    numero: pedido.numero ?? '',
    bairro: pedido.bairro ?? '',
    cidade: pedido.cidade,
    estado: pedido.estado,
    referencia: pedido.referencia ?? '',
    latitude: pedido.latitude,
    longitude: pedido.longitude,
    valor_frete: pedido.valor_frete,
    zona_frete_id: pedido.zona_frete_id,
    zona_frete_nome: null,
  })

  const [dataEntrega, setDataEntrega] = useState(pedido.data_entrega ?? '')
  const [janelaEntrega, setJanelaEntrega] = useState(horaInicial.janela)
  const [horarioLivre, setHorarioLivre] = useState(horaInicial.livre)

  const [temCartao, setTemCartao] = useState(pedido.tem_cartao)
  const [mensagemCartao, setMensagemCartao] = useState(pedido.mensagem_cartao ?? '')

  const [pago, setPago] = useState(pedido.pago)
  const [pagamentoParcial, setPagamentoParcial] = useState(pedido.pagamento_parcial)
  const [valorPago, setValorPago] = useState(String(pedido.valor_pago || ''))
  const [pagamentoTipo, setPagamentoTipo] = useState<PagamentoTipo>(pedido.pagamento_tipo ?? 'pix')

  const [observacoes, setObservacoes] = useState(pedido.observacoes ?? '')
  const [loading, setLoading] = useState(false)

  const valorProdutos = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0)
  const valorFrete = endereco.valor_frete
  const valorTotal = valorProdutos + valorFrete

  async function handleSalvar() {
    const itensFilled = itens.filter((i) => i.nome_produto.trim())
    if (itensFilled.length === 0) {
      alert('Adicione pelo menos um produto.')
      return
    }

    const horario_entrega = janelaEntrega === 'livre'
      ? (horarioLivre || null)
      : JANELAS.find((j) => j.value === janelaEntrega)?.label ?? null

    setLoading(true)
    const res = await fetch(`/api/pedidos/${pedido.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acao: 'editar',
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        destinatario_nome: ePresente ? (destinatarioNome || null) : null,
        destinatario_telefone: ePresente ? (destinatarioTelefone || null) : null,
        endereco_apelido: endereco.apelido || null,
        cep: endereco.cep || null,
        logradouro: endereco.logradouro || null,
        numero: endereco.numero || null,
        bairro: endereco.bairro || null,
        cidade: endereco.cidade,
        estado: endereco.estado,
        referencia: endereco.referencia || null,
        latitude: endereco.latitude,
        longitude: endereco.longitude,
        zona_frete_id: endereco.zona_frete_id,
        data_entrega: dataEntrega || null,
        horario_entrega,
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
      onSalvo()
      onClose()
    } else {
      const err = await res.json()
      alert('Erro ao salvar: ' + err.error)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar pedido ${pedido.codigo}`}>
      <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-1">
        {/* Cliente */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Nome do comprador</label>
            <input className="form-input" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Telefone</label>
            <input className="form-input" value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} />
          </div>
        </div>

        {/* Destinatário */}
        {pedido.tipo === 'entrega' && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ePresente}
                onChange={(e) => {
                  setEPresente(e.target.checked)
                  if (!e.target.checked) { setDestinatarioNome(''); setDestinatarioTelefone('') }
                }}
                className="w-4 h-4 accent-green-800"
              />
              <span className="text-sm text-gray-700">Este pedido é um presente?</span>
            </label>
            {ePresente && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="form-label">Destinatário</label>
                  <input className="form-input" value={destinatarioNome} onChange={(e) => setDestinatarioNome(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Tel. destinatário</label>
                  <input className="form-input" value={destinatarioTelefone} onChange={(e) => setDestinatarioTelefone(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Produtos */}
        <div>
          <label className="form-label mb-2 block">Produtos</label>
          <CampoProdutos itens={itens} onChange={setItens} />
        </div>

        {/* Endereço */}
        {pedido.tipo === 'entrega' && (
          <div>
            <label className="form-label mb-2 block">Endereço de entrega</label>
            <CampoEndereco value={endereco} onChange={setEndereco} />
          </div>
        )}

        {/* Data e horário */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Data</label>
            <input type="date" className="form-input" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Horário</label>
            <select className="form-input" value={janelaEntrega} onChange={(e) => setJanelaEntrega(e.target.value)}>
              {JANELAS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
            {janelaEntrega === 'livre' && (
              <input type="time" className="form-input mt-1.5" value={horarioLivre} onChange={(e) => setHorarioLivre(e.target.value)} />
            )}
          </div>
        </div>

        {/* Cartão */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={temCartao} onChange={(e) => setTemCartao(e.target.checked)} />
            Incluir mensagem no cartão
          </label>
          {temCartao && (
            <textarea
              className="form-input mt-2 resize-none"
              rows={2}
              value={mensagemCartao}
              onChange={(e) => setMensagemCartao(e.target.value)}
              placeholder="Mensagem do cartão..."
            />
          )}
        </div>

        {/* Pagamento */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
            <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} />
            Pago
          </label>
          {pago && (
            <div className="space-y-2">
              <select className="form-input" value={pagamentoTipo} onChange={(e) => setPagamentoTipo(e.target.value as PagamentoTipo)}>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={pagamentoParcial} onChange={(e) => setPagamentoParcial(e.target.checked)} />
                Pagamento parcial
              </label>
              {pagamentoParcial && (
                <input
                  type="number"
                  className="form-input w-36"
                  placeholder="Valor pago"
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="form-label">Observações</label>
          <textarea className="form-input resize-none" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Total</span>
          <span className="font-bold text-green-900 text-lg">{formatarMoeda(valorTotal)}</span>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </Modal>
  )
}
