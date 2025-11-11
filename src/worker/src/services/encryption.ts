import type { Bindings } from '../config'

const SECRET_KEY = 'APP_SECRET_KEY'

export function encodeSecret(value: string, env: Bindings): string {
  const key = env.APP_SECRET_KEY
  if (!key) {
    return value
  }
  const data = xorStrings(value, key)
  return btoa(data)
}

export function decodeSecret(value: string | undefined, env: Bindings): string | undefined {
  if (!value) {
    return undefined
  }
  const key = env.APP_SECRET_KEY
  if (!key) {
    return value
  }
  const decoded = atob(value)
  return xorStrings(decoded, key)
}

function xorStrings(value: string, key: string): string {
  let result = ''
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(code)
  }
  return result
}
