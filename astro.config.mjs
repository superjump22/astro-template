import react from '@astrojs/react'
import vue from '@astrojs/vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

export default defineConfig({
  integrations: [react(), vue()],

  vite: {
    plugins: [tailwindcss()],
  },
})
