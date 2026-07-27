// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://sssuunnnm.github.io',   // GitHub 사용자명
  base: '/dev-archive',                    // 레포명
  vite: {
    plugins: [tailwindcss()]
  }
});