import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePomodoroStore } from "@/store/pomodoroStore"

export interface UseCountdownOptions {
  tickMs?: number
  storageKey?: string
  onDone?: () => void
  label?: string
  idleTitle?: string
}

export interface UseCountdownResult {
  remaining: number
  remainingSeconds: number
  formatted: string
  isRunning: boolean
  endAt: number | null
  duration: number
  progress: number
  start: (durationMs?: number) => void
  clear: () => void
}

const DEFAULT_STORAGE_KEY = "countdown:endAt"

function formatTime(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(remainingMs, 0) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function readStoredNumber(key: string): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch (error) {
    console.warn("Failed to read countdown storage", error)
    return null
  }
}

function writeStoredNumber(key: string, value: number | null) {
  if (typeof window === "undefined") return
  try {
    if (value == null) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, String(value))
    }
  } catch (error) {
    console.warn("Failed to write countdown storage", error)
  }
}

export function useCountdown(initialMs: number, options?: UseCountdownOptions): UseCountdownResult {
  const tickMs = options?.tickMs ?? 500
  const storageKey = options?.storageKey ?? DEFAULT_STORAGE_KEY
  const onDone = options?.onDone
  const label = options?.label ?? "Focus"
  const idleTitle = options?.idleTitle ?? "Focus | Lofi Pomo"
  const durationKey = `${storageKey}:duration`

  const storedEndAt = useMemo(() => readStoredNumber(storageKey), [storageKey])
  const storedDuration = useMemo(() => readStoredNumber(durationKey), [durationKey])

  const [endAt, setEndAt] = useState<number | null>(() => storedEndAt)
  const [duration, setDuration] = useState<number>(() => storedDuration ?? initialMs)
  const [remaining, setRemaining] = useState<number>(() => {
    if (storedEndAt) {
      return Math.max(storedEndAt - Date.now(), 0)
    }
    return 0
  })
  const [isRunning, setIsRunning] = useState<boolean>(() => Boolean(storedEndAt && storedEndAt > Date.now()))

  const doneRef = useRef(false)
  const originalTitleRef = useRef<string | null>(null)

  const clearStorage = useCallback(() => {
    writeStoredNumber(storageKey, null)
    writeStoredNumber(durationKey, null)
  }, [storageKey, durationKey])

  const computeRemaining = useCallback((target: number | null) => {
    if (!target) return 0
    return Math.max(target - Date.now(), 0)
  }, [])

  const clear = useCallback(() => {
    clearStorage()
    setEndAt(null)
    setRemaining(0)
    setIsRunning(false)
    doneRef.current = false
  }, [clearStorage])

  const start = useCallback(
    (durationMs?: number) => {
      const effectiveDuration = durationMs ?? initialMs
      if (!effectiveDuration || effectiveDuration <= 0) {
        console.warn("useCountdown.start called without a positive duration")
        return
      }
      const target = Date.now() + effectiveDuration
      setDuration(effectiveDuration)
      setEndAt(target)
      setRemaining(Math.max(target - Date.now(), 0))
      setIsRunning(true)
      doneRef.current = false
      writeStoredNumber(storageKey, target)
      writeStoredNumber(durationKey, effectiveDuration)
    },
    [durationKey, initialMs, storageKey],
  )

  useEffect(() => {
    if (typeof document !== "undefined" && originalTitleRef.current === null) {
      originalTitleRef.current = document.title
    }
  }, [])

  useEffect(() => {
    if (!endAt) {
      clearStorage()
      setRemaining(0)
      setIsRunning(false)
      return
    }
    const currentRemaining = computeRemaining(endAt)
    setRemaining(currentRemaining)
    setIsRunning(currentRemaining > 0)
    if (currentRemaining <= 0) {
      clearStorage()
      setEndAt(null)
    }
  }, [endAt, clearStorage, computeRemaining])

  useEffect(() => {
    if (!isRunning || !endAt) {
      return
    }

    let cancelled = false
    let rafId: number | null = null
    let timeoutId: number | null = null

    const clearTimers = () => {
      if (typeof window === "undefined") return
      if (rafId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(rafId)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      rafId = null
      timeoutId = null
    }

    const scheduleNext = () => {
      if (cancelled || typeof window === 'undefined') return
      const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
      if (!hidden && typeof window.requestAnimationFrame === 'function') {
        rafId = window.requestAnimationFrame(() => tick())
      } else {
        timeoutId = window.setTimeout(() => tick(), tickMs)
      }
    }

    const tick = () => {
      if (cancelled) return
      const nextRemaining = computeRemaining(endAt)
      setRemaining(nextRemaining)
      if (nextRemaining <= 0) {
        clearTimers()
        clearStorage()
        setEndAt(null)
        setIsRunning(false)
        setRemaining(0)
        if (!doneRef.current) {
          doneRef.current = true
          onDone?.()
        }
        return
      }
      scheduleNext()
    }

    scheduleNext()

    return () => {
      cancelled = true
      clearTimers()
    }
  }, [isRunning, endAt, tickMs, computeRemaining, clearStorage, onDone])

  useEffect(() => {
    if (typeof document === "undefined") return
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && endAt) {
        setRemaining(computeRemaining(endAt))
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [endAt, computeRemaining])

  const formatted = useMemo(() => formatTime(remaining), [remaining])
  const total = duration > 0 ? duration : initialMs
  const progress = total > 0 ? Math.min(Math.max(1 - remaining / total, 0), 1) : 0

  useEffect(() => {
    if (typeof document === "undefined") return
    const baseTitle = originalTitleRef.current ?? idleTitle
    if (isRunning || remaining > 0) {
      document.title = `${formatted} ? ${label} | Lofi Pomo`
    } else {
      document.title = baseTitle
    }
  }, [formatted, isRunning, remaining, label, idleTitle])

  const remainingSeconds = Math.ceil(Math.max(remaining, 0) / 1000)

  return {
    remaining,
    remainingSeconds,
    formatted,
    isRunning,
    endAt,
    duration: total,
    progress,
    start,
    clear,
  }
}

interface PomodoroCountdownResult {
  remainingMs: number
  progress: number
  totalMs: number
}

const LEGACY_FRAME_MS = 250

export function usePomodoroCountdown(): PomodoroCountdownResult {
  const isRunning = usePomodoroStore((state) => state.timerRuntime.isRunning)
  const endTime = usePomodoroStore((state) => state.timerRuntime.endTime)
  const remainingMsState = usePomodoroStore((state) => state.timerRuntime.remainingMs)
  const plannedSec = usePomodoroStore((state) => state.timerRuntime.plannedSec)

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isRunning || !endTime) {
      return
    }

    let frameId = 0
    const tick = () => {
      setNow(Date.now())
      if (typeof window !== "undefined" && window.requestAnimationFrame) {
        frameId = window.requestAnimationFrame(tick)
      } else {
        frameId = window.setTimeout(tick, LEGACY_FRAME_MS)
      }
    }

    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      frameId = window.requestAnimationFrame(tick)
    } else {
      frameId = window.setTimeout(tick, LEGACY_FRAME_MS)
    }

    return () => {
      if (typeof window !== "undefined" && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(frameId)
      } else if (typeof window !== "undefined") {
        window.clearTimeout(frameId)
      }
    }
  }, [isRunning, endTime])

  const computedRemaining = useMemo(() => {
    if (isRunning && endTime) {
      return Math.max(endTime - now, 0)
    }
    return Math.max(remainingMsState, 0)
  }, [isRunning, endTime, now, remainingMsState])

  const totalMs = useMemo(() => Math.max(plannedSec * 1000, 1), [plannedSec])
  const progress = useMemo(() => Math.min(Math.max(1 - computedRemaining / totalMs, 0), 1), [computedRemaining, totalMs])

  return { remainingMs: computedRemaining, progress, totalMs }
}
