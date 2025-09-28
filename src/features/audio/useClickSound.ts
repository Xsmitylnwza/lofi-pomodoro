import { useCallback, useEffect, useRef } from "react"
import clickSoundUrl from '@/assets/click-sound/wi-click.mp3'

export function useClickSound(volume = 0.65) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(clickSoundUrl)
    audio.preload = 'auto'
    audio.volume = volume
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [volume])

  return useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {
      /* ignore play interruption */
    })
  }, [])
}
