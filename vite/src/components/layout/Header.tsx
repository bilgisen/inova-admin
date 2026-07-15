import { Moon, Sun, Monitor, Languages } from 'lucide-react'
import { useTheme } from '../../providers/ThemeProvider'
import { useI18n } from '../../providers/I18nProvider'

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { lang, setLang, t } = useI18n()

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'] as const
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">{t('dashboard.title')}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors cursor-pointer"
          title={lang === 'en' ? 'Switch to Turkish' : 'Switch to English'}
        >
          <Languages className="w-4 h-4" />
          {t(`lang.${lang}`)}
        </button>
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm hover:bg-muted transition-colors cursor-pointer"
          title={`${t('theme.light')} / ${t('theme.dark')} / ${t('theme.system')}`}
        >
          <ThemeIcon className="w-4 h-4" />
          {t(`theme.${theme}`)}
        </button>
      </div>
    </header>
  )
}
