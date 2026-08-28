# Docs Findability (Connections, Security, Anchor Links) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the supported-connections catalog and the Security Architecture page reachable from the primary navigation, and make every docs-page section deep-linkable via auto-generated copyable heading anchors.

**Architecture:** Six targeted edits to the Astro docs site. Nav/footer/homepage gain links to the existing `/plugins/` catalog and `/getting-started/security/` page. The drifting hand-maintained gateway vendor table collapses into a link to the canonical catalog. A single client-side script in the shared `DocsLayout` slugs every heading and injects a copyable `#` anchor — zero per-page edits, existing IDs preserved.

**Tech Stack:** Astro 5, Tailwind CSS 3.4 (no Starlight, no content collections). No new dependencies.

## Global Constraints

- **Repo/paths:** All files are under `msp-claude-plugins/docs/` in the `WYRE-AI/msp-claude-plugins` repo. Work on branch `docs/surface-connections-security-anchors` (already created off `origin/main`; the spec is already committed on it).
- **No new dependencies**, no `astro.config` changes, no route renames (`/plugins/` stays `/plugins/`).
- **Internal links** use `baseUrl` (`const baseUrl = import.meta.env.BASE_URL`) — never hardcode a leading `/`, because `BASE_PATH` is `/` for the standalone build and `/docs/` for the gateway-embedded build.
- **Runtime deep-links** (the anchor script) use `location.pathname` so they are correct under both base paths.
- **Never overwrite an existing heading `id`.** Hand-authored anchors (`#supported-vendors`, `#trust-model`, category slugs) must keep working.
- **Nav label** for the catalog is **"Connections"** (the route stays `/plugins/`).
- The docs project has **no unit-test harness** (no `test` script in `docs/package.json`); introducing one is out of scope (YAGNI). The automated gate for every task is `npm run build` (run from `docs/`), plus the concrete per-task checks below.

**Working directory for all commands:** `msp-claude-plugins/docs/` (i.e. `cd` into the `docs` folder of the checkout before running `npm` commands).

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `src/components/Header.astro` | Top nav + mobile primary nav (both render the shared `navLinks` array) | 1 |
| `src/components/Footer.astro` | Footer "Documentation" column | 1 |
| `src/pages/index.astro` | Homepage CTAs (security model, browse connections) | 2 |
| `src/pages/getting-started/gateway.astro` | Collapse stale vendor table → catalog link | 3 |
| `src/layouts/DocsLayout.astro` | Client-side heading-anchor script | 4 |
| `src/styles/global.css` | Anchor affordance + `scroll-margin-top` styles | 4 |

---

## Task 1: Surface Connections + Security in nav and footer

**Files:**
- Modify: `src/components/Header.astro:12-18` (the `navLinks` array)
- Modify: `src/components/Footer.astro:24-29` (the "Documentation" `<ul>`)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks depend on.

**Why one task:** Both edits are trivial link changes serving the same goal (global-chrome findability). The mobile menu already renders `navLinks` (Header.astro line 192), so editing `navLinks` updates **both** the desktop top nav and the mobile primary nav — no separate mobile edit is needed.

- [ ] **Step 1: Rename the catalog nav entry and add Security**

In `src/components/Header.astro`, replace the `navLinks` array (currently lines 12–18):

```astro
const navLinks = [
  { href: `${baseUrl}`, label: 'Home' },
  { href: `${baseUrl}plugins/`, label: 'Plugins' },
  { href: `${baseUrl}pricing/`, label: 'Pricing' },
  { href: `${baseUrl}getting-started/`, label: 'Getting Started' },
  { href: 'mailto:hello@wyre.ai', label: 'Contact' },
];
```

with:

```astro
const navLinks = [
  { href: `${baseUrl}`, label: 'Home' },
  { href: `${baseUrl}plugins/`, label: 'Connections' },
  { href: `${baseUrl}pricing/`, label: 'Pricing' },
  { href: `${baseUrl}getting-started/`, label: 'Getting Started' },
  { href: `${baseUrl}getting-started/security/`, label: 'Security' },
  { href: 'mailto:hello@wyre.ai', label: 'Contact' },
];
```

