import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppHeader } from '@/components/AppHeader'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { useThemeSync } from '@/hooks/useThemeSync'
import { useFontSync } from '@/hooks/useFontSync'
import { useBackgroundThemeTokens, useThemeTokensSync } from '@/hooks/useThemeTokens'
import AnalyticsPage from '@/features/analytics/AnalyticsPage'
import TimerPage from '@/features/timer/TimerPage'
import { GlobalMusicPlayer } from '@/features/audio/GlobalMusicPlayer'
import SettingsPage from '@/features/settings/SettingsPage'
import { usePomodoroStore } from '@/store/pomodoroStore'

function Loader() {
  return (
    <div className="flex w-full justify-center py-24 text-base text-[var(--text-secondary)]">
      Loading…
    </div>
  )
}

export default function App() {
  useThemeSync()
  useFontSync()
  useBackgroundThemeTokens()
  useThemeTokensSync()
  const language = usePomodoroStore((state) => state.ui.language)
  const { i18n } = useTranslation()

  useEffect(() => {
    void i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <BackgroundLayer />
      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/timer" replace />} />
              <Route path="/timer" element={<TimerPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/timer" replace />} />
            </Routes>
          </Suspense>
        </main>
        <GlobalMusicPlayer />
      </div>
    </div>
  )
}









