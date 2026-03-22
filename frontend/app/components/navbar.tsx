'use client'
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="w-full border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-md font-bold text-foreground">
            MoffittStatus
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-foreground">{session.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium text-gray-500 hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-foreground transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
