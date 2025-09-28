import cn from 'classnames'
import { memo, useMemo } from 'react'
import { BACKGROUND_PRESETS } from '@/features/settings/backgroundPresets'
import { usePomodoroStore } from '@/store/pomodoroStore'

function resolveBackground(
  presetId: string,
  customUrl: string | undefined,
) {
  if (customUrl) {
    return {
      id: 'custom',
      label: 'Custom',
      kind: 'image' as const,
      url: customUrl,
      thumbnail: customUrl,
    }
  }
  const preset = BACKGROUND_PRESETS.find((item) => item.id === presetId)
  return preset ?? null
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

  const commonClass = cn(
    'h-full w-full object-cover transition duration-700 ease-out will-change-transform',
    {
      'blur-xl scale-105': blurBackground,
    },
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,16,30,0.45)] via-[rgba(20,16,30,0.35)] to-[rgba(20,16,30,0.15)]" />
      {background.kind === 'video' && !reduceMotion ? (
        <video
          key={background.id}
          className={cn(commonClass, 'absolute inset-0')}
          autoPlay
          loop
          muted
          playsInline
          poster={background.thumbnail}
        >
          <source src={background.url} type="video/mp4" />
        </video>
      ) : (
        <img
          key={background.id ?? background.url}
          src={background.url}
          alt=""
          className={cn(commonClass, 'absolute inset-0')}
          loading="lazy"
        />
      )}
    </div>
  )
}

export const BackgroundLayer = memo(BackgroundLayerComponent)
