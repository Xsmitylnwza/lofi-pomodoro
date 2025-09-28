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
    const trimmed = customUrl.trim()
    if (!trimmed) return
    setCustomUrl(trimmed)
    updateUi({ backgroundCustomUrl: trimmed })
  }

  const handleClearCustom = () => {
    setCustomUrl('')
    updateUi({ backgroundCustomUrl: undefined })
  }

  const isCustomActive = Boolean(uiSettings.backgroundCustomUrl)

  return (
    <div className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('background')}</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('backgroundDescription')}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {BACKGROUND_PRESETS.map((preset) => {
          const isActive = !isCustomActive && preset.id === uiSettings.backgroundPresetId
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={
                'relative overflow-hidden rounded-2xl border text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ' +
                (isActive ? 'border-[var(--accent)] bg-white/40' : 'border-white/20 hover:border-white/40')
              }
            >
              {preset.kind === 'solid' ? (
                <div
                  className="h-24 w-full"
                  style={{ background: preset.color ?? 'var(--bg-primary)' }}
                />
              ) : (
                <img
                  src={preset.thumbnail || preset.url}
                  alt=""
                  className="h-24 w-full object-cover"
                  loading="lazy"
                />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/35 px-3 py-2 text-xs font-medium text-white">
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 rounded-2xl border border-white/25 bg-white/30 p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('backgroundCustomTitle')}</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{t('backgroundCustomHelp')}</p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            id="customBackground"
            value={customUrl}
            onChange={(event) => setCustomUrl(event.target.value)}
            placeholder="https://"
            className="rounded-xl border border-white/40 bg-white/70 px-4 py-2 text-sm text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApplyCustom}
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-card transition hover:bg-[var(--accent)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
            {isCustomActive ? (
              <span className="rounded-full bg-[var(--bg-primary)]/80 px-3 py-2 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                {t('backgroundCustomActive')}
              </span>
            ) : null}
          </div>
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
