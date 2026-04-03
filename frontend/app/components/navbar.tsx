'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const path = usePathname()
  // Dark pages get a transparent dark navbar; light pages get a white one
  const isDark = path === '/' || path === '/rooms'

  return (
    <nav className={`w-full fixed top-0 left-0 z-50 ${isDark ? 'bg-transparent' : 'bg-white border-b border-gray-100'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white/60 hover:text-white' : 'text-gray-900'} transition-colors`}>
          MoffittStatus
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/rooms" className={`text-sm ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
            Rooms
          </Link>
          <Link href="/libraries" className={`text-sm ${isDark ? 'text-white/40 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}>
            Libraries
          </Link>
        </div>
      </div>
    </nav>
  )
}
