import { useEffect } from 'react'
import { getPresetThemeTokens } from '@/features/settings/backgroundThemeMap'
import { usePomodoroStore } from '@/store/pomodoroStore'
import type { ThemeMode, ThemeTokenSet, ThemeTokens } from '@/types'
import { createThemeTokensFromBase, rgbToHex } from '@/utils/color'

const FALLBACK_BASE_COLOR = '#f8a8c6'
const FALLBACK_TOKENS = createThemeTokensFromBase(FALLBACK_BASE_COLOR)
const customTokenCache = new Map<string, ThemeTokens>()

const TOKEN_VAR_MAP: Record<keyof ThemeTokenSet, string> = {
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgOverlay: '--bg-overlay',
  bgOverlayStrong: '--bg-overlay-strong',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  accent: '--accent',
}

const TOKEN_KEYS = Object.keys(TOKEN_VAR_MAP) as (keyof ThemeTokenSet)[]

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'dark') return 'dark'
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }
  return 'light'
}

function isLikelyVideo(url: string): boolean {
  const value = url.split('?')[0]?.toLowerCase() ?? ''
  return ['.mp4', '.webm', '.mov', '.m4v', '.ogv', '.avi'].some((extension) => value.endsWith(extension))
}

async function extractAverageColor(url: string): Promise<string | undefined> {
  if (typeof window === 'undefined' || isLikelyVideo(url)) {
    return undefined
  }

  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 32
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) {
          resolve(undefined)
          return
        }
        context.drawImage(image, 0, 0, size, size)
        const { data } = context.getImageData(0, 0, size, size)
        let rTotal = 0
        let gTotal = 0
        let bTotal = 0
        let weightTotal = 0

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3]
          if (alpha === 0) continue
          rTotal += data[index] * alpha
          gTotal += data[index + 1] * alpha
          bTotal += data[index + 2] * alpha
          weightTotal += alpha
        }

        if (weightTotal === 0) {
          resolve(undefined)
          return
        }

        resolve(
          rgbToHex({
            r: Math.round(rTotal / weightTotal),
            g: Math.round(gTotal / weightTotal),
            b: Math.round(bTotal / weightTotal),
          }),
        )
      } catch {
        resolve(undefined)
      }
    }

    image.onerror = () => resolve(undefined)
    image.src = url
  })
}

async function computeTokensForCustom(url: string): Promise<ThemeTokens | undefined> {
  if (customTokenCache.has(url)) {
    return customTokenCache.get(url)
  }
  const average = await extractAverageColor(url)
  if (!average) {
    return undefined
  }
  const tokens = createThemeTokensFromBase(average)
  customTokenCache.set(url, tokens)
  return tokens
}

export function useBackgroundThemeTokens() {
  const matchBackgroundTheme = usePomodoroStore((state) => state.ui.matchBackgroundTheme)
  const presetId = usePomodoroStore((state) => state.ui.backgroundPresetId)
  const customUrl = usePomodoroStore((state) => state.ui.backgroundCustomUrl)
  const currentTokens = usePomodoroStore((state) => state.ui.themeTokens)
  const setThemeTokens = usePomodoroStore((state) => state.actions.setThemeTokens)

  useEffect(() => {
    if (!matchBackgroundTheme) {
      if (currentTokens) {
        setThemeTokens(undefined)
      }
      return
    }

    let disposed = false

    const apply = (tokens: ThemeTokens | undefined) => {
      if (!disposed) {
        setThemeTokens(tokens)
      }
    }

    const run = async () => {
      if (customUrl) {
        const customTokens = await computeTokensForCustom(customUrl)
        if (customTokens) {
          apply(customTokens)
          return
        }
      }

      const presetTokens = getPresetThemeTokens(presetId)
      if (presetTokens) {
        apply(presetTokens)
        return
      }

      if (presetId === 'none' && !customUrl) {
        apply(undefined)
        return
      }

      apply(FALLBACK_TOKENS)
    }

    void run()

    return () => {
      disposed = true
    }
  }, [matchBackgroundTheme, presetId, customUrl, currentTokens, setThemeTokens])
}

export function useThemeTokensSync() {
  const themeMode = usePomodoroStore((state) => state.ui.themeMode)
  const tokens = usePomodoroStore((state) => state.ui.themeTokens)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const rootStyle = document.documentElement.style

    const applyTokens = () => {
      if (!tokens) {
        TOKEN_KEYS.forEach((key) => {
          rootStyle.removeProperty(TOKEN_VAR_MAP[key])
        })
        return
      }

      const resolved = resolveTheme(themeMode)
      const active = tokens[resolved]
      TOKEN_KEYS.forEach((key) => {
        rootStyle.setProperty(TOKEN_VAR_MAP[key], active[key])
      })
    }

    applyTokens()

    if (tokens && themeMode === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTokens()
      mediaQuery.addEventListener('change', listener)
      return () => {
        mediaQuery.removeEventListener('change', listener)
      }
    }

    return undefined
  }, [tokens, themeMode])
}



