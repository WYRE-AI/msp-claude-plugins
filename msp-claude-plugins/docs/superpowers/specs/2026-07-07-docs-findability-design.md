# Docs Findability: Connections, Security & Anchor Links

**Date:** 2026-07-07
**Repo:** `WYRE-AI/msp-claude-plugins` (builds the docs site at https://mcp.wyre.ai from `msp-claude-plugins/docs/`)
**Branch:** `docs/surface-connections-security-anchors`

## Problem

Three findability gaps on the docs site:

1. **Supported connections are hard to find.** The full, auto-generated catalog exists at `/plugins/`, but nothing in the top nav says "Connections." A second, hand-maintained vendor table inside `/getting-started/gateway/` has drifted (19 rows vs. the catalog's 63, and the homepage's "63" counter).
2. **The Security Architecture page is semi-orphaned.** A substantial, well-written page exists at `/getting-started/security/`, but it is reachable only via the desktop docs sidebar — not from the top nav, mobile menu, footer, or homepage.
3. **Anchor links are barely usable.** Every page is `.astro` (raw HTML headings), so Astro's Markdown auto-slug never fires. There is no rehype-autolink, no TOC. `security.astro`, `architecture.astro`, and `plugins/[id].astro` have **zero** heading `id`s — none of their sections can be deep-linked.

## Context / ground truth

- **Framework:** plain Astro 5 + Tailwind. No Starlight, no content collections, no rehype/remark heading plugins. `global.css` already sets `html { scroll-behavior: smooth }`.
- **Top nav** is a `navLinks` array in `docs/src/components/Header.astro`. The mobile slide-out uses a **separate** `sidebarSections` array in the same file (currently omits Security and any Connections entry).
- **Connections catalog** (`/plugins/`) is generated: `docs/scripts/generate-plugins.ts` reads `.claude-plugin/marketplace.json` (63 plugins, each with `name/source/description/version/category/tags`) and writes `docs/src/data/plugins.ts` (`// Auto-generated — do not edit manually`). Homepage and sidebar both consume this array, so counts stay in sync.
- **The gateway table** (`getting-started/gateway.astro`, `<h2 id="supported-vendors">`, ~19 rows of Vendor → tool prefix) is hand-maintained. Its true source of truth is **not** in this repo — the hosted gateway's supported vendors live in `vendor-config.ts` in the separate `mcp-gateway` repo. `marketplace.json` has **no gateway flag and no tool-prefix data**, so this table cannot be regenerated from it.

## Goals

- A "Connections" destination reachable from the primary nav, pointing at the single canonical catalog.
- "Security" reachable from the primary nav, footer, mobile menu, and a homepage trust link.
- Every docs-page section deep-linkable via a stable, copyable anchor — with zero per-page edits and no broken existing links.

## Non-goals (YAGNI)

- No "On this page" / TOC component, no scroll-spy.
- No rehype/remark build plugin (would only help `.md`/`.mdx`, of which there are none).
- No route renames (`/plugins/` stays `/plugins/`; renaming would break existing links + SEO).
- No cross-repo pipeline to export `vendor-config.ts` from `mcp-gateway` into the docs build. A truly authoritative hosted-vendor list would need that; out of scope. The `/plugins/` catalog already gives users the list they need.

## Design

### 1. Discoverability (nav + homepage)

**`docs/src/components/Header.astro`**
- Rename the existing **Plugins** nav entry to **Connections** (same `${baseUrl}plugins/` route — one destination, no duplicate).
- Add a **Security** entry → `${baseUrl}getting-started/security/`.
- Resulting top nav: Home · **Connections** · Pricing · Docs · **Security** · Contact.
- Mirror both changes into `sidebarSections` (mobile) so mobile reaches parity.

> **Naming note:** "Connections" is the user's word and reads better to a hosted-gateway buyer than "Plugins." The route stays `/plugins/` (renaming it would break existing links + SEO). If spec review prefers keeping the literal label "Plugins," that's a one-line change.

**`docs/src/components/Footer.astro`**
- Add **Security** → `/getting-started/security/` to the "Documentation" column.

**`docs/src/pages/index.astro`** (no new sections; two small links)
- In the "Two Paths" Hosted-Gateway column, add **"Read our security model →"** → `/getting-started/security/`.
- In the Plugin Grid section, add **"Browse all connections →"** → `/plugins/`.

### 2. One source of truth for the vendor list

Per the "promote existing catalog" decision, `/plugins/` (auto-generated from `marketplace.json`) is **the** supported-connections list.

- Promote it via nav (§1).
- **Collapse the drifting gateway table.** In `getting-started/gateway.astro`, replace the hand-maintained 19-row table body with: a one-line summary that references the live catalog count and a prominent **"See the full connections catalog →"** link to `/plugins/`. Keep 2–3 tool-prefix examples inline (e.g. `autotask__`, `datto-rmm__`, `m365__`) as illustration, since a prefix is just `<slug>__`. Preserve the `#supported-vendors` anchor.
- This removes the parallel hand-list entirely — nothing left to drift.

### 3. Site-wide anchor links

A single small client-side script in **`docs/src/layouts/DocsLayout.astro`**, running on every docs page:

1. For each `h2, h3, h4` inside `<article class="prose">` **without** an existing `id`, generate a GitHub-style slug (lowercase, non-alphanumerics → `-`, trim). De-duplicate collisions with `-1`, `-2`, …
2. **Never overwrite an existing `id`** — hand-authored anchors (`#supported-vendors`, `#trust-model`, category slugs, etc.) are preserved, so no current link breaks.
3. Inject a hover-revealed `#` affordance per heading; click copies the absolute deep link (`location.origin + location.pathname + '#' + id`) to the clipboard.
4. On load, if `location.hash` targets a now-generated id, scroll it into view (covers paste-into-new-tab). `scroll-behavior: smooth` is already set.
5. Affordance styles go in `docs/src/styles/global.css` next to `.prose`.

Net effect: `security.astro`, `architecture.astro`, `plugins/[id].astro`, and every other docs page become fully deep-linkable, with no per-page edits.

## Files touched

| File | Change |
|------|--------|
| `docs/src/components/Header.astro` | `navLinks` + `sidebarSections`: add Connections + Security |
| `docs/src/components/Footer.astro` | add Security link |
| `docs/src/pages/index.astro` | two CTA links (security model, browse connections) |
| `docs/src/pages/getting-started/gateway.astro` | collapse stale vendor table → catalog link (+ keep `#supported-vendors`) |
| `docs/src/layouts/DocsLayout.astro` | anchor-injection script |
| `docs/src/styles/global.css` | anchor affordance styles |

No generator, data-file, `astro.config`, or dependency changes.

## Verification

- `npm run build` in `docs/` succeeds (prebuild regenerates `plugins.ts`).
- `astro dev`: nav shows Connections + Security on desktop and mobile; footer shows Security; homepage links resolve.
- Load `/getting-started/security/`, confirm every section has a hover `#`, click copies a working deep link, and pasting the link into a fresh tab scrolls to the section.
- Confirm pre-existing anchors (`/getting-started/gateway/#supported-vendors`) still resolve unchanged.

## Risks

- **Clipboard API** needs HTTPS or localhost; fine for mcp.wyre.ai and dev. Fallback: if `navigator.clipboard` is unavailable, the `#` link still updates `location.hash` (native anchor behavior), so deep-linking degrades gracefully.
- **`BASE_PATH`** differs between standalone (`/`) and gateway-embedded (`/docs/`) builds. Anchor links use `location.pathname` (runtime-correct in both); nav links use the existing `baseUrl` helper. No hardcoded absolute paths.
