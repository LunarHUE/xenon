import { isServer } from '@solidjs/web'
import { createSignal } from 'solid-js'

/** What the visitor asked for. `system` follows the OS setting. */
export type ThemePreference = 'light' | 'dark' | 'system'
/** What is actually applied to the document. */
export type ResolvedTheme = 'light' | 'dark'

/**
 * The cookie is the single store. The server reads it to emit `data-theme` on
 * html when rendering on demand; the inline script in Layout.astro reads it
 * before first paint in every mode; this module reads it on load.
 */
const COOKIE = 'theme'
const ONE_YEAR = 60 * 60 * 24 * 365
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readCookie(): ThemePreference {
  const match = document.cookie.match(/(?:^|; )theme=(light|dark|system)(?:;|$)/)
  return (match?.[1] as ThemePreference | undefined) ?? 'system'
}

function writeCookie(value: ThemePreference): void {
  document.cookie = `${COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
}

function systemTheme(): ResolvedTheme {
  return matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference
}

function apply(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved
}

/** On the client the inline script has already resolved the theme; start from its answer. */
function initialResolved(preference: ThemePreference): ResolvedTheme {
  const current = document.documentElement.dataset.theme
  return current === 'light' || current === 'dark' ? current : resolve(preference)
}

const [theme, setPreference] = createSignal<ThemePreference>(isServer ? 'system' : readCookie())
const [resolvedTheme, setResolved] = createSignal<ResolvedTheme>(
  isServer ? 'light' : initialResolved(theme())
)

export { theme, resolvedTheme }

/** Persist a preference, apply it to the document, and update both signals. */
export function setTheme(next: ThemePreference): void {
  setPreference(next)
  if (isServer) return
  writeCookie(next)
  const resolved = resolve(next)
  apply(resolved)
  setResolved(resolved)
}

/** Flip between light and dark from whatever is currently shown. */
export function toggleTheme(): void {
  setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark')
}

if (!isServer) {
  matchMedia(DARK_QUERY).addEventListener('change', () => {
    if (theme() !== 'system') return
    const resolved = systemTheme()
    apply(resolved)
    setResolved(resolved)
  })
}
