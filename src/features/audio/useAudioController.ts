import { useCallback, useEffect, useMemo } from "react"
import { usePomodoroStore } from "@/store/pomodoroStore"
import { AudioEngine } from "@/features/audio/audioEngine"
import { ALERT_PROFILES, LOFI_PLAYLIST } from "@/features/audio/presets"
import type { AlertProfile, AudioTrack } from "@/types"

let sharedEngine: AudioEngine | null = null
let subscriberCount = 0

function ensureEngine(updateAudio: (partial: Record<string, unknown>) => void) {
  if (typeof window === 'undefined') return null
  if (!sharedEngine) {
    sharedEngine = new AudioEngine(LOFI_PLAYLIST, {
      onTrackEnd: (track) => {
        updateAudio({ currentTrackId: track.id })
      },
      onPlaybackError: (track) => {
        updateAudio({ isPlaying: false, currentTrackId: track.id })
      },
    })
  }
  return sharedEngine
}

function releaseEngine() {
  if (subscriberCount <= 0 && sharedEngine) {
    sharedEngine.destroy()
    sharedEngine = null
  }
}

function getProfile(profileId: string): AlertProfile {
  const fallback = ALERT_PROFILES[0]
  const found = ALERT_PROFILES.find((profile) => profile.id === profileId)
  return found || fallback
}

function resolveCurrentTrack(playlist: AudioTrack[], trackId: string) {
  return playlist.find((track) => track.id === trackId) || playlist[0]
}

export function useAudioController() {
  const audioSettings = usePomodoroStore((state) => state.audio)
  const updateAudio = usePomodoroStore((state) => state.actions.updateAudioSettings)

  useEffect(() => {
    const engine = ensureEngine(updateAudio)
    if (!engine) return
    subscriberCount += 1
    return () => {
      subscriberCount -= 1
      releaseEngine()
    }
  }, [updateAudio])

  useEffect(() => {
    const engine = sharedEngine
    if (!engine) return
    engine.setPlaylist(LOFI_PLAYLIST, audioSettings.currentTrackId)
  }, [audioSettings.currentTrackId])

  useEffect(() => {
    const engine = sharedEngine
    if (!engine) return
    engine.setVolume(audioSettings.volume)
  }, [audioSettings.volume])

  useEffect(() => {
    const engine = sharedEngine
    if (!engine) return
    engine.setMuted(audioSettings.muted)
  }, [audioSettings.muted])

  useEffect(() => {
    const engine = sharedEngine
    if (!engine) return
    if (audioSettings.isPlaying) {
      if (LOFI_PLAYLIST.length === 0) {
        updateAudio({ isPlaying: false })
        return
      }
      engine.play().catch(() => {
        updateAudio({ isPlaying: false })
      })
    } else {
      engine.pause()
    }
  }, [audioSettings.isPlaying, updateAudio])

  const playlist = useMemo(() => LOFI_PLAYLIST.slice(), [])

  const currentTrack = useMemo(() => {
    const engine = sharedEngine
    if (engine) {
      const track = engine.getCurrentTrack()
      if (track) {
        return track
      }
    }
    return resolveCurrentTrack(playlist, audioSettings.currentTrackId)
  }, [audioSettings.currentTrackId, playlist])

  const play = useCallback(async () => {
    const engine = ensureEngine(updateAudio)
    if (!engine) return
    if (playlist.length === 0) {
      updateAudio({ isPlaying: false })
      return
    }
    try {
      await engine.play()
      const track = engine.getCurrentTrack()
      if (track) {
        updateAudio({ isPlaying: true, currentTrackId: track.id })
      } else {
        updateAudio({ isPlaying: true })
      }
    } catch (error) {
      console.warn('Unable to begin playback, disabling auto-play', error)
      updateAudio({ isPlaying: false })
    }
  }, [playlist.length, updateAudio])

  const pause = useCallback(() => {
    const engine = sharedEngine
    if (!engine) return
    engine.pause()
    updateAudio({ isPlaying: false })
  }, [updateAudio])

  const toggle = useCallback(() => {
    if (audioSettings.isPlaying) {
      pause()
    } else {
      void play()
    }
  }, [audioSettings.isPlaying, play, pause])

  const next = useCallback(async () => {
    const engine = sharedEngine
    if (!engine) return
    if (playlist.length === 0) return
    try {
      await engine.next()
      const track = engine.getCurrentTrack()
      if (track) {
        updateAudio({ isPlaying: true, currentTrackId: track.id })
      }
    } catch (error) {
      console.warn('Failed to advance to next track', error)
      updateAudio({ isPlaying: false })
    }
  }, [playlist.length, updateAudio])

  const previous = useCallback(async () => {
    const engine = sharedEngine
    if (!engine) return
    if (playlist.length === 0) return
    try {
      await engine.previous()
      const track = engine.getCurrentTrack()
      if (track) {
        updateAudio({ isPlaying: true, currentTrackId: track.id })
      }
    } catch (error) {
      console.warn('Failed to go back to previous track', error)
      updateAudio({ isPlaying: false })
    }
  }, [playlist.length, updateAudio])

  const selectTrack = useCallback(
    async (trackId: string) => {
      const engine = sharedEngine
      if (!engine) return
      engine.selectTrack(trackId)
      if (audioSettings.isPlaying) {
        try {
          await engine.play()
        } catch (error) {
          console.warn('Unable to play selected track', error)
          updateAudio({ isPlaying: false })
        }
      }
      updateAudio({ currentTrackId: trackId })
    },
    [audioSettings.isPlaying, updateAudio],
  )

  const setVolume = useCallback(
    (value: number) => {
      const engine = sharedEngine
      if (!engine) return
      const clamped = Math.min(Math.max(value, 0), 1)
      engine.setVolume(clamped)
      updateAudio({ volume: clamped, muted: clamped <= 0 })
    },
    [audioSettings.muted, updateAudio],
  )

  const toggleMute = useCallback(() => {
    const engine = sharedEngine
    if (!engine) return
    const nextMuted = !audioSettings.muted
    engine.setMuted(nextMuted)
    updateAudio({ muted: nextMuted })
  }, [audioSettings.muted, updateAudio])

  const seekTo = useCallback((seconds: number) => {
    const engine = sharedEngine
    if (!engine) return
    engine.seek(seconds)
  }, [])

  const getCurrentTime = useCallback(() => {
    const engine = sharedEngine
    if (!engine) return 0
    return engine.getCurrentTime()
  }, [])

  const getDuration = useCallback(() => {
    const engine = sharedEngine
    if (!engine) return 0
    return engine.getDuration()
  }, [])

  const playAlert = useCallback(() => {
    const engine = sharedEngine
    if (!engine) return
    const profile = getProfile(audioSettings.alertProfileId)
    engine.playAlert({
      profile,
      volume: audioSettings.alertVolume,
      durationMs: audioSettings.alertDurationMs,
      repeats: audioSettings.alertRepeats,
      intervalMs: audioSettings.alertIntervalMs,
    })
  }, [audioSettings])

  return {
    playlist,
    currentTrack,
    isPlaying: audioSettings.isPlaying,
    volume: audioSettings.volume,
    muted: audioSettings.muted,
    play,
    pause,
    toggle,
    next,
    previous,
    selectTrack,
    setVolume,
    toggleMute,
    seekTo,
    getCurrentTime,
    getDuration,
    playAlert,
  }
}
