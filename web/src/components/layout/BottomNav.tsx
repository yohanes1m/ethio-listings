'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, User } from 'lucide-react'
import { useTranslation } from '@/lib/useTranslation'

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const TABS = [
    { href: '/', icon: Home, label: t('nav.home') },
    { href: '/browse/houses', icon: Search, label: t('nav.browse') },
    { href: '/saved', icon: Heart, label: t('nav.saved') },
    { href: '/dashboard', icon: User, label: t('nav.profile') },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background">
      <div className="flex">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-[10px] font-medium transition-colors min-h-[56px] ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
