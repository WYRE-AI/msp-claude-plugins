# MSP Claude Plugins Documentation Site PRD

## Overview

A clean, professional Astro documentation site for the MSP Claude Plugins marketplace. Custom theme (not Starlight) with focus on easy installation and comprehensive plugin documentation.

## Goals

1. **Frictionless Installation** - One-command install via marketplace
2. **Comprehensive Docs** - Every plugin, skill, and command documented
3. **Professional Design** - Clean, minimal, enterprise-ready aesthetic
4. **Fast Performance** - Static site, minimal JS, instant navigation

## Installation UX (Priority #1)

### Hero Section
```
# MSP Claude Plugins

One command to supercharge Claude for MSP workflows.

/plugin marketplace add WYRE-AI/msp-claude-plugins

[Get Started] [Browse Plugins]
```

### Installation Flow
1. **Register the Marketplace**
   ```
   /plugin marketplace add WYRE-AI/msp-claude-plugins
   ```

2. **Install Individual Plugins** (after registering the marketplace)
   ```
   /plugin install syncro@msp-claude-plugins
   ```

3. **Manual (Advanced)**
   Only for contributors/developers who need to modify plugins.

## Site Structure

```
/                           # Landing page with hero, features, quick start
/getting-started/           # Installation, first steps, verification
/plugins/                   # Plugin index (all 9 plugins)
  /autotask/               # Kaseya Autotask
  /datto-rmm/              # Datto RMM
  /it-glue/                # IT Glue
  /syncro/                 # Syncro MSP
  /atera/                  # Atera
  /superops/               # SuperOps.ai
  /halopsa/                # HaloPSA
  /connectwise-psa/        # ConnectWise PSA
  /connectwise-automate/   # ConnectWise Automate
/skills/                   # Shared skills reference
/commands/                 # All slash commands reference
/api-reference/            # API patterns across vendors
/contributing/             # How to contribute
```

## Design System

### Theme: "Professional Minimal"

**Colors:**
- Background: `#fafafa` (light) / `#0a0a0a` (dark)
- Text: `#171717` (light) / `#ededed` (dark)
- Accent: `#2563eb` (blue-600)
- Success: `#16a34a` (green-600)
- Border: `#e5e5e5` (light) / `#262626` (dark)

**Typography:**
- Headings: Inter (system font fallback)
- Body: Inter
- Code: JetBrains Mono / SF Mono

**Components:**
- Clean cards with subtle shadows
- Minimal iconography (Lucide icons)
- Code blocks with syntax highlighting
- Copy-to-clipboard on all code
- Collapsible sections for detailed content

### Layout
- Fixed sidebar navigation (desktop)
- Bottom nav (mobile)
- Table of contents (right side, desktop)
- Search (command palette style, Cmd+K)

## Pages to Generate

### Landing Page (/)
- Hero with install command
- Feature grid (9 plugins, key capabilities)
- Testimonial/use case section
- Quick links to popular plugins

### Plugin Pages (/plugins/{name}/)
Each plugin page includes:
- Overview and capabilities
- Installation (marketplace command)
- Skills table with links
- Commands table with examples
- API reference (auth, rate limits, endpoints)
- Common workflows/recipes

### Skills Pages (/plugins/{name}/skills/{skill}/)
- Full SKILL.md content rendered
- Related skills
- Example prompts

### Commands Pages (/plugins/{name}/commands/{command}/)
- Full command documentation
- Parameters and options
- Example usage
- Common patterns

## Technical Stack

- **Framework:** Astro 4.x
- **Styling:** Tailwind CSS
- **Components:** Custom (no Starlight)
- **Search:** Pagefind (static search)
- **Icons:** Lucide
- **Deployment:** GitHub Pages
- **Content:** MDX from plugin directories

## Content Generation

Auto-generate docs from:
1. Each plugin's `README.md`
2. Each `skills/*/SKILL.md`
3. Each `commands/*.md`
4. Shared `_templates/` for consistency

## Build Process

```bash
# Development
npm run dev

# Build (reads from ../msp-claude-plugins/ for content)
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Success Metrics

1. **Time to First Plugin** - Under 60 seconds from landing to working plugin
2. **Documentation Coverage** - 100% of skills and commands documented
3. **Search Effectiveness** - Users find what they need in <3 searches
4. **Mobile Usability** - Full functionality on mobile devices

## Timeline

1. **Phase 1:** Landing page + installation flow
2. **Phase 2:** Plugin index + individual plugin pages
3. **Phase 3:** Skills and commands deep-dive pages
4. **Phase 4:** Search, dark mode, polish

## References

- [interface-design](https://github.com/Dammyjay93/interface-design) - Installation UX inspiration
- [Astro Docs](https://docs.astro.build/)
- [Tailwind CSS](https://tailwindcss.com/)
