// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sssuunnnm.github.io',
  base: '/dev-archive/',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});