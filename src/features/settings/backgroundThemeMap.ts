import type { ThemeTokens } from '@/types'
import { createThemeTokensFromBase } from '@/utils/color'

const PRESET_BASE_COLORS: Record<string, string> = {
  dawn: '#f8a8c6',
  'rainy-window': '#5a7ba5',
  'neon-city': '#ff6ec7',
  'moonlit-loft': '#8da0ff',
}

const memo = new Map<string, ThemeTokens>()

export function getPresetThemeTokens(presetId: string): ThemeTokens | undefined {
  const base = PRESET_BASE_COLORS[presetId]
  if (!base) {
    return undefined
  }
  if (!memo.has(presetId)) {
    memo.set(presetId, createThemeTokensFromBase(base))
  }
  return memo.get(presetId)
}
