'use client'

import { useEffect, useRef } from 'react'
import type { Pedido, PedidoStatus } from '@/lib/types'

const LOJA = { lat: -20.2578, lng: -42.0339 }

const COR_STATUS: Record<PedidoStatus, string> = {
  pendente:     '#EF4444',
  em_preparo:   '#EAB308',
  saiu_entrega: '#3B82F6',
  entregue:     '#22C55E',
  retirado:     '#22C55E',
  cancelado:    '#9CA3AF',
}

function pinSvg(cor: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 24 14 24s14-14.667 14-24C28 6.268 21.732 0 14 0z"
        fill="${cor}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`.trim()
}

interface Props {
  pedidos: Pedido[]
  onClickPedido?: (codigo: string) => void
}

export default function MapaEntregas({ pedidos, onClickPedido }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    let destroyed = false

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current) return

      // Evita dupla inicialização (hot-reload)
      const el = containerRef.current as HTMLDivElement & { _leaflet_id?: number }
      if (el._leaflet_id) {
        (mapRef.current as { remove?: () => void })?.remove?.()
      }

      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [LOJA.lat, LOJA.lng],
        14
      )

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      // Pin da loja
      const lojaIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#1B5E20;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px">🌸</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      L.marker([LOJA.lat, LOJA.lng], { icon: lojaIcon })
        .bindPopup('<strong>Natureza Em Flores</strong><br>Ponto de partida')
        .addTo(map)

      // Pins dos pedidos com coordenadas
      pedidos
        .filter((p) => p.latitude != null && p.longitude != null)
        .forEach((p) => {
          const cor = COR_STATUS[p.status] ?? '#9CA3AF'
          const icon = L.divIcon({
            html: pinSvg(cor),
            className: '',
            iconSize: [28, 38],
            iconAnchor: [14, 38],
            popupAnchor: [0, -38],
          })

          const horario = p.horario_entrega ? p.horario_entrega.slice(0, 5) : '—'
          const endereco = [p.logradouro, p.numero, p.bairro].filter(Boolean).join(', ')

          const popup = `
            <div style="min-width:180px;font-family:system-ui;font-size:13px">
              <strong style="color:#1B5E20;font-size:14px">${p.codigo}</strong><br>
              ${p.cliente_nome}<br>
              <span style="color:#6B7280">${horario} · ${endereco || 'Endereço não informado'}</span><br>
              ${onClickPedido
                ? `<a href="#" onclick="window.__mapaClick?.('${p.codigo}');return false"
                     style="color:#1B5E20;font-weight:600;text-decoration:none">Ver detalhe →</a>`
                : ''}
            </div>`

          L.marker([p.latitude!, p.longitude!], { icon })
            .bindPopup(popup)
            .addTo(map)
        })

      if (onClickPedido) {
        ;(window as unknown as Record<string, unknown>).__mapaClick = onClickPedido
      }

      mapRef.current = map
    })

    return () => {
      destroyed = true
      ;(mapRef.current as { remove?: () => void })?.remove?.()
      mapRef.current = null
    }
  }, [pedidos, onClickPedido])

  const comCoordenadas = pedidos.filter((p) => p.latitude != null && p.longitude != null).length
  const semCoordenadas = pedidos.length - comCoordenadas

  return (
    <div>
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: 420 }}
      />
      {semCoordenadas > 0 && (
        <p className="text-xs text-amber-600 mt-2">
          {semCoordenadas} pedido(s) sem coordenadas não aparecem no mapa — preencha o CEP para geolocalizar.
        </p>
      )}
    </div>
  )
}
