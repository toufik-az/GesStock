export const ANDROID_ORIGIN = 'https://appassets.androidplatform.net'

export function isAllowedOrigin(origin: string | undefined, configured: string): boolean {
  // Electron file:// renderer and native requests have no web origin.
  if (!origin || origin === 'null' || origin === ANDROID_ORIGIN) return true
  return configured.split(',').map(value => value.trim()).includes(origin)
}
