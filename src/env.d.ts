interface Window {
  XivStrat?: {
    setTheme?: (theme: 'dark' | 'light' | 'system') => void
  }
}

type ThemeChangeEvent = CustomEvent<{
  theme: 'dark' | 'light'
}>
