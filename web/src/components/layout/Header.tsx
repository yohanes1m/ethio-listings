'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useLanguageStore, type Language } from '@/store/languageStore'
import { useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const LANGS: { code: Language; label: string }[] = [
  { code: 'am', label: 'አማ' },
  { code: 'en', label: 'EN' },
  { code: 'om', label: 'ORO' },
]

export function Header() {
  const { isAuthenticated, user } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const logout = useLogout()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-6xl mx-auto flex h-14 items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
          <span className="text-primary">Ethio</span>Listings
        </Link>

        <div className="flex-1" />

        {/* Language toggle */}
        <div className="hidden sm:flex items-center rounded-lg border border-border p-0.5 gap-0.5">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === code
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden sm:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {user?.first_name}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
