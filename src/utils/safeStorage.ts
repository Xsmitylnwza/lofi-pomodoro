import { createJSONStorage } from 'zustand/middleware'
import type { PersistStorage } from 'zustand/middleware'

function getStorage(): Storage {
  if (typeof window === 'undefined') {
    return createMemoryStorage()
  }

  try {
    const testKey = 'lofi-pomodoro::test'
    window.localStorage.setItem(testKey, 'test')
    window.localStorage.removeItem(testKey)
    return window.localStorage
  } catch (error) {
    console.warn('Falling back to in-memory storage:', error)
    return createMemoryStorage()
  }
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    key(index: number) {
      const keys = Array.from(store.keys())
      return keys[index] ?? null
    },
    getItem(name: string) {
      return store.get(name) ?? null
    },
    setItem(name: string, value: string) {
      store.set(name, value)
    },
    removeItem(name: string) {
      store.delete(name)
    },
  } as Storage
}

export function createPersistStorage<T>(): PersistStorage<T> {
  return createJSONStorage<T>(() => getStorage()) as PersistStorage<T>
}
