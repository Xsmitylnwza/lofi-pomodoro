export function createId(prefix = 'session'): string {
  const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined
  if (globalCrypto && 'randomUUID' in globalCrypto) {
    return prefix + '-' + globalCrypto.randomUUID()
  }
  const random = Math.random().toString(16).slice(2)
  const timestamp = Date.now().toString(16)
  return prefix + '-' + timestamp + '-' + random
}
