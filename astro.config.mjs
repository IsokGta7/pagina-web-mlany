// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ciensite.mx',
  // Astro 7 defaults to 'jsx', which strips whitespace between inline elements.
  // Keep the Astro 6 behaviour so text that relies on that whitespace still renders spaced.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [mdx(), sitemap()],
});
