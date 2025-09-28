import type { AlertProfile, AudioTrack } from '@/types'

interface AudioEngineOptions {
  onTrackEnd?: (track: AudioTrack) => void
  onPlaybackError?: (track: AudioTrack, error?: unknown) => void
}

interface AlertOptions {
  profile: AlertProfile
  volume: number
  durationMs: number
  repeats: number
  intervalMs: number
}

type ExtendedWindow = Window & {
  AudioContext?: typeof AudioContext
  webkitAudioContext?: typeof AudioContext
}

const DEFAULT_ALERT_OPTIONS: AlertOptions = {
  profile: {
    id: 'soft-chime',
    label: 'Soft Chime',
    waveform: 'sine',
    frequencies: [660, 880],
  },
  volume: 0.6,
  durationMs: 1800,
  repeats: 1,
  intervalMs: 600,
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export class AudioEngine {
  private playlist: AudioTrack[] = []
  private audioElement: HTMLAudioElement | null = null
  private currentIndex = 0
  private context: AudioContext | null = null
  private musicGain: GainNode | null = null
  private alertGain: GainNode | null = null
  private musicSource: MediaElementAudioSourceNode | null = null
  private options: AudioEngineOptions
  private muted = false
  private connected = false
  private pendingAlertTimeouts: number[] = []
  private pendingFailureHandled = false

  constructor(playlist: AudioTrack[], options: AudioEngineOptions = {}) {
    this.options = options
    this.playlist = playlist

    if (isBrowser()) {
      this.audioElement = new Audio()
      this.audioElement.crossOrigin = 'anonymous'
      this.audioElement.preload = 'auto'
      this.audioElement.loop = false
      this.audioElement.addEventListener('ended', () => {
        const endedTrack = this.getCurrentTrack()
        if (endedTrack) {
          this.options.onTrackEnd?.(endedTrack)
        }
        void this.next()
      })
      this.audioElement.addEventListener('error', () => {
        const mediaError = this.audioElement?.error
        this.handlePlaybackError(mediaError)
      })
      if (playlist.length > 0) {
        this.loadCurrentTrack()
      }
    }
  }

  private ensureContext() {
    if (!isBrowser()) return
    const win = window as ExtendedWindow
    if (!this.context) {
      if (win.AudioContext) {
        this.context = new win.AudioContext()
      } else if (win.webkitAudioContext) {
        const contextClass = win.webkitAudioContext
        this.context = new contextClass()
      }
    }
    if (!this.musicGain && this.context) {
      this.musicGain = this.context.createGain()
      this.musicGain.gain.value = 0.65
      this.musicGain.connect(this.context.destination)
    }
    if (!this.alertGain && this.context) {
      this.alertGain = this.context.createGain()
      this.alertGain.gain.value = 0.6
      this.alertGain.connect(this.context.destination)
    }
    if (!this.musicSource && this.context && this.audioElement) {
      this.musicSource = this.context.createMediaElementSource(this.audioElement)
      this.musicSource.connect(this.musicGain!)
    }
    this.connected = true
  }

  private loadCurrentTrack() {
    if (!this.audioElement) return
    const current = this.playlist[this.currentIndex]
    if (!current) {
      this.audioElement.pause()
      this.audioElement.removeAttribute('src')
      this.audioElement.load()
      return
    }
    this.audioElement.src = current.url
    this.audioElement.load()
  }

  getCurrentTrack(): AudioTrack | undefined {
    return this.playlist[this.currentIndex]
  }

  getPlaylist(): AudioTrack[] {
    return this.playlist
  }

  setPlaylist(playlist: AudioTrack[], trackId?: string) {
    this.playlist = playlist
    if (trackId) {
      const idx = playlist.findIndex((track) => track.id === trackId)
      this.currentIndex = idx >= 0 ? idx : 0
    } else {
      this.currentIndex = 0
    }
    this.loadCurrentTrack()
  }

  async play() {
    if (!this.audioElement) return
    this.pendingFailureHandled = false
    this.ensureContext()
    if (this.context?.state === 'suspended') {
      await this.context.resume()
    }
    try {
      await this.audioElement.play()
    } catch (error) {
      this.handlePlaybackError(error)
      throw error
    }
  }

  pause() {
    if (!this.audioElement) return
    this.audioElement.pause()
  }

  async toggle() {
    if (!this.audioElement) return
    if (this.audioElement.paused) {
      await this.play()
    } else {
      this.pause()
    }
  }

  async next() {
    if (this.playlist.length === 0) return
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length
    this.loadCurrentTrack()
    await this.play()
  }

  async previous() {
    if (this.playlist.length === 0) return
    this.currentIndex =
      (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
    this.loadCurrentTrack()
    await this.play()
  }

  selectTrack(id: string) {
    const idx = this.playlist.findIndex((track) => track.id === id)
    if (idx >= 0) {
      this.currentIndex = idx
      this.loadCurrentTrack()
    }
  }

  setVolume(volume: number) {
    const clamped = clamp(volume, 0, 1)
    if (this.musicGain) {
      this.musicGain.gain.value = clamped
    }
    if (this.audioElement) {
      this.audioElement.volume = clamped
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : Math.max(this.musicGain.gain.value, 0.01)
    }
    if (this.audioElement) {
      this.audioElement.muted = muted
    }
  }

  isMuted() {
    return this.muted
  }

  seek(seconds: number) {
    if (!this.audioElement) return
    this.audioElement.currentTime = clamp(seconds, 0, this.audioElement.duration || seconds)
  }

  getCurrentTime() {
    if (!this.audioElement) return 0
    return this.audioElement.currentTime || 0
  }

  getDuration() {
    if (!this.audioElement) return 0
    return this.audioElement.duration || 0
  }

  destroy() {
    this.stopAlert()
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement.removeAttribute('src')
      this.audioElement.load()
    }
    this.musicSource?.disconnect()
    this.musicGain?.disconnect()
    this.alertGain?.disconnect()
    this.context?.close()
    this.connected = false
  }

  playAlert(customOptions?: Partial<AlertOptions>) {
    if (!isBrowser()) return
    this.ensureContext()
    if (!this.context || !this.alertGain) return

    const options = { ...DEFAULT_ALERT_OPTIONS, ...customOptions }
    const { repeats, intervalMs } = options

    this.stopAlert()

    for (let i = 0; i < repeats; i += 1) {
      const timeout = window.setTimeout(() => {
        this.emitAlertTone(options)
      }, i * intervalMs)
      this.pendingAlertTimeouts.push(timeout)
    }
  }

  stopAlert() {
    this.pendingAlertTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
    this.pendingAlertTimeouts = []
  }

  private emitAlertTone(options: AlertOptions) {
    if (!this.context || !this.alertGain) return
    const { profile, durationMs, volume } = options
    const envelope = this.context.createGain()
    envelope.connect(this.alertGain)
    envelope.gain.value = volume
    const now = this.context.currentTime
    envelope.gain.setValueAtTime(volume, now)
    envelope.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000)

    profile.frequencies.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator()
      oscillator.type = profile.waveform
      oscillator.frequency.value = frequency
      oscillator.connect(envelope)
      const startTime = now + index * 0.08
      const stopTime = startTime + durationMs / 1000
      oscillator.start(startTime)
      oscillator.stop(stopTime)
      oscillator.onended = () => {
        oscillator.disconnect()
      }
    })

    const cleanupDelay = durationMs + profile.frequencies.length * 80
    window.setTimeout(() => {
      envelope.disconnect()
    }, cleanupDelay)
  }

  hasContext() {
    return this.connected
  }

  private handlePlaybackError(error?: unknown) {
    if (this.pendingFailureHandled) return
    this.pendingFailureHandled = true
    console.warn('Audio playback failed; stopping playback', error)
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    }
    const failedTrack = this.getCurrentTrack()
    if (failedTrack) {
      this.options.onPlaybackError?.(failedTrack, error)
    }
  }
}

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}
