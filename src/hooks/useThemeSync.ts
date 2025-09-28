import { useEffect } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'

type ThemeMode = 'light' | 'dark'

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', mode)
  document.body.classList.toggle('dark', mode === 'dark')
}

export function useThemeSync() {
  const themeMode = usePomodoroStore((state) => state.ui.themeMode)
  const reduceMotion = usePomodoroStore((state) => state.ui.reduceMotion)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applyFromMatch = (isDark: boolean) => applyTheme(isDark ? 'dark' : 'light')
      const listener = (event: MediaQueryListEvent) => {
        applyFromMatch(event.matches)
      }

      applyFromMatch(mediaQuery.matches)
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }

    applyTheme(themeMode)
    return
  }, [themeMode])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  }, [reduceMotion])
}
