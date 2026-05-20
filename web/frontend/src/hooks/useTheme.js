import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'bewair-theme'

function readInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch (_) { /* no-op */ }
  // Default to system preference; fall back to light.
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

// Apply the saved theme as early as possible (before React mounts) to avoid flash.
applyTheme(readInitialTheme())

export function useTheme() {
  const [theme, setThemeState] = useState(readInitialTheme)

  const setTheme = useCallback((next) => {
    setThemeState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch (_) { /* no-op */ }
    applyTheme(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  // Keep DOM in sync if state changes from anywhere else
  useEffect(() => { applyTheme(theme) }, [theme])

  return { theme, setTheme, toggle, isDark: theme === 'dark' }
}
