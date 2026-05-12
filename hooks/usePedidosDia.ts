'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Pedido } from '@/lib/types'

export function usePedidosDia() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  async function carregar() {
    const hoje = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('pedidos')
      .select('*, pedido_itens(*)')
      .eq('data_entrega', hoje)
      .neq('status', 'cancelado')
      .order('horario_entrega', { ascending: true })

    setPedidos((data as Pedido[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()

    const channel = supabase
      .channel('pedidos-dia-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => carregar()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function avancarStatus(id: string) {
    await fetch(`/api/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'avancar_status' }),
    })
  }

  async function cancelarPedido(id: string) {
    await fetch(`/api/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'cancelar' }),
    })
  }

  return { pedidos, loading, avancarStatus, cancelarPedido, recarregar: carregar }
}