- [ ] **Step 2: Add a Security link to the footer**

In `src/components/Footer.astro`, inside the "Documentation" `<ul>` (currently lines 24–29), add a Security item after the Plugin Catalog line:

```astro
          <li><a href={`${baseUrl}getting-started/`} class="hover:text-[var(--text)]">Getting Started</a></li>
          <li><a href={`${baseUrl}plugins/`} class="hover:text-[var(--text)]">Plugin Catalog</a></li>
          <li><a href={`${baseUrl}getting-started/security/`} class="hover:text-[var(--text)]">Security</a></li>
          <li><a href={`${baseUrl}skills/`} class="hover:text-[var(--text)]">Skills Reference</a></li>
          <li><a href={`${baseUrl}commands/`} class="hover:text-[var(--text)]">Commands Reference</a></li>
```

- [ ] **Step 3: Build**

Run (from `docs/`): `npm run build`
Expected: build completes with no errors (it runs `prebuild` → `generate-plugins` first, then `astro build`, then `pagefind`).

- [ ] **Step 4: Verify the links are server-rendered into the built HTML**

Use plain substring greps (robust to Astro's attribute/whitespace formatting — don't grep for `>Label<`, since the nav renders the label on its own line). Run (from `docs/`):
```bash
grep -c 'getting-started/security/' dist/index.html   # Security link (nav + footer)
grep -c 'Connections' dist/index.html                 # renamed catalog nav label
```
Expected: both counts ≥ 1 (Security href present from the nav and footer; the "Connections" nav label present). The word `Plugins` legitimately still appears elsewhere (mobile "Plugins" section header, body copy) — that's fine; only the primary nav *item* was relabeled.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro
git commit -m "feat(docs): surface Connections + Security in nav and footer"
```

---

## Task 2: Homepage CTAs for security model and connections catalog

**Files:**
- Modify: `src/pages/index.astro:237-240` (Hosted-Gateway column button row) and `src/pages/index.astro:176-188` (Plugin Grid header block)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks depend on.

`baseUrl` and `gatewayUrl` are already defined in this file's frontmatter (lines 14–15). No new imports.

- [ ] **Step 1: Add a "Read our security model" link to the Hosted-Gateway column**

In `src/pages/index.astro`, replace the button row (currently lines 237–240):

```astro
          <div class="flex flex-wrap gap-3">
            <a href={`${gatewayUrl}/auth/choose`} class="btn btn-primary text-sm">Get Started</a>
            <a href={`${baseUrl}getting-started/gateway/`} class="btn btn-secondary text-sm">Learn more about the gateway</a>
          </div>
```

with:

```astro
          <div class="flex flex-wrap gap-3">
            <a href={`${gatewayUrl}/auth/choose`} class="btn btn-primary text-sm">Get Started</a>
            <a href={`${baseUrl}getting-started/gateway/`} class="btn btn-secondary text-sm">Learn more about the gateway</a>
            <a href={`${baseUrl}getting-started/security/`} class="btn btn-secondary text-sm">Read our security model</a>
          </div>
```

- [ ] **Step 2: Add a "Browse all connections" CTA under the Plugin Grid heading**

In `src/pages/index.astro`, replace the Plugin Grid header block (currently lines 177–188):

```astro
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold mb-4">{pluginCount} Plugins, One Ecosystem</h2>
        <p class="text-[var(--muted)] max-w-2xl mx-auto mb-4">
          Comprehensive support for the most popular MSP platforms. Each plugin includes skills,
          commands, and deep API knowledge.
        </p>
        <p class="text-sm text-[var(--muted)] max-w-xl mx-auto">
          Covering {plugins.map((p, i) => (
            <span>{p.name}{i < plugins.length - 1 ? ', ' : '.'}</span>
          ))}
        </p>
      </div>
