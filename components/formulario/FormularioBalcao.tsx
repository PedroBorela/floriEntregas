'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CampoProdutos, { type ItemPedido } from './CampoProdutos'
import CampoCliente from './CampoCliente'
import DatasEspeciaisInput, { type DataEspecialRascunho } from '@/components/clientes/DatasEspeciaisInput'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import ModalSeletorVendedor from '@/components/vendedores/ModalSeletorVendedor'
import { corVendedor } from '@/lib/vendedorCores'
import { formatarMoeda } from '@/lib/formatters'
import { User } from 'lucide-react'
import type { PagamentoTipo } from '@/lib/types'

export default function FormularioBalcao() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [codigoPedido, setCodigoPedido] = useState<string | null>(null)

  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [datasEspeciais, setDatasEspeciais] = useState<DataEspecialRascunho[]>([{ nome: '', data: '' }])

  const [itens, setItens] = useState<ItemPedido[]>([{ nome_produto: '', valor_unitario: 0, quantidade: 1 }])

  const [pago, setPago] = useState(true)
  const [pagamentoParcial, setPagamentoParcial] = useState(false)
  const [valorPago, setValorPago] = useState('')
  const [pagamentoTipo, setPagamentoTipo] = useState<PagamentoTipo>('dinheiro')

  const [observacoes, setObservacoes] = useState('')
  const [vendedorId, setVendedorId] = useState<string | null>(null)
  const [vendedorNome, setVendedorNome] = useState<string | null>(null)
  const [modalVendedor, setModalVendedor] = useState(false)

  const valorProdutos = itens.reduce((s, i) => s + i.valor_unitario * i.quantidade, 0)
  const valorPagoNum = Number.parseFloat(valorPago) || 0
  const valorRestante = Math.max(0, valorProdutos - valorPagoNum)

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const itensFilled = itens.filter((i) => i.nome_produto.trim())
    if (itensFilled.length === 0) {
      toast('Adicione pelo menos um produto.', 'warning')
      return
    }

    setLoading(true)
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'balcao',
        status: 'vendido',
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        pago,
        pagamento_tipo: pagamentoTipo,
        pagamento_parcial: pago ? pagamentoParcial : false,
        valor_pago: pago && pagamentoParcial ? Number.parseFloat(valorPago) || 0 : pago ? valorProdutos : 0,
        valor_produtos: valorProdutos,
        valor_frete: 0,
        valor_total: valorProdutos,
        observacoes: observacoes || null,
        vendedor_id: vendedorId ?? null,
        itens: itensFilled,
      }),
    })

    setLoading(false)
    if (res.ok) {
      const json = await res.json()
      const cid = clienteId ?? json.pedido.cliente_id
      if (cid) {
        const datasValidas = datasEspeciais.filter(d => d.nome.trim() && d.data)
        for (const d of datasValidas) {
          await fetch(`/api/clientes/${cid}/datas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: d.nome.trim(), data: d.data }),
          })
        }
      }
      setCodigoPedido(json.pedido.codigo)
    } else {
      const err = await res.json()
      toast('Erro ao registrar venda: ' + err.error)
    }
  }

  function handleClienteSelect(id: string | null) {
    setClienteId(id)
  }

  function resetForm() {
    setClienteNome('')
    setClienteTelefone('')
    setClienteId(null)
    setDatasEspeciais([{ nome: '', data: '' }])
    setItens([{ nome_produto: '', valor_unitario: 0, quantidade: 1 }])
    setPago(true)
    setPagamentoParcial(false)
    setValorPago('')
    setPagamentoTipo('dinheiro')
    setObservacoes('')
    setVendedorId(null)
    setVendedorNome(null)
    setCodigoPedido(null)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="section-card">
          <h2 className="section-title">
            Cliente{' '}
            <span className="text-gray-400 font-normal text-sm">(opcional)</span>
          </h2>
          <CampoCliente
            nome={clienteNome}
            telefone={clienteTelefone}
            onNomeChange={setClienteNome}
            onTelefoneChange={setClienteTelefone}
            onClienteSelect={handleClienteSelect}
            obrigatorio={false}
          />
          {clienteId && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Datas especiais do cliente</p>
              <DatasEspeciaisInput value={datasEspeciais} onChange={setDatasEspeciais} />
            </div>
          )}
        </div>

        <div className="section-card">
          <h2 className="section-title">Produtos</h2>
          <CampoProdutos itens={itens} onChange={setItens} />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="form-label mb-1.5">Vendedor</p>
            <button
              type="button"
              onClick={() => setModalVendedor(true)}
              className={`flex items-center gap-2 text-left text-sm w-full rounded-lg border px-3 py-2 transition ${
                vendedorId ? corVendedor(vendedorId).pill : 'form-input'
              }`}
            >
              <User size={14} className="shrink-0" />
              <span className={vendedorNome ? 'font-medium' : 'text-gray-400'}>
                {vendedorNome ?? 'Nenhum vendedor'}
              </span>
            </button>
          </div>
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
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
              </select>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="section-title">Observações</h2>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Alguma observação adicional?"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
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
            {loading ? 'Salvando...' : 'Registrar Venda'}
          </button>
        </div>
      </form>

      <ModalSeletorVendedor
        open={modalVendedor}
        onClose={() => setModalVendedor(false)}
        onSelect={(v) => { setVendedorId(v?.id ?? null); setVendedorNome(v?.nome ?? null) }}
        vendedorAtualId={vendedorId}
      />

      <Modal open={!!codigoPedido} onClose={resetForm} title="Venda registrada!">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">Código da venda</p>
          <p className="text-3xl font-bold text-green-900 tracking-widest mb-4">{codigoPedido}</p>
          <p className="text-sm text-gray-500 mb-6">Anote ou fotografe o código para referência.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/pedidos')} className="btn-secondary flex-1">Ver pedidos</button>
            <button onClick={resetForm} className="btn-primary flex-1">Nova venda</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
