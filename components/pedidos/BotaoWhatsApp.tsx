'use client'

import { useState } from 'react'
import { formatarMoeda } from '@/lib/formatters'
import type { Pedido } from '@/lib/types'

type Tipo = 'confirmacao' | 'saiu_entrega'

interface Props {
  pedido: Pedido
  tipo: Tipo
}

function limparTelefone(tel: string) {
  return tel.replace(/\D/g, '')
}

function gerarMensagem(pedido: Pedido, tipo: Tipo): string {
  const data = pedido.data_entrega
    ? new Date(pedido.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')
    : ''
  const previsao = [data, pedido.horario_entrega].filter(Boolean).join(' — ') || 'a confirmar'

  if (tipo === 'confirmacao') {
    const itens = pedido.pedido_itens?.length
      ? pedido.pedido_itens.map((i) => `  ${i.quantidade}x ${i.nome_produto}`).join('\n')
      : ''

    const linhas: string[] = [
      `Olá, ${pedido.cliente_nome}!`,
      '',
      'Seu pedido na Natureza em Flores foi confirmado.',
      '',
      `*Pedido:* ${pedido.codigo}`,
    ]

    if (itens) linhas.push(itens)
    linhas.push('')

    if (pedido.tipo === 'entrega') {
      linhas.push(`*Entrega:* ${previsao}`)
      if (pedido.logradouro) {
        linhas.push(
          `*Endereço:* ${pedido.logradouro}${pedido.numero ? `, ${pedido.numero}` : ''}${pedido.bairro ? ` — ${pedido.bairro}` : ''}`
        )
      }
    } else {
      linhas.push(`*Retirada:* ${previsao}`)
    }

    linhas.push('')
    linhas.push(`*Total:* ${formatarMoeda(pedido.valor_total)}`)

    if (pedido.pagamento_parcial) {
      const restante = Math.max(0, pedido.valor_total - pedido.valor_pago)
      linhas.push(`*Restante a pagar:* ${formatarMoeda(restante)}`)
    } else if (!pedido.pago) {
      linhas.push('*Pagamento:* a realizar')
    }

    linhas.push('')
    linhas.push('Qualquer dúvida, é só chamar.')
    linhas.push('Natureza em Flores')

    return linhas.join('\n')
  }

  // saiu_entrega
  return [
    `Olá, ${pedido.cliente_nome}!`,
    '',
    `Seu pedido *${pedido.codigo}* saiu para entrega agora.`,
    '',
    `*Previsão:* ${previsao}`,
    '',
    'Natureza em Flores',
  ].join('\n')
}

export default function BotaoWhatsApp({ pedido, tipo }: Props) {
  const [enviado, setEnviado] = useState(
    tipo === 'confirmacao' ? pedido.whatsapp_confirmacao_enviado : pedido.whatsapp_saiu_enviado
  )

  const telefone = limparTelefone(pedido.cliente_telefone)
  if (!telefone) return null

  async function handleClick() {
    const msg = gerarMensagem(pedido, tipo)
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`, '_blank')

    const campo = tipo === 'confirmacao' ? 'whatsapp_confirmacao' : 'whatsapp_saiu'
    await fetch(`/api/pedidos/${pedido.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'marcar_whatsapp', campo }),
    })
    setEnviado(true)
  }

  if (tipo === 'confirmacao') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
          enviado
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700'
        }`}
      >
        {enviado ? 'Confirmação enviada' : 'Enviar confirmação WhatsApp'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
        enviado
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
      }`}
    >
      {enviado ? 'Aviso enviado' : 'Avisar comprador — saiu p/ entrega'}
    </button>
  )
}
