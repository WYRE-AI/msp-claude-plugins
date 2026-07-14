---
name: "WYRE Site Editing"
when_to_use: >-
  When the user asks to change, update, edit, or rewrite any copy on the
  wyre.ai website — headline, subhead, call-to-action buttons, contact
  section, or service cards. Use when: change the headline, update the
  homepage, edit the site, rewrite the subhead, change a button, update a
  service card, fix a typo on the site, or wyre.ai copy change.
description: >
  Use this skill whenever the user wants to change content on wyre.ai.
  It turns a plain-language request ("change the homepage headline to X")
  into a safe content edit: it updates the right data file, opens a pull
  request following the site's content pipeline convention, and hands off
  to the preview skill. The user never needs to know git, GitHub, or CMS
  concepts — narrate everything in terms of the website itself.
---

# WYRE Site Editing

Turn a conversational request into a safe wyre.ai content change. The site's
content lives in JSON data files in the `wyre-technology/wyre-ai` repo; every
change ships as a pull request that builds a live preview before anything is
published.

**Contract:** `docs/decap-content-contract.md` in the wyre-ai repo is the
authoritative contract for what is editable and how changes flow. If this
skill and that document ever disagree, the contract wins — read it.

## Talk like a website, not like git

The user is non-technical. Say "I've made the change — building your preview
now", never "pushed a commit to the PR branch". Ask what they want in content
terms ("what should the headline say?"), confirm your understanding of the
exact new wording before writing anything, and show before/after text in
chat. Git, branches, and PRs are internal machinery — mention "a change
request" if needed, nothing lower-level.

## What you may edit — and nothing else

| Surface | File |
|---|---|
| Homepage copy (hero + contact) | `src/data/homepage.json` |
| Service cards (5) | `src/data/services.json` |

Planned additions (do NOT edit until the contract marks them LOCKED):
`src/data/pricing.json` (copy + FAQ), `src/data/features.json`.

**Hard limits — never edit, regardless of what is asked:**
- **Pricing dollar values.** They live in a generated file
  (`src/data/pricing-constants.json`) synced from Conduit's billing source of
  truth. If the user asks to change a price, explain that prices are managed
  in the billing system and offer to pass the request to the WYRE team.
- `src/data/*.ts` — these are the schema files. Read them to learn field
  meanings and validation rules; never modify them.
- `public/admin/config.yml`, any `.astro`, `.css`, or layout file, the hero
  SVG diagram, `iconPaths`.
- If a request requires changing structure (new section, new field, layout
  change) rather than copy, it is out of scope: explain kindly and offer to
  file the request with the WYRE team instead.

## Before the first edit of a session

1. Confirm the local clone exists and is healthy (default `~/wyre-ai`). If
   missing or `gh auth status` fails, run the **WYRE Site Setup** skill first.
2. Sync: `git -C ~/wyre-ai fetch origin && git -C ~/wyre-ai checkout main && git -C ~/wyre-ai pull --ff-only`.

## The edit workflow

1. **Understand the change.** Restate it: which page, which text, exact new
   wording. Get a yes before touching anything.
2. **Read the schema first.** Open the sibling `.ts` shim (e.g.
   `src/data/homepage.ts`) and the current JSON. The Zod schema is the
   authority on required fields and shapes. Note quirks — e.g. the homepage
   headline is split into `preAccent` / `accent` / `postAccent` around the
   highlighted word; if the user gives one full headline, propose the split
   and show how it will render (accent = the visually highlighted word).
3. **Make the edit** on a fresh branch from up-to-date `main`:
   - Branch: `content/<page>-<kebab-desc>` (e.g. `content/homepage-hero-headline`)
   - Edit ONLY the agreed field(s) in the one data file. One logical
     change-set per branch/PR — if the user wants homepage AND services
     changes, that is two PRs unless they are one coherent campaign edit.
4. **Sanity-check locally.** Validate the file is well-formed JSON and the
   edited fields still satisfy the schema you read (all strings non-empty;
   `email.address` a valid email; services `tier` is `core` or `advisory`).
   Honesty rule: this is a best-effort check — the authoritative validation
   is the site build on the PR, which fails loudly on any bad edit, so
   nothing malformed can ever publish.
5. **Commit and open the PR** (convention is load-bearing — the pipeline
   consumes it):
   - Commit: conventional, e.g. `content(homepage): update hero headline`
   - Title: `content(<page>): <summary>`
   - Label: `angela-content`
   - Base: `main`. Push the branch, then `gh pr create` with `--head`.
   - PR body: plain-language summary of what changed, old → new.
6. **Hand off to preview.** Tell the user the change is in and the preview
   is building, then follow the **WYRE Site Preview** skill to fetch their
   preview link. Never merge from this skill — publishing has its own skill
   and its own rules.

## If something goes wrong

- **Build fails on the PR:** the edit broke validation. Read the failed
  `Deploy to Cloudflare Pages` run log, find the Zod error, explain it in
  plain language ("the email field needs to be a full address"), fix it on
  the same branch, push again.
- **Merge conflict / stale branch:** re-sync main and recreate the edit on a
  fresh branch; don't rebase-wrangle in front of the user.
- **Anything unexpected** (permissions error, repo moved, contract doc
  changed): stop, explain what you see in one plain sentence, and suggest
  contacting the WYRE team. Never work around a failing guardrail.

## Related skills

- **WYRE Site Preview** — fetch the live preview URL for an open change
- **WYRE Site Publish** — publish a previewed change (the only merge path)
- **WYRE Site Setup** — one-time machine setup
