# MSP Claude Plugins Documentation

Custom Astro documentation site for the MSP Claude Plugins marketplace.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Astro 5.x** - Static site generator
- **Tailwind CSS** - Utility-first CSS
- **Pagefind** - Static search
- **Custom theme** - Professional Minimal design

## Design System

### Colors

| Token | Light | Dark |
|-------|-------|------|
| Background | #fafafa | #0a0a0a |
| Text | #171717 | #ededed |
| Accent | #2563eb | #2563eb |
| Border | #e5e5e5 | #262626 |

### Typography

- **Sans**: Inter (system fallback)
- **Mono**: JetBrains Mono (SF Mono fallback)

## Structure

```
src/
  components/     # Reusable UI components
  data/          # Plugin data and types
  layouts/       # Page layouts
  pages/         # Route pages
  styles/        # Global CSS
public/          # Static assets
```

## Content Generation

Plugin data is defined in `src/data/plugins.ts` and sourced from the plugin README files in the parent directories.

## Deployment

The site is deployed to GitHub Pages at `https://wyre-ai.github.io/msp-claude-plugins/`.

Build output goes to `dist/` directory.
