import { QRCodeSVG } from 'qrcode.react'
import { formatarMoeda, formatarData, formatarDataHora } from '@/lib/formatters'
import type { Pedido, PedidoItem } from '@/lib/types'

const LABELS_PAG: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
}

interface Props {
  pedido: Pedido & { pedido_itens: PedidoItem[] }
}

export default function ComandaImpressao({ pedido: p }: Props) {
  const itens = p.pedido_itens ?? []

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px', width: '72mm', padding: '4mm 2mm', color: '#000', background: '#fff' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Natureza Em Flores</div>
        <div style={{ fontSize: '10px' }}>Flores para todas as ocasiões</div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Código + tipo */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '3px' }}>{p.codigo}</div>
        <div style={{ fontSize: '11px', marginTop: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>
          {p.tipo === 'entrega' ? '📦 ENTREGA' : '🛍️ RETIRADA'}
        </div>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
        <QRCodeSVG value={p.codigo} size={80} />
      </div>

      <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

      {/* Data/hora */}
      {(p.data_entrega || p.horario_entrega) && (
        <div style={{ margin: '3px 0', fontSize: '11px' }}>
          <b>Data: </b>
          {p.data_entrega && formatarData(p.data_entrega)}
          {p.horario_entrega && ` às ${p.horario_entrega.slice(0, 5)}`}
        </div>
      )}

      {/* Cliente */}
      <div style={{ margin: '3px 0', fontSize: '11px' }}>
        <div><b>Cliente: </b>{p.cliente_nome}</div>
        <div><b>Tel: </b>{p.cliente_telefone}</div>
      </div>

      {/* Destinatário e endereço */}
      {p.tipo === 'entrega' && (p.destinatario_nome || p.logradouro) && (
        <>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ margin: '3px 0', fontSize: '11px' }}>
            {p.destinatario_nome && <div><b>Para: </b>{p.destinatario_nome}</div>}
            {p.destinatario_telefone && <div><b>Tel: </b>{p.destinatario_telefone}</div>}
            {p.logradouro && (
              <div style={{ marginTop: '2px' }}>
                <b>End: </b>
                {p.logradouro}{p.numero ? `, ${p.numero}` : ''}, {p.bairro}, {p.cidade}/{p.estado}
              </div>
            )}
            {p.referencia && <div><b>Ref: </b>{p.referencia}</div>}
          </div>
        </>
      )}

      <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

      {/* Itens */}
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '2px' }}>Produto</th>
            <th style={{ textAlign: 'right', paddingBottom: '2px' }}>Qtd</th>
            <th style={{ textAlign: 'right', paddingBottom: '2px' }}>Unit</th>
            <th style={{ textAlign: 'right', paddingBottom: '2px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td style={{ paddingTop: '2px', paddingRight: '4px', lineHeight: '1.3' }}>{item.nome_produto}</td>
              <td style={{ textAlign: 'right', paddingTop: '2px' }}>{item.quantidade}</td>
              <td style={{ textAlign: 'right', paddingTop: '2px' }}>{formatarMoeda(item.valor_unitario)}</td>
              <td style={{ textAlign: 'right', paddingTop: '2px' }}>{formatarMoeda(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />

      {/* Totais */}
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal produtos</span>
          <span>{formatarMoeda(p.valor_produtos)}</span>
        </div>
        {p.valor_frete > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Frete</span>
            <span>{formatarMoeda(p.valor_frete)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
          <span>TOTAL</span>
          <span>{formatarMoeda(p.valor_total)}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Pagamento */}
      <div style={{ fontSize: '11px', margin: '3px 0' }}>
        <b>Pagamento: </b>
        <span style={{ fontWeight: p.pago ? 'bold' : 'normal' }}>{p.pago ? 'PAGO' : 'NÃO PAGO'}</span>
        {p.pagamento_tipo && ` — ${LABELS_PAG[p.pagamento_tipo] ?? p.pagamento_tipo}`}
        {p.pagamento_parcial && ` (parcial: ${formatarMoeda(p.valor_pago)})`}
      </div>

      {/* Cartão */}
      {p.tem_cartao && p.mensagem_cartao && (
        <>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ fontSize: '11px', margin: '3px 0', border: '1px solid #000', padding: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Mensagem do cartão:</div>
            <div style={{ fontStyle: 'italic' }}>{p.mensagem_cartao}</div>
          </div>
        </>
      )}

      {/* Observações */}
      {p.observacoes && (
        <>
          <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
          <div style={{ fontSize: '11px', margin: '3px 0' }}>
            <b>Obs: </b>{p.observacoes}
          </div>
        </>
      )}

      <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', margin: '6px 0', lineHeight: '1.5' }}>
        Natureza Em Flores<br />
        Flores para todas as ocasiões, Emoções para toda vida
        {p.impresso_em && (
          <div style={{ marginTop: '4px', fontSize: '9px', color: '#666' }}>
            Impresso em: {formatarDataHora(p.impresso_em)}
          </div>
        )}
      </div>
    </div>
  )
}
