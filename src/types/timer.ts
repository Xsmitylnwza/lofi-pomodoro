import type { SessionType } from './session'

export type TimerPhase = SessionType

export interface TimerSettings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  dailyRoundTarget: number
  autoStartWorkSessions: boolean
  autoStartBreaks: boolean
}

export interface TimerRuntimeState {
  phase: TimerPhase
  plannedSec: number
  isRunning: boolean
  isPaused: boolean
  sequence: number
  completedWorkSessions: number
  roundsCompletedToday: number
  label?: string
  startTime?: number
  endTime?: number
  remainingMs: number
}

export interface TimerMachineState {
  phase: TimerPhase
  sequence: number
  completedWorkSessions: number
  plannedSec: number
}