```

with (adds a CTA button after the "Covering …" list; everything else unchanged):

```astro
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold mb-4">{pluginCount} Plugins, One Ecosystem</h2>
        <p class="text-[var(--muted)] max-w-2xl mx-auto mb-4">
          Comprehensive support for the most popular MSP platforms. Each plugin includes skills,
          commands, and deep API knowledge.
        </p>
        <p class="text-sm text-[var(--muted)] max-w-xl mx-auto mb-6">
          Covering {plugins.map((p, i) => (
            <span>{p.name}{i < plugins.length - 1 ? ', ' : '.'}</span>
          ))}
        </p>
        <a href={`${baseUrl}plugins/`} class="btn btn-primary">Browse all connections →</a>
      </div>
```

- [ ] **Step 3: Build**

Run (from `docs/`): `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Verify both CTAs render**

Run (from `docs/`):
```bash
grep -c 'Read our security model' dist/index.html
grep -c 'Browse all connections' dist/index.html
```
Expected: each prints `1`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(docs): add homepage CTAs for security model and connections catalog"
```

---

## Task 3: Collapse the drifting gateway vendor table into a catalog link

**Files:**
- Modify: `src/pages/getting-started/gateway.astro:71-101` (the `#supported-vendors` section)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks depend on.

**Background:** The current hand-maintained 19-row table drifts from the auto-generated `/plugins/` catalog and cannot be regenerated from `marketplace.json` (no gateway flag, no tool-prefix data there — its true source of truth is `vendor-config.ts` in the separate `mcp-gateway` repo). Collapsing it into a catalog link removes the parallel hand-list entirely. `baseUrl` is already in this file's frontmatter (line 4). The `#supported-vendors` anchor is preserved so existing deep links keep working.

- [ ] **Step 1: Replace the table with a summary + catalog link**

In `src/pages/getting-started/gateway.astro`, replace the whole block from `<h2 id="supported-vendors">` through its closing `</table>` (currently lines 71–101):

```astro
  <h2 id="supported-vendors">Supported Vendors</h2>
  <p>
    All vendors below are available through the unified endpoint at
    <code>https://mcp.wyre.ai/v1/mcp</code>. You only need to connect the vendors
    you use — the gateway automatically discovers which vendors you have credentials for.
  </p>
  <table>
    <thead><tr><th>Vendor</th><th>Tool Prefix</th></tr></thead>
    <tbody>
      <tr><td>Autotask PSA</td><td><code>autotask__</code></td></tr>
      <tr><td>Datto RMM</td><td><code>datto-rmm__</code></td></tr>
      <tr><td>IT Glue</td><td><code>itglue__</code></td></tr>
      <tr><td>Syncro MSP</td><td><code>syncro__</code></td></tr>
      <tr><td>Atera</td><td><code>atera__</code></td></tr>
      <tr><td>SuperOps.ai</td><td><code>superops__</code></td></tr>
      <tr><td>HaloPSA</td><td><code>halopsa__</code></td></tr>
      <tr><td>ConnectWise PSA</td><td><code>connectwise-psa__</code></td></tr>
      <tr><td>ConnectWise Automate</td><td><code>connectwise-automate__</code></td></tr>
      <tr><td>NinjaOne</td><td><code>ninjaone__</code></td></tr>
      <tr><td>Liongard</td><td><code>liongard__</code></td></tr>
      <tr><td>SalesBuildr</td><td><code>salesbuildr__</code></td></tr>
      <tr><td>Pax8</td><td><code>pax8__</code></td></tr>
      <tr><td>SentinelOne</td><td><code>sentinelone__</code></td></tr>
      <tr><td>Huntress</td><td><code>huntress__</code></td></tr>

      <tr><td>RocketCyber</td><td><code>rocketcyber__</code></td></tr>
      <tr><td>Blumira</td><td><code>blumira__</code></td></tr>
      <tr><td>ThreatLocker</td><td><code>threatlocker__</code></td></tr>
      <tr><td>Microsoft 365</td><td><code>m365__</code></td></tr>
    </tbody>
  </table>
```

with:

