import { useEffect } from 'react'
import { FONT_STACKS } from '@/features/settings/fontOptions'
import { usePomodoroStore } from '@/store/pomodoroStore'

export function useFontSync() {
  const fontId = usePomodoroStore((state) => state.ui.fontId)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const fontStack = FONT_STACKS[fontId] ?? FONT_STACKS.default
    document.documentElement.style.setProperty('--font-base', fontStack)
  }, [fontId])
}
