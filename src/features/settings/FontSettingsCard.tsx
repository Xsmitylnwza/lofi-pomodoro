import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FONT_OPTION_META, FONT_STACKS } from "@/features/settings/fontOptions"
import { usePomodoroStore } from "@/store/pomodoroStore"
import type { FontId } from "@/types"

export function FontSettingsCard() {
  const { t } = useTranslation('timer')
  const fontId = usePomodoroStore((state) => state.ui.fontId)
  const updateUi = usePomodoroStore((state) => state.actions.updateUiSettings)

  const fontDescriptions = useMemo(
    () => ({
      default: t('fontDefaultDescription'),
      pangolin: t('fontPangolinDescription'),
      'comic-neue': t('fontComicNeueDescription'),
      'patrick-hand': t('fontPatrickHandDescription'),
    }),
    [t],
  )

  const handleFontSelect = (nextFontId: FontId) => {
    if (fontId === nextFontId) return
    updateUi({ fontId: nextFontId })
  }

  return (
    <div className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('fontHeading')}</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('fontDescription')}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {FONT_OPTION_META.map((option) => {
          const isActive = fontId === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleFontSelect(option.id)}
              className={
                'flex h-full flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ' +
                (isActive ? 'border-[var(--accent)] bg-white/40' : 'border-white/20 hover:border-white/40')
              }
            >
              <span
                className="text-sm font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: FONT_STACKS[option.id] }}
              >
                {option.label}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">{fontDescriptions[option.id]}</span>
              <span
                className="rounded-lg bg-white/60 px-3 py-2 text-base text-[var(--text-primary)]"
                style={{ fontFamily: FONT_STACKS[option.id] }}
              >
                {t('fontSample')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