```astro
  <h2 id="supported-vendors">Supported Connections</h2>
  <p>
    Every connection is available through the unified endpoint at
    <code>https://mcp.wyre.ai/v1/mcp</code>. You only need to connect the vendors
    you use — the gateway automatically discovers which ones you have credentials for.
  </p>
  <p>
    Each vendor's tools are namespaced with a <code>&lt;vendor&gt;__</code> prefix — for
    example <code>autotask__list_tickets</code>, <code>datto-rmm__list_devices</code>, or
    <code>m365__list_users</code>.
  </p>
  <p>
    <a href={`${baseUrl}plugins/`}>See the full connections catalog →</a> for the complete,
    always-current list of supported vendors and the tools each one provides.
  </p>
```

Note: the heading text changes to "Supported **Connections**" for consistency with the nav, but the `id="supported-vendors"` is deliberately unchanged so existing `#supported-vendors` deep links still resolve.

- [ ] **Step 2: Build**

Run (from `docs/`): `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Verify the anchor survives and the catalog link is present**

Run (from `docs/`):
```bash
grep -c 'id="supported-vendors"' dist/getting-started/gateway/index.html
grep -c 'See the full connections catalog' dist/getting-started/gateway/index.html
grep -c '<td><code>autotask__</code></td>' dist/getting-started/gateway/index.html
```
Expected: `1`, `1`, and `0` (the old table row is gone; the `#supported-vendors` anchor and the catalog link are present).

- [ ] **Step 4: Commit**

```bash
git add src/pages/getting-started/gateway.astro
git commit -m "refactor(docs): collapse stale gateway vendor table into catalog link"
```

---

## Task 4: Site-wide auto-generated copyable heading anchors

**Files:**
- Modify: `src/layouts/DocsLayout.astro` (append a `<script>` after the closing `</BaseLayout>`, i.e. after line 29)
- Modify: `src/styles/global.css` (add rules just before the `.prose` layer's closing `}` at line 148)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks depend on.

**Design:** Pages are `.astro`, so Astro's Markdown auto-slug never runs. The script assigns slugs client-side to every `h2/h3/h4` inside `<article class="prose">` that lacks an `id`, seeding a used-set from existing ids so it never collides with or overwrites hand-authored anchors. Because the browser resolves `location.hash` before this script runs, the script re-scrolls to the target after assigning ids. The sticky header is `h-16` (4rem), so headings get `scroll-margin-top` to avoid hiding beneath it.

- [ ] **Step 1: Add the anchor-injection script to `DocsLayout.astro`**

In `src/layouts/DocsLayout.astro`, append this `<script>` block at the very end of the file (after the existing `</BaseLayout>` on line 29):

```astro
<script>
  // Auto-generate stable, copyable anchors for docs headings.
  // Pages are .astro (raw HTML headings), so Astro's Markdown auto-slug never
  // runs — assign ids client-side. Existing hand-authored ids are preserved.
  function slugify(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // drop punctuation
      .replace(/\s+/g, '-')     // spaces -> hyphens
      .replace(/-+/g, '-')      // collapse repeats
      .replace(/^-|-$/g, '');   // trim leading/trailing hyphens
  }

  const article = document.querySelector('article.prose');
  if (article) {
    const used = new Set<string>();
    // Seed with ids that already exist so generated ones never collide.
    article.querySelectorAll('[id]').forEach((el) => used.add(el.id));

    const headings = article.querySelectorAll<HTMLElement>('h2, h3, h4');
    headings.forEach((heading) => {
      // Compute the slug from heading text BEFORE appending the '#' link, so
      // the affordance can never pollute the id.
      let id = heading.id;
      if (!id) {
        const base = slugify(heading.textContent || '');
        if (!base) return; // skip empty / icon-only headings
        id = base;
        let n = 1;
        while (used.has(id)) id = `${base}-${n++}`;
        heading.id = id;
      }
      used.add(id);

      if (heading.querySelector('.heading-anchor')) return; // don't double-inject

      const label = heading.textContent?.trim() ?? '';
      const anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = `#${id}`;
      anchor.setAttribute('aria-label', `Link to this section: ${label}`);
      anchor.textContent = '#';
      anchor.addEventListener('click', () => {
        // Let the browser update the hash + scroll natively (graceful default);
        // additionally copy the full deep link when the clipboard is available.
        const url = `${location.origin}${location.pathname}#${id}`;
        navigator.clipboard?.writeText(url).catch(() => {});
      });
      heading.appendChild(anchor);
    });

    // The browser tried to resolve location.hash before these ids existed —
    // re-scroll now that they do.
    if (location.hash.length > 1) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      target?.scrollIntoView();
    }
  }
