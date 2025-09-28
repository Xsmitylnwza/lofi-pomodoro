import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'

const baseNavClass =
  'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    baseNavClass,
    isActive
      ? 'bg-white/30 text-[var(--text-primary)] shadow-card'
      : 'text-[var(--text-secondary)]',
  ].join(' ')

export function AppHeader() {
  const { t } = useTranslation('common')
  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
          {t('appName')}
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/timer" className={navLinkClass}>
            {t('timer')}
          </NavLink>
          <NavLink to="/analytics" className={navLinkClass}>
            {t('analytics')}
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            {t('settings')}
          </NavLink>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  )
}
