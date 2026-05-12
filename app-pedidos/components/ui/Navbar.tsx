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
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <Image src="/iconef.png" alt="Logo" width={36} height={36} className="rounded-full" />
          <span className="text-white font-semibold text-lg hidden sm:block">Natureza Em Flores</span>
        </div>
        <nav className="flex gap-1">
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