</script>
```

- [ ] **Step 2: Add anchor + scroll-margin styles to `global.css`**

In `src/styles/global.css`, insert these rules immediately **before** the closing `}` of the `.prose` layer (currently line 148, right after the `.prose blockquote { ... }` rule):

```css
  .prose :is(h1, h2, h3, h4) {
    scroll-margin-top: 5rem; /* clear the sticky h-16 header when jumping to an anchor */
  }

  .heading-anchor {
    @apply ml-2 text-[var(--muted)] no-underline opacity-0 transition-opacity duration-150;
    cursor: pointer;
  }

  .prose :is(h2, h3, h4):hover .heading-anchor,
  .heading-anchor:focus {
    @apply opacity-100;
  }
```

Rationale for `no-underline`: `.prose a` sets `underline` + accent color; the anchor overrides that to a muted, underline-free `#` that only appears on hover/focus.

- [ ] **Step 3: Build**

Run (from `docs/`): `npm run build`
Expected: build completes with no errors (Astro type-checks and bundles the inline `<script>`; a TS error in the script fails the build).

- [ ] **Step 4: Verify anchor behavior in a browser**

Run (from `docs/`): `npm run preview` (serves the built site, default `http://localhost:4321/`).

Behavioral check (JS must run, so use a browser — the chrome-devtools MCP if available, else do it by hand). Navigate to `http://localhost:4321/getting-started/security/` and run this in the page console / via `evaluate_script`:

```js
(() => {
  const hs = [...document.querySelectorAll('article.prose h2, article.prose h3, article.prose h4')];
  const missingId = hs.filter(h => !h.id).map(h => h.textContent);
  const missingAnchor = hs.filter(h => !h.querySelector('.heading-anchor')).map(h => h.textContent);
  return { total: hs.length, missingId, missingAnchor };
})();
```
Expected: `total` > 0, `missingId` is `[]`, `missingAnchor` is `[]` (every heading got an id and a `#` affordance).

Then verify deep-linking and preserved anchors by hand:
- Hover a heading on `/getting-started/security/` → a `#` appears; click it → the URL gains `#<slug>` and the clipboard holds the absolute URL.
- Open `http://localhost:4321/getting-started/gateway/#supported-vendors` in a fresh tab → it scrolls to "Supported Connections" (pre-existing hand-authored anchor still works, not clobbered).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/DocsLayout.astro src/styles/global.css
git commit -m "feat(docs): auto-generate copyable anchor links for all docs headings"
```

---

## Final verification (after all tasks)

- [ ] From `docs/`, run `npm run build` once more — clean build.
- [ ] `npm run preview`, then spot-check on desktop width: top nav shows **Home · Connections · Pricing · Getting Started · Security · Contact**; footer "Documentation" column shows **Security**; homepage shows both new CTAs; `/getting-started/gateway/` shows the collapsed section with a working catalog link; headings across `/getting-started/security/` and `/getting-started/architecture/` are hover-anchorable.
- [ ] Narrow the viewport (< 1024px) and open the mobile menu — the primary nav list includes **Connections** and **Security** (both come from the shared `navLinks`).
- [ ] Push the branch and open a PR against `msp-claude-plugins` `main` (only when the user asks).

## Notes / out of scope

- No "On this page" TOC/scroll-spy, no rehype/remark plugin, no route renames, no cross-repo pipeline to export `vendor-config.ts` — all deliberately deferred (see spec §Non-goals).
- The mobile menu's detailed **"Plugins"** section header (Header.astro `sidebarSections`) and the `/plugins/` page's own "Plugin Catalog" H1 are left unchanged; only the primary **nav item** is relabeled "Connections". Full terminology unification can be a follow-up if desired.
