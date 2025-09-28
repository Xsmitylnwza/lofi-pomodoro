import { useMemo, useState } from "react"
import type { SVGProps } from "react"
import { useTranslation } from "react-i18next"
import { useAudioController } from "@/features/audio/useAudioController"

type IconProps = SVGProps<SVGSVGElement>

function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M4.5 2.5a1 1 0 0 1 1.57-.82l6.5 4.5a1 1 0 0 1 0 1.64l-6.5 4.5A1 1 0 0 1 4.5 11.5V2.5Z" />
    </svg>
  )
}

function PauseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M4 3h2.5v10H4zM9.5 3H12v10H9.5z" />
    </svg>
  )
}

function PrevIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M6.6 8 12 4.5v7L6.6 8ZM4 4h1.8v8H4z" />
    </svg>
  )
}

function NextIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M3.9 4.5 9.3 8l-5.4 3.5v-7ZM10.2 4H12v8h-1.8z" />
    </svg>
  )
}

function VolumeIcon({ muted, ...props }: { muted: boolean } & IconProps) {
  if (muted) {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
        <path d="M2 6h2.5l3-2v8l-3-2H2zm9.6-1.3 1.4 1.4L11.4 8l1.6 1.9-1.4 1.4L10 9.4l-1.6 1.9-1.4-1.4L8.6 8 7 6.1l1.4-1.4L10 6.6l1.6-1.9Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M2 6h2.5l3-2v8l-3-2H2zm8.5-2.5a4 4 0 0 1 0 9v-1.8a2.2 2.2 0 0 0 0-5.4Z" />
    </svg>
  )
}

function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M4.3 4.3l1.4-1.4L8 5.2l2.3-2.3 1.4 1.4L9.4 6.6l2.3 2.3-1.4 1.4L8 8l-2.3 2.3-1.4-1.4L6.6 6.6 4.3 4.3Z" />
    </svg>
  )
}

export function GlobalMusicPlayer() {
  const { t } = useTranslation('audio')
  const {
    playlist,
    currentTrack,
    isPlaying,
    muted,
    volume,
    toggle,
    next,
    previous,
    toggleMute,
    setVolume,
  } = useAudioController()

  const [collapsed, setCollapsed] = useState(false)
  const hasTracks = playlist.length > 0
  const coverUrl = currentTrack?.coverUrl

  const volumePercent = useMemo(() => Math.round(volume * 100), [volume])
  const trackTitle = currentTrack?.title || t('noTracks')

  if (!hasTracks && collapsed) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex w-full max-w-[420px] flex-col items-end gap-2 px-4 sm:px-0">
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="pointer-events-auto rounded-full bg-[var(--bg-secondary)]/90 px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-lg backdrop-blur"
        >
          {t('showPlayer')}
        </button>
      ) : (
        <div className="pointer-events-auto flex w-full items-center gap-3 rounded-full bg-[var(--bg-secondary)]/95 px-4 py-2 text-[var(--text-primary)] shadow-2xl backdrop-blur">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex-shrink-0 rounded-full bg-black/10 p-2 text-[var(--text-primary)] transition hover:bg-black/20"
            aria-label={t('hidePlayer')}
          >
            <CloseIcon className="h-2.5 w-2.5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-black/10">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">??</div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                {t('nowPlaying')}
              </span>
              <span className="truncate text-sm font-semibold leading-tight" title={trackTitle}>
                {trackTitle}
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 text-[var(--text-primary)]">
            <button
              type="button"
              onClick={() => previous()}
              className="rounded-full bg-black/10 p-2 transition hover:bg-black/20"
              aria-label={t('previous')}
              disabled={!hasTracks}
            >
              <PrevIcon className="h-3 w-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => toggle()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--text-primary)] transition hover:bg-[var(--accent)]/80"
              aria-label={isPlaying ? t('pause') : t('play')}
              disabled={!hasTracks}
            >
              {isPlaying ? (
                <PauseIcon className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <PlayIcon className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => next()}
              className="rounded-full bg-black/10 p-2 transition hover:bg-black/20"
              aria-label={t('next')}
              disabled={!hasTracks}
            >
              <NextIcon className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
          <div className="flex w-32 flex-shrink-0 items-center gap-2 pl-2">
            <button
              type="button"
              onClick={() => toggleMute()}
              className="rounded-full bg-black/10 p-2 text-xs transition hover:bg-black/20"
              aria-label={muted ? t('unmute') : t('mute')}
            >
              <VolumeIcon muted={muted} className="h-4 w-4" aria-hidden="true" />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={muted ? 0 : volumePercent}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              className="w-full accent-[var(--accent)]"
              aria-label={t('volume')}
            />
          </div>
        </div>
      )}
    </div>
  )
}
