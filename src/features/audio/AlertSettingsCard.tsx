import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { ALERT_PROFILES } from "@/features/audio/presets"
import { useAudioController } from "@/features/audio/useAudioController"
import { usePomodoroStore } from "@/store/pomodoroStore"

export function AlertSettingsCard() {
  const { t } = useTranslation('audio')
  const controller = useAudioController()
  const audioSettings = usePomodoroStore((state) => state.audio)
  const updateAudio = usePomodoroStore((state) => state.actions.updateAudioSettings)

  const handleProfileChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateAudio({ alertProfileId: event.target.value })
  }

  const handleNumberChange = (key: 'alertDurationMs' | 'alertRepeats' | 'alertIntervalMs', value: number) => {
    const numeric = Math.max(0, Math.round(value))
    updateAudio({ [key]: numeric })
  }

  const handleVolumeChange = (value: number) => {
    const normalized = Math.min(Math.max(value, 0), 1)
    updateAudio({ alertVolume: normalized })
  }

  return (
    <div className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('alertSound')}</h2>
      <div className="mt-4 flex flex-col gap-4 text-sm">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{t('alertSound')}</span>
          <select
            value={audioSettings.alertProfileId}
            onChange={handleProfileChange}
            className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {ALERT_PROFILES.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{t('alertVolume')}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(audioSettings.alertVolume * 100)}
            onChange={(event) => handleVolumeChange(Number(event.target.value) / 100)}
            className="accent-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{t('alertDuration')}</span>
          <input
            type="number"
            min={200}
            max={5000}
            step={100}
            value={audioSettings.alertDurationMs}
            onChange={(event) => handleNumberChange('alertDurationMs', Number(event.target.value))}
            className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{t('alertRepeats')}</span>
          <input
            type="number"
            min={1}
            max={5}
            value={audioSettings.alertRepeats}
            onChange={(event) => handleNumberChange('alertRepeats', Number(event.target.value))}
            className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{t('alertInterval')}</span>
          <input
            type="number"
            min={200}
            max={2000}
            step={50}
            value={audioSettings.alertIntervalMs}
            onChange={(event) => handleNumberChange('alertIntervalMs', Number(event.target.value))}
            className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => controller.playAlert()}
        className="mt-6 w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-card transition hover:bg-[var(--accent)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        {t('testAlert')}
      </button>
    </div>
  )
}
