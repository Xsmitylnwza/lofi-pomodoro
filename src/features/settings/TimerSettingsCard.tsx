import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { usePomodoroStore } from "@/store/pomodoroStore"
import type { TimerSettings } from "@/types"

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  if (value < min) return min
  if (value > max) return max
  return value
}

type NumericTimerSettingKey =
  | 'workMinutes'
  | 'shortBreakMinutes'
  | 'longBreakMinutes'
  | 'longBreakInterval'
  | 'dailyRoundTarget'

export function TimerSettingsCard() {
  const { t } = useTranslation('timer')
  const settings = usePomodoroStore((state) => state.settings)
  const updateTimerSettings = usePomodoroStore((state) => state.actions.updateTimerSettings)
  const plannedMinutes = usePomodoroStore((state) => Math.round(state.timerRuntime.plannedSec / 60))

  const handleSettingsChange = useCallback(
    (field: NumericTimerSettingKey, value: number) => {
      const numericValue = clamp(value, 0, 999)
      const patch: Partial<TimerSettings> = {}
      ;(patch as Record<string, number>)[field] = numericValue
      updateTimerSettings(patch)
    },
    [updateTimerSettings],
  )

  const renderNumberInput = (
    id: NumericTimerSettingKey,
    label: string,
    min: number,
    max: number,
  ) => (
    <label key={id} className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={settings[id]}
        onChange={(event) => handleSettingsChange(id, Number(event.target.value))}
        className="w-full rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      />
    </label>
  )

  return (
    <div className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('settingsTitle')}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {renderNumberInput('workMinutes', t('workDuration'), 1, 180)}
        {renderNumberInput('shortBreakMinutes', t('shortBreakDuration'), 1, 60)}
        {renderNumberInput('longBreakMinutes', t('longBreakDuration'), 5, 120)}
        {renderNumberInput('longBreakInterval', t('longBreakInterval'), 1, 12)}
        {renderNumberInput('dailyRoundTarget', t('roundsTarget'), 1, 20)}
      </div>
      <div className="mt-6 flex flex-col gap-3 text-sm">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoStartWorkSessions}
            onChange={(event) => updateTimerSettings({ autoStartWorkSessions: event.target.checked })}
            className="h-4 w-4 rounded border border-white/60 bg-white/60 text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <span>{t('autoStartWork')}</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoStartBreaks}
            onChange={(event) => updateTimerSettings({ autoStartBreaks: event.target.checked })}
            className="h-4 w-4 rounded border border-white/60 bg-white/60 text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <span>{t('autoStartBreaks')}</span>
        </label>
      </div>
      <p className="mt-6 rounded-2xl bg-white/30 px-4 py-3 text-xs text-[var(--text-secondary)] dark:bg-white/10">
        {t('focus')} · {plannedMinutes} {t('minutesSuffix')}
      </p>
    </div>
  )
}
