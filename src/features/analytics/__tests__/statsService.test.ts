import { describe, expect, it } from 'vitest'
import { calculateAnalytics } from '@/features/analytics/statsService'
import type { SessionRecord } from '@/types'

const baseSession: SessionRecord = {
  id: 's-1',
  type: 'work',
  plannedSec: 1500,
  actualSec: 1500,
  startedAt: new Date('2024-01-01T08:00:00Z').toISOString(),
  endedAt: new Date('2024-01-01T08:25:00Z').toISOString(),
}

describe('statsService', () => {
  it('produces sensible aggregates', () => {
    const sessions: SessionRecord[] = [
      baseSession,
      {
        ...baseSession,
        id: 's-2',
        startedAt: new Date('2024-01-02T09:00:00Z').toISOString(),
        endedAt: new Date('2024-01-02T09:25:00Z').toISOString(),
      },
      {
        ...baseSession,
        id: 's-3',
        actualSec: 1200,
        startedAt: new Date('2024-01-02T20:00:00Z').toISOString(),
        endedAt: new Date('2024-01-02T20:20:00Z').toISOString(),
      },
    ]

    const analytics = calculateAnalytics(sessions)

    expect(analytics.totalFocusMinutes).toBeGreaterThanOrEqual(70)
    expect(analytics.daily.labels.length).toBe(14)
    expect(analytics.weekly.labels.length).toBe(8)
    expect(analytics.heatmap.length).toBe(24)
    expect(analytics.completionRate).toBeGreaterThan(0.6)
    expect(Array.isArray(analytics.insights)).toBe(true)
  })
})
