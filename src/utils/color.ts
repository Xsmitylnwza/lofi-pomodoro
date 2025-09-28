import type { ThemeTokens } from '@/types'

interface RgbColor {
  r: number
  g: number
  b: number
}

interface HslColor {
  h: number
  s: number
  l: number
}

const DEFAULT_LIGHT_TEXT_PRIMARY = '#2d1f26'
const DEFAULT_LIGHT_TEXT_SECONDARY = 'rgba(45, 31, 38, 0.65)'
const DEFAULT_DARK_TEXT_PRIMARY = '#f4ede2'
const DEFAULT_DARK_TEXT_SECONDARY = 'rgba(244, 237, 226, 0.75)'

const WHITE: RgbColor = { r: 255, g: 255, b: 255 }
const NIGHT: RgbColor = { r: 12, g: 11, b: 20 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function clamp01(value: number): number {
  return clamp(value, 0, 1)
}

export function normalizeHex(input: string): string {
  let hex = input.trim().replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  }
  if (!/^([0-9a-fA-F]{6})$/.test(hex)) {
    return '#f8a8c6'
  }
  return '#' + hex.toLowerCase()
}

export function hexToRgb(hex: string): RgbColor {
  const normalized = normalizeHex(hex).slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(b)
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2
    } else {
      h = (rNorm - gNorm) / delta + 4
    }
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return { h, s, l }
}

function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let rPrime = 0
  let gPrime = 0
  let bPrime = 0

  if (h >= 0 && h < 60) {
    rPrime = c
    gPrime = x
  } else if (h >= 60 && h < 120) {
    rPrime = x
    gPrime = c
  } else if (h >= 120 && h < 180) {
    gPrime = c
    bPrime = x
  } else if (h >= 180 && h < 240) {
    gPrime = x
    bPrime = c
  } else if (h >= 240 && h < 300) {
    rPrime = x
    bPrime = c
  } else {
    rPrime = c
    bPrime = x
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255),
  }
}

function adjustLightness(hex: string, amount: number): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  hsl.l = clamp01(hsl.l + amount)
  return rgbToHex(hslToRgb(hsl))
}

function adjustSaturation(hex: string, amount: number): string {
  const hsl = rgbToHsl(hexToRgb(hex))
  hsl.s = clamp01(hsl.s + amount)
  return rgbToHex(hslToRgb(hsl))
}

export function mixRgb(colorA: RgbColor, colorB: RgbColor, weight: number): RgbColor {
  const ratio = clamp01(weight)
  const inverse = 1 - ratio
  return {
    r: colorA.r * inverse + colorB.r * ratio,
    g: colorA.g * inverse + colorB.g * ratio,
    b: colorA.b * inverse + colorB.b * ratio,
  }
}

export function mixHex(colorA: string, colorB: string, weight: number): string {
  return rgbToHex(mixRgb(hexToRgb(colorA), hexToRgb(colorB), weight))
}

export function rgbaString(rgb: RgbColor, alpha: number): string {
  const clampedAlpha = clamp(alpha, 0, 1)
  const r = Math.round(rgb.r)
  const g = Math.round(rgb.g)
  const b = Math.round(rgb.b)
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + clampedAlpha.toFixed(3) + ')'
}

export function getRelativeLuminance({ r, g, b }: RgbColor): number {
  const srgb = [r, g, b].map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

function createLightThemeTokens(baseHex: string): ThemeTokens['light'] {
  const normalized = normalizeHex(baseHex)
  const baseRgb = hexToRgb(normalized)

  const primaryRgb = mixRgb(baseRgb, WHITE, 0.86)
  const secondaryRgb = mixRgb(baseRgb, WHITE, 0.76)
  const overlayRgb = mixRgb(baseRgb, WHITE, 0.6)
  const overlayStrongRgb = mixRgb(baseRgb, WHITE, 0.5)

  let accentHex = adjustLightness(normalized, 0.08)
  accentHex = adjustSaturation(accentHex, 0.1)

  return {
    bgPrimary: rgbToHex(primaryRgb),
    bgSecondary: rgbToHex(secondaryRgb),
    bgOverlay: rgbaString(overlayRgb, 0.55),
    bgOverlayStrong: rgbaString(overlayStrongRgb, 0.82),
    textPrimary: DEFAULT_LIGHT_TEXT_PRIMARY,
    textSecondary: DEFAULT_LIGHT_TEXT_SECONDARY,
    accent: accentHex,
  }
}

function createDarkThemeTokens(baseHex: string): ThemeTokens['dark'] {
  const normalized = normalizeHex(baseHex)
  const baseRgb = hexToRgb(normalized)

  const primaryRgb = mixRgb(baseRgb, NIGHT, 0.58)
  const secondaryRgb = mixRgb(baseRgb, NIGHT, 0.5)
  const overlayRgb = mixRgb(baseRgb, NIGHT, 0.55)
  const overlayStrongRgb = mixRgb(baseRgb, NIGHT, 0.45)

  let accentHex = adjustLightness(normalized, 0.32)
  accentHex = adjustSaturation(accentHex, 0.08)

  return {
    bgPrimary: rgbToHex(primaryRgb),
    bgSecondary: rgbToHex(secondaryRgb),
    bgOverlay: rgbaString(overlayRgb, 0.6),
    bgOverlayStrong: rgbaString(overlayStrongRgb, 0.78),
    textPrimary: DEFAULT_DARK_TEXT_PRIMARY,
    textSecondary: DEFAULT_DARK_TEXT_SECONDARY,
    accent: accentHex,
  }
}

export function createThemeTokensFromBase(baseHex: string): ThemeTokens {
  const normalized = normalizeHex(baseHex)
  return {
    light: createLightThemeTokens(normalized),
    dark: createDarkThemeTokens(normalized),
  }
}

