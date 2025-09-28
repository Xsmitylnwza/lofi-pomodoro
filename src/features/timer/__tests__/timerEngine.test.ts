import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TIMER_SETTINGS,
  advanceTimerState,
  clampTimerSettings,
  formatDurationLabel,
  shouldTriggerLongBreak,
} from '@/features/timer/timerEngine'
import type { TimerMachineState } from '@/types'

describe('timerEngine', () => {
  it('rotates phases and schedules long breaks', () => {
    const initial = { ...DEFAULT_TIMER_SETTINGS }
    let state: TimerMachineState = {
      phase: 'work',
      sequence: 1,
      completedWorkSessions: 0,
      plannedSec: initial.workMinutes * 60,
    }

    state = advanceTimerState(state, initial)
    expect(state.phase).toBe('short')
    expect(state.completedWorkSessions).toBe(1)

    state = advanceTimerState(state, initial)
    expect(state.phase).toBe('work')

    state.completedWorkSessions = initial.longBreakInterval - 1
    state.phase = 'work'
    const next = advanceTimerState(state, initial)
    expect(next.phase).toBe('long')
  })

  it('formats durations correctly', () => {
    expect(formatDurationLabel(1500)).toBe('25:00')
    expect(formatDurationLabel(59)).toBe('00:59')
  })

  it('clamps timer settings within limits', () => {
    const clamped = clampTimerSettings({
      workMinutes: 500,
      shortBreakMinutes: 0,
      longBreakMinutes: 1000,
      longBreakInterval: 0,
      dailyRoundTarget: 100,
      autoStartWorkSessions: true,
      autoStartBreaks: false,
    })

    expect(clamped.workMinutes).toBeLessThanOrEqual(180)
    expect(clamped.shortBreakMinutes).toBeGreaterThanOrEqual(1)
    expect(clamped.longBreakInterval).toBeGreaterThanOrEqual(1)
  })

  it('detects long break trigger', () => {
    expect(shouldTriggerLongBreak(4, 4)).toBe(true)
    expect(shouldTriggerLongBreak(3, 4)).toBe(false)
  })
})
