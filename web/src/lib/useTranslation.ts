'use client'

import { useLanguageStore } from '@/store/languageStore'
import en from './translations/en.json'
import am from './translations/am.json'
import om from './translations/om.json'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

type Translations = typeof en
type PartialTranslations = DeepPartial<Translations>

const translations: Record<string, PartialTranslations> = { en, am, om }

function get(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function useTranslation() {
  const { language } = useLanguageStore()

  function t(key: string): string {
    const current = translations[language] ?? {}
    const fallback = translations['am'] ?? {}
    const enFallback = translations['en'] ?? {}
    return (
      get(current as Record<string, unknown>, key) ??
      get(fallback as Record<string, unknown>, key) ??
      get(enFallback as Record<string, unknown>, key) ??
      key
    )
  }

  return { t, language }
}
