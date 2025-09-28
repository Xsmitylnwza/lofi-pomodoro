import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { usePomodoroStore } from "@/store/pomodoroStore"

const themeSequence: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']

export function ThemeToggle() {
  const { t } = useTranslation('common')
  const themeMode = usePomodoroStore((state) => state.ui.themeMode)
  const updateUi = usePomodoroStore((state) => state.actions.updateUiSettings)

  const nextTheme = useMemo(() => {
    const currentIndex = themeSequence.indexOf(themeMode)
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % themeSequence.length : 0
    return themeSequence[nextIndex]
  }, [themeMode])

  const labels: Record<(typeof themeSequence)[number], string> = useMemo(
    () => ({
      light: t('light'),
      dark: t('dark'),
      system: t('system'),
    }),
    [t],
  )

  const handleToggle = useCallback(() => {
    updateUi({ themeMode: nextTheme })
  }, [nextTheme, updateUi])

  const icon = themeMode === 'dark' ? '🌙' : themeMode === 'system' ? '🌓' : '☀️'
  const ariaLabel = t('theme') + ': ' + labels[themeMode]

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="inline-flex items-center gap-2 rounded-full bg-white/30 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] shadow-card backdrop-blur transition hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] dark:bg-white/10 dark:text-lofi-sand"
      aria-label={ariaLabel}
    >
      <span aria-hidden>{icon}</span>
      <span className="hidden sm:inline">{labels[themeMode]}</span>
    </button>
  )
}
