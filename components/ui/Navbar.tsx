'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const FORMULARIOS = [
  { href: '/entrega', label: 'Entrega' },
  { href: '/retirada', label: 'Retirada' },
  { href: '/balcao', label: 'Balcão' },
]

const tabs = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/vendedores', label: 'Vendedores' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false)
      }
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  const formularioAtivo = FORMULARIOS.some((f) => pathname.startsWith(f.href))
  const labelAtivo = FORMULARIOS.find((f) => pathname.startsWith(f.href))?.label

  return (
    <header className="bg-[#1B5E20] shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <Image src="/NaturezaemFlores.png" alt="Logo" width={140} height={36} className="h-9 w-auto object-contain" />
        </div>
        <nav className="flex items-center gap-1 w-full sm:w-auto justify-start sm:justify-end">

          {/* Dropdown fora do container com overflow para não ser cortado */}
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              onClick={() => setDropdownAberto((v) => !v)}
              className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formularioAtivo
                  ? 'bg-white text-[#1B5E20]'
                  : 'text-green-100 hover:bg-green-700'
              }`}
            >
              {labelAtivo ?? 'Novo Pedido'}
              <ChevronDown size={13} className={`transition-transform duration-150 ${dropdownAberto ? 'rotate-180' : ''}`} />
            </button>
            {dropdownAberto && (
              <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
                {FORMULARIOS.map((f) => {
                  const active = pathname.startsWith(f.href)
                  return (
                    <Link
                      key={f.href}
                      href={f.href}
                      onClick={() => setDropdownAberto(false)}
                      className={`block px-4 py-2.5 text-sm transition-colors ${
                        active
                          ? 'bg-green-50 text-green-900 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {f.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Abas restantes com scroll horizontal no mobile */}
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {tabs.map((tab) => {
              const active = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#1B5E20]'
                      : 'text-green-100 hover:bg-green-700'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}
