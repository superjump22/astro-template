import antfu from '@antfu/eslint-config'

export default antfu(
  {
    lessOpinionated: true,
    astro: true,
    react: true,
    vue: true,
    stylistic: true,
    typescript: true,
    formatters: true,
    ignores: ['**/.astro/**', '**/public/**', '**/assets/**'],
  },
  {
    rules: {
      'no-console': 'off',
      'style/brace-style': ['error', '1tbs'],
    },
  },
)
