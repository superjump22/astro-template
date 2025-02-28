/**
 * Applies the theme to the document.
 * @param theme - The theme to apply, possible values: 'dark' | 'light' | 'system'
 * @param useViewTransition - Whether to use view transitions, possible values: boolean | undefined
 */
const applyTheme = (theme, useViewTransition = undefined) => {
  // Resolve the theme to apply
  const resolvedTheme = (() => {
    if (['dark', 'light'].includes(theme)) {
      return theme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })()

  // Determine if view transitions should be used
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  useViewTransition ??= document.startViewTransition && !mediaQuery.matches
  useViewTransition &&= document.startViewTransition && !mediaQuery.matches

  if (useViewTransition) {
    // Use View Transitions API if available
    document.startViewTransition(() => {
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    })
  } else {
    // Apply the theme without view transitions
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

// Initialize the theme before the page is rendered
const initTheme = () => {
  const localStorageTheme = localStorage.getItem('theme') ?? ''
  const theme = (() => {
    if (['dark', 'light'].includes(localStorageTheme)) {
      return localStorageTheme
    }
    return 'system'
  })()

  if (localStorageTheme === '') {
    localStorage.setItem('theme', theme)
  }
  applyTheme(theme, false)
}

initTheme()

// Should only be executed once
if (!window.XivStrat || !window.XivStrat.setTheme) {
  if (!window.XivStrat) {
    window.XivStrat = {}
  }

  // Register the setTheme function for outside use
  window.XivStrat.setTheme = (theme) => {
    if (['dark', 'light', 'system'].includes(theme)) {
      localStorage.setItem('theme', theme)
      applyTheme(theme)
    }
  }

  // Listen for changes to the theme in local storage
  window.addEventListener('storage', (event) => {
    if (event.key === 'theme') {
      applyTheme(event.newValue)
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
