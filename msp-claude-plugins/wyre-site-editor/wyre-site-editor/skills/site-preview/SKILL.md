---
name: "WYRE Site Preview"
when_to_use: >-
  When the user wants to see a pending wyre.ai content change before it goes
  live, or an edit was just made and needs its preview link. Use when: show
  me a preview, preview my change, see it before it publishes, is the
  preview ready, preview link, or what does it look like now.
description: >
  Use this skill to get the live preview URL for a pending wyre.ai content
  change. Every change request gets its own temporary preview website built
  automatically; this skill waits for that build, extracts the preview URL,
  and hands the user a clickable link. Also use it to re-check a preview
  after a follow-up tweak.
---

# WYRE Site Preview

Every wyre.ai change request automatically builds a full temporary copy of
the site with the change applied. This skill finds that preview and gives the
user the link. No screenshots, no local browser automation — the preview IS
the real site, served by Cloudflare.

## How previews work (internal)

- Cloudflare Pages project: `wyre-ai-6m3`.
- Every push to a change branch triggers the `Deploy to Cloudflare Pages`
  workflow; a successful run deploys a preview at
  `https://<deploy-hash>.wyre-ai-6m3.pages.dev`.
- The hash URL in the run log is the contract. (Branch-alias URLs exist in
  Cloudflare but are unverified for this project — do not hand those out.)

## Workflow

1. **Find the run** for the change's branch (newest first):
   `gh run list --repo wyre-technology/wyre-ai --branch <branch> --workflow "Deploy to Cloudflare Pages" --limit 1 --json databaseId,status,conclusion`
2. **Wait for it** if still running: `gh run watch <id> --repo wyre-technology/wyre-ai --exit-status`
   (builds typically take 2–4 minutes — tell the user a preview is being
   built and roughly how long it takes; don't go silent).
3. **Extract the preview URL** from the log:
   `gh run view <id> --repo wyre-technology/wyre-ai --log | grep -oE 'https://[a-z0-9]+\.wyre-ai[a-z0-9-]*\.pages\.dev' | head -1`
4. **Deliver it** as a clickable link with a one-line summary of what to look
   at ("your new headline is on the homepage hero — here's the preview:
   <url>"). Remind them: this link is a private draft; nothing is live yet.
5. **Offer the next steps:** "tweak it more" (back to **WYRE Site Editing**,
   same change request) or "publish it" (**WYRE Site Publish** — requires
   their explicit go after they've looked).

## If the build failed

The change broke the site's automatic content validation — this is the
safety net working, not a crisis. Say so in plain language, then follow the
failure path in **WYRE Site Editing** (read the log, explain the field
problem, fix on the same branch, preview again).

## Notes

- Each push builds a NEW preview hash — after a tweak, re-run this workflow
  and hand out the fresh URL; old hash URLs show stale content.
- If no run exists for the branch, the change was never pushed — go back to
  **WYRE Site Editing** and finish the edit workflow.
