import type { BackgroundPreset } from '@/types'

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'dawn',
    label: 'Dawn Studio',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=40',
    credit: 'Photo by Matt Hoffman on Unsplash',
  },
  {
    id: 'rainy-window',
    label: 'Rainy Window',
    kind: 'video',
    url: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=480&q=60',
    credit: 'Video by Coverr',
  },
  {
    id: 'neon-city',
    label: 'Neon City',
    kind: 'image',
    url: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=320&q=40',
    credit: 'Photo by Pawel Nolbert on Unsplash',
  },
  {
    id: 'moonlit-loft',
    label: 'Moonlit Loft',
    kind: 'video',
    url: 'https://storage.googleapis.com/coverr-main/mp4/Moonlight.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=480&q=60',
    credit: 'Video by Coverr',
  },
]
