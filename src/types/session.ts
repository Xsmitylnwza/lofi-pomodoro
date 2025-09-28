export type SessionType = 'work' | 'short' | 'long'

export interface SessionRecord {
  id: string
  type: SessionType
  plannedSec: number
  actualSec: number
  startedAt: string
  endedAt: string
  label?: string
  notes?: string
}

export interface SessionInsights {
  streakDays: number
  focusMinutesToday: number
  focusMinutesThisWeek: number
  focusMinutesThisMonth: number
  completionRate: number
  bestFocusWindow?: string
  averageSessionMinutes: number
  trendDescription: string
}
