interface Window {
  AstroTheme?: {
    setTheme?: (theme: 'dark' | 'light' | 'system') => void
    getTheme?: () => 'dark' | 'light' | 'system'
    getResolvedTheme?: () => 'dark' | 'light'
  }
}

type AstroThemeChangeEvent = CustomEvent<{
  theme: 'dark' | 'light'
}>
