---
name: "WYRE Site Setup"
when_to_use: >-
  When the wyre-site-editor plugin is used for the first time on a machine,
  or any site-editing step fails with authentication, permission, or
  missing-repository errors. Use when: set up site editing, first time
  setup, can't access the site repo, gh auth error, or clone missing.
description: >
  Use this skill to prepare a machine for wyre.ai site editing: GitHub
  sign-in, getting the site's content repository onto the machine, and
  verifying access end-to-end. One-time per machine; also the place to
  re-run when access breaks. Written for a non-technical user — keep every
  instruction to "click this, type this".
---

# WYRE Site Setup

One-time setup so the site-editing skills can work. Everything here is
walk-along: do the steps FOR the user where possible, and give click-by-click
guidance where a browser is involved.

## Identity

Angela edits and publishes under her **own GitHub account**
(`angelawyreai`) — she already has write/maintain access to
`wyre-technology/wyre-ai`, so there is no invite to accept. Edits are
attributed to her directly, which the WYRE content pipeline expects.

If someone else is being set up later and doesn't yet have access to the
repo, stop and tell them to ask the WYRE team — do not improvise
credentials. (If WYRE ever issues a managed/bot credential instead of a
personal account for a future user: it gets configured with `gh auth login
--with-token`, and **every publishing gate in WYRE Site Publish still
applies unchanged** — a bot credential never relaxes the
confirm-before-merge rule.)

## Steps

1. **Check what's already working:**
   - `gh auth status` — signed in to github.com?
   - `git --version`, `gh --version` — both installed? (On macOS, `gh` comes
     via `brew install gh` if missing.)
2. **Sign in to GitHub** (if needed): run `gh auth login` → GitHub.com →
   HTTPS → "Login with a web browser", and walk the user through the
   one-time-code browser flow in plain words. If they don't have a GitHub
   account or the repo says "not found", stop and tell them to ask the WYRE
   team for access — do not improvise credentials.
3. **Get the site content onto the machine:**
   `gh repo clone wyre-technology/wyre-ai ~/wyre-ai`
   (If `~/wyre-ai` exists already, just `git -C ~/wyre-ai pull --ff-only` on main.)
4. **Verify access end-to-end** (read + write, without changing anything):
   - Read: `gh repo view wyre-technology/wyre-ai --json viewerPermission`
     — needs `WRITE` or higher for editing; `ADMIN`/`MAINTAIN`/`WRITE` with
     merge rights for publishing.
   - Contract: confirm `~/wyre-ai/docs/decap-content-contract.md` exists and
     skim it — it is the source of truth the editing skills follow.
5. **Tell the user they're ready**, with a one-line tour: "You can now say
   things like 'change the homepage headline to …' — I'll make the change,
   show you a preview link, and only publish when you say so."

## Optional dry run

Offer a zero-risk rehearsal: make a trivial edit request, watch the preview
build, view the URL, then **close it without publishing** — proves the whole
pipeline works before the first real edit. (Closing: `gh pr close <pr> --repo
wyre-technology/wyre-ai --delete-branch`, narrated as "discarding the
practice change".)

## When access breaks later

Re-run steps 1 and 4. Common causes: GitHub session expired (`gh auth login`
again), repo permission changed (ask the WYRE team), clone deleted (step 3).
