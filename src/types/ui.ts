export type ThemeMode = 'light' | 'dark' | 'system'

export type BackgroundKind = 'image' | 'video' | 'solid'

export type FontId = 'default' | 'pangolin' | 'comic-neue' | 'patrick-hand'

export interface ThemeTokenSet {
  bgPrimary: string
  bgSecondary: string
  bgOverlay: string
  bgOverlayStrong: string
  textPrimary: string
  textSecondary: string
  accent: string
}

export interface ThemeTokens {
  light: ThemeTokenSet
  dark: ThemeTokenSet
}

export interface BackgroundPreset {
  id: string
  label: string
  kind: BackgroundKind
  url: string
  thumbnail?: string
  credit?: string
  color?: string
}

export interface UiSettings {
  themeMode: ThemeMode
  reduceMotion: boolean
  backgroundPresetId: string
  backgroundCustomUrl?: string
  blurBackground: boolean
  showSeconds: boolean
  fontId: FontId
  matchBackgroundTheme: boolean
  themeTokens?: ThemeTokens
  language: 'en' | 'th'
}
