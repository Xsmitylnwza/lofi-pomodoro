import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BACKGROUND_PRESETS } from "@/features/settings/backgroundPresets"
import { usePomodoroStore } from "@/store/pomodoroStore"

export function AppearanceCard() {
  const { t } = useTranslation('timer')
  const uiSettings = usePomodoroStore((state) => state.ui)
  const updateUi = usePomodoroStore((state) => state.actions.updateUiSettings)
  const [customUrl, setCustomUrl] = useState(uiSettings.backgroundCustomUrl || '')

  const handlePresetSelect = (presetId: string) => {
    updateUi({ backgroundPresetId: presetId, backgroundCustomUrl: undefined })
  }

  const handleApplyCustom = () => {
    if (!customUrl) return
    updateUi({ backgroundCustomUrl: customUrl })
  }

  const handleClearCustom = () => {
    setCustomUrl('')
    updateUi({ backgroundCustomUrl: undefined })
  }

  return (
    <div className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('background')}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetSelect(preset.id)}
            className={
              'relative overflow-hidden rounded-2xl border text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ' +
              (uiSettings.backgroundCustomUrl
                ? 'border-white/20'
                : preset.id === uiSettings.backgroundPresetId
                ? 'border-[var(--accent)]'
                : 'border-transparent hover:border-white/40')
            }
          >
            <img src={preset.thumbnail || preset.url} alt="" className="h-24 w-full object-cover" loading="lazy" />
            <span className="absolute inset-x-0 bottom-0 bg-black/40 px-3 py-2 text-xs font-medium text-white">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wide text-[var(--text-secondary)]" htmlFor="customBackground">
          {t('backgroundCustomUrl')}
        </label>
        <input
          id="customBackground"
          value={customUrl}
          onChange={(event) => setCustomUrl(event.target.value)}
          placeholder="https://"
          className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApplyCustom}
            className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-card transition hover:bg-[var(--accent)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {t('apply')}
          </button>
          <button
            type="button"
            onClick={handleClearCustom}
            className="rounded-full bg-white/30 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {t('clear')}
          </button>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 text-sm">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={uiSettings.blurBackground}
            onChange={(event) => updateUi({ blurBackground: event.target.checked })}
            className="h-4 w-4 rounded border border-white/60 bg-white/60 text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <span>{t('backgroundBlur')}</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={uiSettings.reduceMotion}
            onChange={(event) => updateUi({ reduceMotion: event.target.checked })}
            className="h-4 w-4 rounded border border-white/60 bg-white/60 text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <span>{t('reduceMotion')}</span>
        </label>
      </div>
    </div>
  )
}
