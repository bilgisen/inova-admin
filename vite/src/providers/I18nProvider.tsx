import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type Lang = 'en' | 'tr'

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

async function loadMessages(lang: Lang): Promise<Record<string, unknown>> {
  const mod = lang === 'tr'
    ? await import('../i18n/tr.json')
    : await import('../i18n/en.json')
  return mod.default || mod
}

const cache: Record<string, Record<string, unknown>> = {}

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, path))
    } else {
      result[path] = String(value)
    }
  }
  return result
}

async function getMessages(lang: Lang): Promise<Record<string, string>> {
  if (!cache[lang]) {
    cache[lang] = flatten(await loadMessages(lang) as Record<string, unknown>)
  }
  return cache[lang]
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('lang') as Lang | null
    return stored || 'en'
  })

  const [messages, setMessages] = useState<Record<string, string>>({})

  useState(() => {
    getMessages(lang).then(setMessages)
  })

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
    getMessages(newLang).then(setMessages)
  }, [])

  const t = useCallback((key: string) => {
    return messages[key] || key
  }, [messages])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
