interface Window {
  AstroTheme?: {
    setTheme?: (theme: 'dark' | 'light' | 'system') => void
  }
}

type AstroThemeChangeEvent = CustomEvent<{
  theme: 'dark' | 'light'
}>
