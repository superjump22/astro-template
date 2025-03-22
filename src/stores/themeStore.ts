import { persistentAtom } from '@nanostores/persistent'
import { atom, computed } from 'nanostores'

type Theme = ResolvedTheme | 'system'
type ResolvedTheme = 'dark' | 'light'

const $prefersColorSchemeDark = atom(window ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)

export const $theme = persistentAtom<Theme>('theme', 'system')

export const $resolvedTheme = computed([$theme, $prefersColorSchemeDark], (theme, prefersColorSchemeDark) => {
  return theme === 'system' ? (prefersColorSchemeDark ? 'dark' : 'light') : theme
})

export function init() {
  // Listen for changes to the system theme preference
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    $prefersColorSchemeDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  // Listen for changes to the resolved theme
  $resolvedTheme.listen((resolvedTheme) => {
    // Determine if view transitions should be used
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const useViewTransition = 'startViewTransition' in document && !mediaQuery.matches

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
  })
}
