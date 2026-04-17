'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'OskiChat' },
  { href: '/hours', label: 'Hours' },

];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4 gap-x-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="text-md font-bold tracking-tight text-slate-900">
            MoffittStatus
          </span>
        </Link>

        <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'rounded-full px-4 py-2 text-xs md:text-sm font-medium transition-all duration-200',
                  'hover:bg-white hover:text-slate-900',
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}