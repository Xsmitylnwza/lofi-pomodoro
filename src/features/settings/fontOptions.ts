import type { FontId } from '@/types'

export interface FontOptionMeta {
  id: FontId
  label: string
}

export const FONT_STACKS: Record<FontId, string> = {
  default: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  pangolin: "'Pangolin', 'Comic Sans MS', 'Comic Sans', cursive",
  'comic-neue': "'Comic Neue', 'Comic Sans MS', 'Comic Sans', cursive",
  'patrick-hand': "'Patrick Hand', 'Comic Sans MS', 'Comic Sans', cursive",
}

export const FONT_OPTION_META: FontOptionMeta[] = [
  { id: 'default', label: 'Inter' },
  { id: 'pangolin', label: 'Pangolin' },
  { id: 'comic-neue', label: 'Comic Neue' },
  { id: 'patrick-hand', label: 'Patrick Hand' },
]
