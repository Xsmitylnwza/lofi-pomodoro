import cn from 'classnames'
import { memo, useMemo } from 'react'
import { BACKGROUND_PRESETS } from '@/features/settings/backgroundPresets'
import { usePomodoroStore } from '@/store/pomodoroStore'

function resolveBackground(
  presetId: string,
  customUrl: string | undefined,
) {
  const normalizedCustom = customUrl?.trim()
  if (normalizedCustom) {
    return {
      id: 'custom',
      label: 'Custom',
      kind: 'image' as const,
      url: normalizedCustom,
      thumbnail: normalizedCustom,
    }
  }

  const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId)
  return preset ?? BACKGROUND_PRESETS[0] ?? null
}

function BackgroundLayerComponent() {
  const presetId = usePomodoroStore((state) => state.ui.backgroundPresetId)
  const customUrl = usePomodoroStore((state) => state.ui.backgroundCustomUrl)
  const blurBackground = usePomodoroStore((state) => state.ui.blurBackground)
  const reduceMotion = usePomodoroStore((state) => state.ui.reduceMotion)

  const background = useMemo(
    () => resolveBackground(presetId, customUrl),
    [presetId, customUrl],
  )

  if (!background) {
    return null
  }

  const isSolid = background.kind === 'solid'
  const commonClass = cn(
    'h-full w-full object-cover transition duration-700 ease-out will-change-transform',
    {
      'blur-xl scale-105': blurBackground && !isSolid,
    },
  )

  const mediaClass = cn(commonClass, 'absolute inset-0 z-0')
  const shouldOverlay = !isSolid

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {background.kind === 'video' && !reduceMotion ? (
        <video
          key={background.id}
          className={mediaClass}
          autoPlay
          loop
          muted
          playsInline
          poster={background.thumbnail}
        >
          <source src={background.url} type="video/mp4" />
        </video>
      ) : background.kind === 'solid' ? (
        <div
          key={background.id}
          className={mediaClass}
          style={{ background: background.color ?? 'var(--bg-primary)' }}
        />
      ) : (
        <img
          key={background.id ?? background.url}
          src={background.url}
          alt=""
          className={mediaClass}
          loading="lazy"
        />
      )}
      {shouldOverlay ? (
        <>
          <div className="absolute inset-0 z-[5]" style={{ background: 'var(--bg-overlay-strong)' }} />
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-[rgba(20,16,30,0.45)] via-[rgba(20,16,30,0.35)] to-[rgba(20,16,30,0.15)]" />
        </>
      ) : null}
    </div>
  )
}

export const BackgroundLayer = memo(BackgroundLayerComponent)
