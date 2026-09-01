'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const router = useRouter()

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-10 py-4">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-wide">MoffittStatus</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/libraries" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Libraries
          </Link>
          <Link href="/discover" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Discover
          </Link>
          <Link href="/rooms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            My Bookings
          </Link>
          <button
            onClick={() => router.push('/login')}
            className="text-sm font-semibold text-white px-5 py-2 rounded-full transition-opacity hover:opacity-85"
            style={{ backgroundColor: '#111111' }}
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>
  )
}
