import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { usePomodoroStore } from "@/store/pomodoroStore"

const languages: ('en' | 'th')[] = ['en', 'th']

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')
  const activeLanguage = usePomodoroStore((state) => state.ui.language)
  const updateUi = usePomodoroStore((state) => state.actions.updateUiSettings)

  const handleSelect = useCallback(
    (lang: 'en' | 'th') => {
      updateUi({ language: lang })
      void i18n.changeLanguage(lang)
    },
    [updateUi, i18n],
  )

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      <span className="hidden sm:inline text-[var(--text-secondary)]">{t('language')}</span>
      <div className="flex rounded-full bg-white/30 p-1 shadow-card backdrop-blur dark:bg-white/10">
        {languages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => handleSelect(lang)}
            className={
              'rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ' +
              (lang === activeLanguage
                ? 'bg-white/80 text-[var(--text-primary)] shadow-card'
                : 'text-[var(--text-secondary)] hover:bg-white/40')
            }
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
