/**
 * Theme options for the application
 */
type Theme = 'dark' | 'light' | 'system'

/**
 * Applies the theme to the document.
 * @param theme - The theme to apply, possible values: 'dark' | 'light' | 'system'
 * @param useViewTransition - Whether to use view transitions, possible values: boolean | undefined
 */
const applyTheme = (theme: Theme, useViewTransition: boolean | undefined = undefined): void => {
  // Resolve the theme to apply
  const resolvedTheme = (() => {
    if (['dark', 'light'].includes(theme)) {
      return theme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })()

  // Determine if view transitions should be used
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  useViewTransition ??= 'startViewTransition' in document && !mediaQuery.matches
  useViewTransition &&= 'startViewTransition' in document && !mediaQuery.matches

  const updateTheme = () => {
    let updated = false
    if (resolvedTheme === 'dark') {
      if (!document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark')
        updated = true
      }
    } else {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark')
        updated = true
      }
    }
    if (updated) {
      document.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { theme: resolvedTheme },
      }) as AstroThemeChangeEvent)
    }
  }

  if (useViewTransition) {
    // Use View Transitions API if available
    document.startViewTransition(() => {
      updateTheme()
    })
  } else {
    // Apply the theme without view transitions
    updateTheme()
  }
}

// Initialize the theme before the page is rendered
const initTheme = () => {
  const localStorageTheme = localStorage.getItem('theme') ?? ''
  const theme = (() => {
    if (['dark', 'light'].includes(localStorageTheme)) {
      return localStorageTheme as Theme
    }
    return 'system' as Theme
  })()

  if (localStorageTheme === '') {
    localStorage.setItem('theme', theme)
  }
  applyTheme(theme, false)
}

// Initialize the theme
initTheme()

// Should only be executed once
if (!window.AstroTheme || !window.AstroTheme.setTheme) {
  if (!window.AstroTheme) {
    window.AstroTheme = {}
  }

  // Register functions for outside use
  window.AstroTheme.setTheme = (theme: Theme) => {
    if (['dark', 'light', 'system'].includes(theme)) {
      localStorage.setItem('theme', theme)
      applyTheme(theme)
    }
  }

  window.AstroTheme.getTheme = () => {
    return localStorage.getItem('theme') as Theme
  }

  window.AstroTheme.getResolvedTheme = () => {
    const localStorageTheme = localStorage.getItem('theme') as Theme
    if (['dark', 'light'].includes(localStorageTheme)) {
      return localStorageTheme as 'dark' | 'light'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Listen for changes to the theme in local storage
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === 'theme') {
      applyTheme(event.newValue as Theme)
    }
  })

  // Listen for changes to the system theme preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('theme') === 'system') {
      applyTheme('system')
    }
  })

  // See https://docs.astro.build/en/guides/view-transitions/#script-re-execution
  // Runs in response to the astro:after-swap event, which happens immediately after the new page has replaced the old page and before the DOM elements are painted to the screen.
  // This avoids a flash of light theme after page navigation by checking and, if necessary, setting the dark mode theme before the new page is rendered
  document.addEventListener('astro:after-swap', initTheme)
}
