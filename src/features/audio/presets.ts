import type { AlertProfile, AudioTrack } from '@/types'

const audioModules = import.meta.glob<{ default: string }>(
  '@/assets/audio/**/*.{mp3,ogg,wav}',
  { eager: true },
)

function toTrackId(baseName: string, index: number) {
  const normalized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || `track-${index + 1}`
}

function toTrackTitle(baseName: string, index: number) {
  const cleaned = baseName.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return `Track ${index + 1}`
  }
  return cleaned.replace(/\b([a-z])/g, (match) => match.toUpperCase())
}

function createTrack(path: string, url: string, index: number): AudioTrack {
  const fileName = path.split('/').pop() ?? `track-${index + 1}`
  const baseName = fileName.replace(/\.[^.]+$/, '')
  return {
    id: toTrackId(baseName, index),
    title: toTrackTitle(baseName, index),
    artist: 'Local Collection',
    url,
    origin: 'preset',
  }
}

const discoveredTracks = Object.entries(audioModules)
  .map(([path, module], index) => {
    const url = module?.default
    if (!url) return null
    return createTrack(path, url, index)
  })
  .filter((track): track is AudioTrack => Boolean(track))
  .sort((a, b) => a.title.localeCompare(b.title))

export const LOFI_PLAYLIST: AudioTrack[] = discoveredTracks

export const ALERT_PROFILES: AlertProfile[] = [
  {
    id: 'soft-chime',
    label: 'Soft Chime',
    waveform: 'sine',
    frequencies: [660, 880],
  },
  {
    id: 'warm-bell',
    label: 'Warm Bell',
    waveform: 'triangle',
    frequencies: [523.25, 659.25],
  },
  {
    id: 'digital-beat',
    label: 'Digital Beat',
    waveform: 'square',
    frequencies: [440, 880, 1320],
  },
]
