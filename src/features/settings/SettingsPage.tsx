import { useTranslation } from "react-i18next"
import { TimerSettingsCard } from "@/features/settings/TimerSettingsCard"
import { AlertSettingsCard } from "@/features/audio/AlertSettingsCard"
import { AppearanceCard } from "@/features/settings/AppearanceCard"
import { FontSettingsCard } from "@/features/settings/FontSettingsCard"

export default function SettingsPage() {
  const { t } = useTranslation('common')
  return (
    <div className="space-y-10 py-10">
      <header className="rounded-3xl border border-white/20 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">{t('settings')}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {t('settingsDescription')}
        </p>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <TimerSettingsCard />
        <AlertSettingsCard />
        <AppearanceCard />
        <FontSettingsCard />
      </section>
    </div>
  )
}
