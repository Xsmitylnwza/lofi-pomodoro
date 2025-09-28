export type AudioTrackOrigin = 'preset' | 'upload'

export interface AudioTrack {
  id: string
  title: string
  artist: string
  url: string
  coverUrl?: string
  durationSec?: number
  origin?: AudioTrackOrigin
}

export type AlertWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth'

export interface AlertProfile {
  id: string
  label: string
  waveform: AlertWaveform
  frequencies: number[]
}

export interface AudioSettings {
  playlistId: string
  currentTrackId: string
  isPlaying: boolean
  volume: number
  muted: boolean
  alertProfileId: string
  alertVolume: number
  alertDurationMs: number
  alertRepeats: number
  alertIntervalMs: number
}
