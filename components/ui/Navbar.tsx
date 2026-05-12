'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const tabs = [
  { href: '/entrega', label: 'Entrega' },
  { href: '/retirada', label: 'Retirada' },
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/analytics', label: 'Analytics' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="bg-[#1B5E20] shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <Image src="/NaturezaemFlores.png" alt="Logo" width={140} height={36} className="h-9 w-auto object-contain" />
        </div>
        <nav className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar justify-start sm:justify-end">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-[#1B5E20]'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
