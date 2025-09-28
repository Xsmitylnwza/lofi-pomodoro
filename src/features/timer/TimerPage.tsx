import type { ChangeEvent, CSSProperties } from "react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useCountdown } from "@/hooks/useCountdown"
import { usePomodoroStore } from "@/store/pomodoroStore"
import { advanceTimerState, describePhase, formatDurationLabel } from "@/features/timer/timerEngine"
import type { SessionType } from "@/types"
import { useAudioController } from "@/features/audio/useAudioController"
import { useClickSound } from "@/features/audio/useClickSound"

export default function TimerPage() {
  const { t } = useTranslation('timer')
  const { t: tCommon } = useTranslation('common')

  const timerRuntime = usePomodoroStore((state) => state.timerRuntime)
  const settings = usePomodoroStore((state) => state.settings)
  const timerMachine = usePomodoroStore((state) => state.timerMachine)
  const dailyTracker = usePomodoroStore((state) => state.dailyTracker)
  const sessionHistory = usePomodoroStore((state) => state.sessionHistory)

  const startTimer = usePomodoroStore((state) => state.actions.startTimer)
  const pauseTimer = usePomodoroStore((state) => state.actions.pauseTimer)
  const resumeTimer = usePomodoroStore((state) => state.actions.resumeTimer)
  const resetTimer = usePomodoroStore((state) => state.actions.resetTimer)
  const skipPhase = usePomodoroStore((state) => state.actions.skipPhase)
  const completePhase = usePomodoroStore((state) => state.actions.completePhase)
  const finishTimer = usePomodoroStore((state) => state.actions.finishTimer)
  const updateLabel = usePomodoroStore((state) => state.actions.updateLabel)

  const { play: playMusic, pause: pauseMusic, playAlert } = useAudioController()
  const playClick = useClickSound()

  const { remainingMs, progress } = useCountdown()
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const displayTime = formatDurationLabel(remainingSeconds)
  const progressPercent = Math.min(Math.max(progress * 100, 0), 100)
  const progressAngle = Math.min(Math.max(progressPercent * 3.6, 0), 360)
  const remainingAngle = Math.max(0, 360 - progressAngle)
  const progressCircleStyle = useMemo<CSSProperties>(() => ({
    background: `conic-gradient(var(--accent) ${remainingAngle}deg, rgba(255,255,255,0.12) ${remainingAngle}deg)`,
  }), [remainingAngle])
  const displayPercent = Math.round(progressPercent)
  const phaseName = mapPhase(timerRuntime.phase, t)
  const nextPhaseName = useMemo(() => {
    const nextState = advanceTimerState(timerMachine, settings)
    return mapPhase(nextState.phase, t)
  }, [timerMachine, settings, t])

  const phaseLabel = timerRuntime.label || describePhase(timerRuntime.phase)
  const completionFlag = useRef(false)

  useEffect(() => {
    if (!timerRuntime.isRunning) {
      completionFlag.current = false
      return
    }
    if (!completionFlag.current && remainingMs <= 0) {
      completionFlag.current = true
      finishTimer()
      playAlert()
    }
  }, [timerRuntime.isRunning, remainingMs, finishTimer, playAlert])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (timerRuntime.isRunning) {
      document.title = `${displayTime} • ${phaseName} – ${tCommon('appName')}`
    } else {
      document.title = tCommon('appName')
    }
  }, [displayTime, phaseName, timerRuntime.isRunning, tCommon])

  const handleAdvancePhase = useCallback(() => {
    playClick()
    if (!timerRuntime.isRunning && !timerRuntime.isPaused && timerRuntime.remainingMs === 0) {
      completePhase('finished')
    } else {
      skipPhase()
    }
  }, [playClick, timerRuntime.isPaused, timerRuntime.isRunning, timerRuntime.remainingMs, completePhase, skipPhase])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        if (timerRuntime.isRunning) {
          pauseTimer()
        } else if (timerRuntime.isPaused) {
          resumeTimer()
        } else {
          startTimer()
        }
      }
      if (event.code === 'KeyR') {
        event.preventDefault()
        resetTimer()
      }
      if (event.code === 'KeyS') {
        event.preventDefault()
        handleAdvancePhase()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [timerRuntime.isRunning, timerRuntime.isPaused, startTimer, pauseTimer, resumeTimer, resetTimer, playClick, handleAdvancePhase])

  useEffect(() => {
    if (!timerRuntime.isRunning) {
      pauseMusic()
      return
    }
    if (timerRuntime.phase === 'work') {
      void playMusic()
    } else {
      pauseMusic()
    }
  }, [timerRuntime.isRunning, timerRuntime.phase, playMusic, pauseMusic])

  const handlePrimaryAction = useCallback(() => {
    playClick()
    if (timerRuntime.isRunning) {
      pauseTimer()
      return
    }
    if (timerRuntime.isPaused) {
      resumeTimer()
      return
    }
    startTimer()
  }, [playClick, timerRuntime.isPaused, timerRuntime.isRunning, pauseTimer, resumeTimer, startTimer])

  const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateLabel(event.target.value)
  }

  const roundsDoneToday = dailyTracker.completedWorkSessions
  const plannedRounds = settings.dailyRoundTarget
  const completedSessionsCount = sessionHistory.length

  const finishTimeLabel = useMemo(() => {
    const baseRemaining = timerRuntime.isRunning ? remainingMs : timerRuntime.remainingMs
    if (!baseRemaining || baseRemaining <= 0) {
      return null
    }
    const finishDate = new Date(Date.now() + baseRemaining)
    return finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [remainingMs, timerRuntime.isRunning, timerRuntime.remainingMs])
  const isPhaseComplete = !timerRuntime.isRunning && !timerRuntime.isPaused && timerRuntime.remainingMs === 0
  const advanceLabel = isPhaseComplete ? t('nextPhase') : t('skip')
  const primaryButtonLabel = timerRuntime.isRunning
    ? t('pause')
    : timerRuntime.isPaused
      ? t('resume')
      : t('start')
  const primaryButtonClass = timerRuntime.isRunning
    ? 'min-w-[120px] rounded-full border border-transparent bg-[#ffd27f] px-6 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-card transition hover:translate-y-[1px] hover:shadow-none hover:bg-[#f1c766] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]'
    : 'min-w-[120px] rounded-full border border-transparent bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-card transition hover:translate-y-[1px] hover:shadow-none hover:bg-[var(--accent)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]'

  return (
    <div className="space-y-10 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <section className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/20 bg-[var(--bg-secondary)]/80 p-8 shadow-card backdrop-blur">
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>{t('phaseLabel')}: {phaseName}</span>
              <span>{t('upNext')}: {nextPhaseName}</span>
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full p-4 shadow-inner" style={progressCircleStyle}>
                <div className=" relative flex h-full w-full items-center justify-center rounded-full bg-[var(--bg-primary)] shadow-card">
                  <span className="pointer-events-none absolute top-8 text-sm font-semibold text-[var(--text-secondary)]">{displayPercent}%</span>
                  {finishTimeLabel && (
                    <span className="pointer-events-none absolute -bottom-10 flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
                      <span aria-hidden="true">⏰</span>
                      <span>{finishTimeLabel}</span>
                      <span className="sr-only">{t('finishAt', { time: finishTimeLabel })}</span>
                    </span>
                  )}
                  <p className="text-6xl font-semibold tracking-tight">{displayTime}</p>
                </div>
                <div
                  className="pointer-events-none absolute inset-0 rounded-full border-8 border-[var(--accent)]/15"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.15) inset' }}
                />
              </div>
              <input
                value={phaseLabel}
                onChange={handleLabelChange}
                placeholder={t('labelPlaceholder')}
                className="w-full mt-5 max-w-xs rounded-full border border-white/30 bg-white/60 px-4 py-2 text-center text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                aria-label={t('focusLabel')}
              />
              <div className="relative h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/40 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out"
                  style={{ width: progressPercent + '%' }}
                  aria-hidden
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[var(--text-primary)]">
                  {displayPercent}%
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{t('resumeHint')}</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className={primaryButtonClass}
              >
                {primaryButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick()
                  resetTimer()
                }}
                className="rounded-full border border-[var(--accent)]/70 bg-[var(--accent)]/40 px-6 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--accent)]/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {t('reset')}
              </button>
              <button
                type="button"
                onClick={handleAdvancePhase}
                className="rounded-full border border-transparent bg-black/75 px-6 py-2 text-sm font-medium text-white transition hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {advanceLabel}
              </button>
            </div>
            <div className="mt-8 grid gap-4 rounded-2xl bg-white/30 p-4 text-sm text-[var(--text-secondary)] dark:bg-white/10">
              <StatLine label={t('workDuration')} value={`${settings.workMinutes} ${t('minutesSuffix')}`} />
              <StatLine label={t('shortBreakDuration')} value={`${settings.shortBreakMinutes} ${t('minutesSuffix')}`} />
              <StatLine label={t('longBreakDuration')} value={`${settings.longBreakMinutes} ${t('minutesSuffix')}`} />
              <StatLine label={t('longBreakInterval')} value={`${settings.longBreakInterval} ${t('rounds')}`} />
              <StatLine label={t('roundsTarget')} value={`${roundsDoneToday} / ${plannedRounds}`} emphasis />
              <StatLine label={tCommon('history')} value={completedSessionsCount.toString()} />
              
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}

function mapPhase(phase: SessionType, t: (key: string) => string) {
  if (phase === 'work') return t('focus')
  if (phase === 'short') return t('shortBreak')
  return t('longBreak')
}

interface StatLineProps {
  label: string
  value: string
  emphasis?: boolean
}

function StatLine({ label, value, emphasis }: StatLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={emphasis ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}>{value}</span>
    </div>
  )
}

