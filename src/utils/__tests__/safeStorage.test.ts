import { describe, expect, it } from 'vitest'
import { createPersistStorage } from '@/utils/safeStorage'

describe('safeStorage', () => {
  it('falls back to memory storage when localStorage is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked')
      },
    })

    const storage = createPersistStorage<{ value: string }>()
    storage.setItem('test', { state: { value: 'ok' }, version: 1 })
    expect(storage.getItem('test')).toEqual({ state: { value: 'ok' }, version: 1 })

    if (descriptor) {
      Object.defineProperty(window, 'localStorage', descriptor)
    }
  })
})
