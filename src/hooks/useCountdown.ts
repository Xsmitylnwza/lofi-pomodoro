import { useEffect, useState } from 'react'
import { usePomodoroStore } from '@/store/pomodoroStore'

const FRAME_MS = 250

function getNow() {
  return Date.now()
}

export function useCountdown() {
  const isRunning = usePomodoroStore((state) => state.timerRuntime.isRunning)
  const endTime = usePomodoroStore((state) => state.timerRuntime.endTime)
  const remainingMs = usePomodoroStore((state) => state.timerRuntime.remainingMs)
  const plannedSec = usePomodoroStore((state) => state.timerRuntime.plannedSec)

  const [now, setNow] = useState(() => getNow())

  useEffect(() => {
    if (!isRunning || !endTime) {
      return
    }

    let frameId = 0
    const tick = () => {
      setNow(getNow())
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        frameId = window.requestAnimationFrame(tick)
      } else {
        frameId = window.setTimeout(tick, FRAME_MS)
      }
    }

    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      frameId = window.requestAnimationFrame(tick)
    } else {
      frameId = window.setTimeout(tick, FRAME_MS)
    }

    return () => {
      if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(frameId)
      } else {
        window.clearTimeout(frameId)
      }
    }
  }, [isRunning, endTime])

  const computedRemaining =
    isRunning && endTime ? Math.max(endTime - now, 0) : Math.max(remainingMs, 0)
  const totalMs = Math.max(plannedSec * 1000, 1)
  const progress = 1 - computedRemaining / totalMs

  return { remainingMs: computedRemaining, progress, totalMs }
}
