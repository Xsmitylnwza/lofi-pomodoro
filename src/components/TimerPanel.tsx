import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useCountdown } from "@/hooks/useCountdown"

const DEFAULT_DURATION_MS = 25 * 60 * 1000
const STORAGE_KEY = "lofi-pomodoro:countdown"
const TITLE_IDLE = "Focus | Lofi Pomo"
const LABEL = "Focus"

export function TimerPanel() {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => (typeof Notification !== "undefined" ? Notification.permission : "default"),
  )
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const notificationSupported = typeof window !== "undefined" && "Notification" in window
  const alarmUrl = useMemo(() => "/alarm.mp3", [])

  useEffect(() => {
    if (typeof Audio !== "undefined") {
      const audio = new Audio(alarmUrl)
      audio.preload = "auto"
      audioRef.current = audio
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [alarmUrl])

  useEffect(() => {
    if (!notificationSupported) {
      return
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((value) => {
        setNotificationPermission(value)
      })
    } else {
      setNotificationPermission(Notification.permission)
    }
  }, [notificationSupported])

  const handleDone = useCallback(() => {
    if (notificationSupported && notificationPermission === "granted") {
      try {
        new Notification("? Pomodoro done!", {
          body: "Time for a short break.",
        })
      } catch (error) {
        console.warn("Unable to show notification", error)
      }
    }

    const audio = audioRef.current
    if (audio) {
      audio.currentTime = 0
      const playPromise = audio.play()
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          setNeedsInteraction(true)
        })
      }
    } else {
      setNeedsInteraction(true)
    }
  }, [notificationPermission, notificationSupported])

  const countdown = useCountdown(DEFAULT_DURATION_MS, {
    storageKey: STORAGE_KEY,
    onDone: handleDone,
    label: LABEL,
    idleTitle: TITLE_IDLE,
  })

  const progressDegrees = countdown.progress * 360
  const progressPercent = Math.round(countdown.progress * 100)

  const handleStart = useCallback(() => {
    if (!countdown.isRunning) {
      countdown.start()
    }
  }, [countdown])

  const handleStop = useCallback(() => {
    countdown.clear()
  }, [countdown])

  const handlePlaySound = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play()
    setNeedsInteraction(false)
  }, [])

  return (
    <section className="rounded-3xl border border-white/30 bg-[var(--bg-secondary)]/80 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pomodoro Timer</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Stay on track – the timer keeps counting even if you switch tabs.
        </p>
      </header>
      <div className="mt-6 flex flex-col items-center gap-6">
        <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-8 border-[var(--accent)]/20 bg-white/50 text-[var(--text-primary)]">
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(var(--accent) ${progressDegrees}deg, rgba(255,255,255,0.2) ${progressDegrees}deg)` }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-3 rounded-full bg-white/80" aria-hidden />
          <span className="relative text-4xl font-semibold tabular-nums">{countdown.formatted}</span>
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-white/40">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-[var(--accent)] px-6 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-card transition hover:bg-[var(--accent)]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {countdown.isRunning ? 'Running…' : 'Start'}
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="rounded-full border border-white/40 px-6 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Stop
          </button>
        </div>
        {notificationSupported && notificationPermission !== 'granted' ? (
          <p className="text-xs text-[var(--text-secondary)]">
            Enable notifications to get alerted when the timer finishes.
          </p>
        ) : null}
        {needsInteraction ? (
          <button
            type="button"
            onClick={handlePlaySound}
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-medium text-[var(--text-primary)]"
          >
            Play alarm sound
          </button>
        ) : null}
      </div>
    </section>
  )
}
