// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ciensite.netlify.app',
  // true is the Astro 6 default: it collapses the whitespace between tags but keeps the spaces
  // that change how text renders. Astro 7's default, 'jsx', applies JSX whitespace rules and drops
  // whitespace and line breaks around elements, which glued inline text to its neighbours
  // in this site's templates.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [mdx(), sitemap()],
});
