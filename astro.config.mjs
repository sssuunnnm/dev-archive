// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://sssuunnnm.github.io',
  base: '/dev-archive/',   // 끝에 슬래시(/) 추가 — 이거 하나로 BASE_URL 전체에 슬래시 포함됨
  vite: {
    plugins: [tailwindcss()]
  }
});