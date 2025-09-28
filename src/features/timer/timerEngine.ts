import type { SessionType, TimerMachineState, TimerPhase, TimerSettings } from '@/types'

export const TIMER_LIMITS = {
  workMinutes: { min: 1, max: 180 },
  shortBreakMinutes: { min: 1, max: 45 },
  longBreakMinutes: { min: 5, max: 90 },
  longBreakInterval: { min: 1, max: 10 },
  dailyRoundTarget: { min: 1, max: 16 },
} as const

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  dailyRoundTarget: 8,
  autoStartWorkSessions: true,
  autoStartBreaks: false,
}

export function minutesToSeconds(minutes: number): number {
  return Math.max(0, Math.round(minutes * 60))
}

export function secondsToTimeParts(totalSeconds: number) {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return { minutes, seconds }
}

export function formatDurationLabel(totalSeconds: number): string {
  const parts = secondsToTimeParts(totalSeconds)
  const mm = parts.minutes.toString().padStart(2, '0')
  const ss = parts.seconds.toString().padStart(2, '0')
  return mm + ':' + ss
}

export function clampTimerSettings(settings: TimerSettings): TimerSettings {
  return {
    workMinutes: clamp(settings.workMinutes, TIMER_LIMITS.workMinutes.min, TIMER_LIMITS.workMinutes.max),
    shortBreakMinutes: clamp(
      settings.shortBreakMinutes,
      TIMER_LIMITS.shortBreakMinutes.min,
      TIMER_LIMITS.shortBreakMinutes.max,
    ),
    longBreakMinutes: clamp(
      settings.longBreakMinutes,
      TIMER_LIMITS.longBreakMinutes.min,
      TIMER_LIMITS.longBreakMinutes.max,
    ),
    longBreakInterval: clamp(
      settings.longBreakInterval,
      TIMER_LIMITS.longBreakInterval.min,
      TIMER_LIMITS.longBreakInterval.max,
    ),
    dailyRoundTarget: clamp(
      settings.dailyRoundTarget,
      TIMER_LIMITS.dailyRoundTarget.min,
      TIMER_LIMITS.dailyRoundTarget.max,
    ),
    autoStartWorkSessions: settings.autoStartWorkSessions,
    autoStartBreaks: settings.autoStartBreaks,
  }
}

export function getPhaseDurationSec(phase: TimerPhase, settings: TimerSettings): number {
  switch (phase) {
    case 'work':
      return minutesToSeconds(settings.workMinutes)
    case 'short':
      return minutesToSeconds(settings.shortBreakMinutes)
    case 'long':
      return minutesToSeconds(settings.longBreakMinutes)
    default:
      return minutesToSeconds(settings.workMinutes)
  }
}

export function createInitialTimerState(settings: TimerSettings): TimerMachineState {
  return {
    phase: 'work',
    sequence: 1,
    completedWorkSessions: 0,
    plannedSec: getPhaseDurationSec('work', settings),
  }
}

export function advanceTimerState(
  state: TimerMachineState,
  settings: TimerSettings,
): TimerMachineState {
  const nextState: TimerMachineState = { ...state }

  if (state.phase === 'work') {
    const completedWorkSessions = state.completedWorkSessions + 1
    const needsLongBreak = shouldTriggerLongBreak(completedWorkSessions, settings.longBreakInterval)
    nextState.phase = needsLongBreak ? 'long' : 'short'
    nextState.completedWorkSessions = completedWorkSessions
    nextState.plannedSec = getPhaseDurationSec(nextState.phase, settings)
    nextState.sequence = state.sequence + 1
    return nextState
  }

  // break completed -> start next work session
  nextState.phase = 'work'
  nextState.plannedSec = getPhaseDurationSec('work', settings)
  nextState.sequence = state.sequence + 1
  return nextState
}

export function shouldTriggerLongBreak(completedWorkSessions: number, interval: number): boolean {
  if (interval <= 0) {
    return false
  }
  return completedWorkSessions > 0 && completedWorkSessions % interval === 0
}

export function deriveRoundNumber(completedWorkSessions: number): number {
  return completedWorkSessions + 1
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

export function describePhase(phase: SessionType): string {
  switch (phase) {
    case 'work':
      return 'Focus'
    case 'short':
      return 'Short Break'
    case 'long':
      return 'Long Break'
    default:
      return 'Focus'
  }
}
