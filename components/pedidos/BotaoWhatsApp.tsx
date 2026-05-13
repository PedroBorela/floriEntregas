'use client'

import { useState } from 'react'
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
  const horario = pedido.horario_entrega ? ` — ${pedido.horario_entrega}` : ''
  const data = pedido.data_entrega
    ? new Date(pedido.data_entrega + 'T00:00:00').toLocaleDateString('pt-BR')
    : ''
  const previsao = data ? `${data}${horario}` : horario || 'a confirmar'

  if (tipo === 'confirmacao') {
    const itensTxt = pedido.pedido_itens
      ?.map((i) => `  • ${i.quantidade}× ${i.nome_produto}`)
      .join('\n') ?? ''
    const endTxt = pedido.logradouro
      ? `\n📍 ${pedido.logradouro}${pedido.numero ? `, ${pedido.numero}` : ''} — ${pedido.bairro}`
      : ''
    return (
      `Olá ${pedido.cliente_nome}! 🌸 Seu pedido na *Natureza em Flores* foi confirmado!\n\n` +
      `📦 *Pedido:* ${pedido.codigo}\n` +
      `${itensTxt ? itensTxt + '\n' : ''}` +
      `📅 *Entrega:* ${previsao}` +
      `${endTxt}\n` +
      `💰 *Total:* R$ ${pedido.valor_total.toFixed(2).replace('.', ',')}\n\n` +
      `Qualquer dúvida estamos à disposição! 💚`
    )
  }

  return (
    `Olá ${pedido.cliente_nome}! Seu pedido *${pedido.codigo}* da Natureza em Flores saiu para entrega. 🚚🌸\n\n` +
    `📅 Previsão: ${previsao}\n\n` +
    `Obrigado pela preferência! 💚`
  )
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

    // Registra o envio na API
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
        <span>📲</span>
        {enviado ? 'Confirmação enviada' : 'Enviar confirmação WhatsApp'}
      </button>
    )
  }

  // tipo === 'saiu_entrega'
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
      <span>🚚</span>
      {enviado ? 'Aviso enviado' : 'Avisar comprador — saiu p/ entrega'}
    </button>
  )
}
