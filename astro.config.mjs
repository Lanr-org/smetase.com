import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://smetase.com',
  integrations: [sitemap()],
  devToolbar: { enabled: false },
})
