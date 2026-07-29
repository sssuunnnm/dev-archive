// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { remarkBaseLinks } from './src/lib/remark-base-links.mjs';

const base = '/dev-archive/';

// https://astro.build/config
export default defineConfig({
  site: 'https://sssuunnnm.github.io',
  base,
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkBaseLinks(base)],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});