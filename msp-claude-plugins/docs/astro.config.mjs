// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Build target: set SITE_URL and BASE_PATH env vars to override.
// Primary (GitHub Pages, see .github/workflows/deploy-docs.yml): defaults below.
// mcp.wyre.ai was retired on 2026-09-30 and now 301s to conduit.wyre.ai,
// which does not serve these pages, so it is no longer a build target.
const site = process.env.SITE_URL || 'https://wyre-ai.github.io';
const base = process.env.BASE_PATH || '/msp-claude-plugins/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [
    tailwind(),
    mdx(),
    sitemap()
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      wrap: true
    }
  }
});
