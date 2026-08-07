'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLanguageStore, type Language } from '@/store/languageStore'
import { useLogout } from '@/hooks/useAuth'
import { useTranslation } from '@/lib/useTranslation'

const LANGS: { code: Language; label: string }[] = [
  { code: 'am', label: 'አማ' },
  { code: 'en', label: 'EN' },
  { code: 'om', label: 'ORO' },
]

export function Header() {
  const { isAuthenticated, user } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const logout = useLogout()
  const { t } = useTranslation()
  const pathname = usePathname()

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      '?'
    : '?'

  // Storing the pathname at open-time means the menu auto-closes on navigation
  // without any effect or ref read during render.
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null)
  const isOpen = menuOpenPath === pathname
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenPath(null)
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpenPath(null)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  const navLinks = [
    { href: '/browse/houses', label: 'Browse' },
    ...(isAuthenticated ? [{ href: '/saved', label: 'Saved' }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/98 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex h-[60px] items-center gap-6 px-5">

        {/* Wordmark */}
        <Link href="/" className="shrink-0 flex items-baseline gap-px">
          <span className="text-[17px] font-extrabold tracking-tight text-primary leading-none">
            Ethio
          </span>
          <span className="text-[17px] font-medium tracking-tight text-foreground/55 leading-none">
            Listings
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Language toggle — pill segmented control */}
        <div className="hidden sm:flex items-center gap-0.5 bg-muted/70 rounded-full px-1 py-1">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-3 py-0.5 text-[11px] font-semibold rounded-full tracking-wide transition-all duration-150 ${
                language === code
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auth section */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpenPath(isOpen ? null : pathname)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold ring-1 ring-primary/20 hover:ring-primary/40 transition-all"
                aria-haspopup="true"
                aria-expanded={isOpen}
              >
                {user?.first_name ?? initials}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-background shadow-lg py-1 z-50">
                  <div className="px-3 py-2 text-xs text-muted-foreground font-medium truncate">
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name ?? ''}`.trim()
                      : user?.email}
                  </div>
                  <div className="h-px bg-border mx-2 my-1" />
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                    onClick={() => setMenuOpenPath(null)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setMenuOpenPath(null); logout() }}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted/60 transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
