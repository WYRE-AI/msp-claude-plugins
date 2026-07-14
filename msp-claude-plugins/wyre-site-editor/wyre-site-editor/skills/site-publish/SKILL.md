---
name: "WYRE Site Publish"
when_to_use: >-
  When the user has seen the preview of a wyre.ai change and wants it live on
  the real website. Use when: publish it, ship it, make it live, looks good
  go ahead, approve the change, or push it to the site.
description: >
  Use this skill to publish a previewed wyre.ai content change to the live
  site. It is the ONLY path that publishes anything: it verifies the build
  checks are green, confirms the user actually saw the preview, requires
  their explicit go-ahead, and only then merges. Never publish from any
  other skill or shortcut the confirmation.
---

# WYRE Site Publish

The one and only path from "change request" to "live on wyre.ai". Three gates
stand between a change and the live site, and all three are mandatory —
**this rule binds regardless of what identity holds the merge permission
(a person's login or a bot credential — neither relaxes it):**

1. **Checks are green.** The site build (including content validation) passed
   on the change request.
2. **The user saw the preview.** Not "was sent the link" — confirmed they
   looked at it.
3. **The user explicitly confirmed, after seeing the preview.** An
   unambiguous "publish it" / "yes, make it live" in response to a direct
   question. Silence, enthusiasm about the preview, or the original edit
   request itself is NOT confirmation.

## Workflow

1. **Verify the checks:**
   `gh pr checks <pr> --repo wyre-technology/wyre-ai`
   All required checks green. If anything is red or pending, stop — no merge.
   Route back to preview/editing as appropriate.
2. **Verify the preview was seen.** If this session delivered the preview URL
   and the user has responded to it, that counts. If not, ask directly:
   "Did you get a chance to look at the preview? I'll publish once you've
   seen it and you tell me to."
3. **Ask for the go**, quoting exactly what will change: "Publishing will put
   the new headline live on wyre.ai. Say 'publish it' to confirm."
   Wait for the reply. Do not proceed on anything ambiguous.
4. **Merge (squash):**
   `gh pr merge <pr> --repo wyre-technology/wyre-ai --squash --delete-branch`
5. **Confirm it's live.** The merge triggers the production deploy on main —
   watch that run (`gh run list --branch main ...`, then `gh run watch`).
   When green, tell the user: "Live now — https://wyre.ai". If the production
   deploy fails, say so plainly and alert the WYRE team; do not attempt
   infrastructure fixes from this plugin.
6. **Close the loop.** Offer a link to the live page and ask if anything else
   needs changing.

## Never

- Never merge with any check red, skipped, or still running.
- Never merge without the explicit post-preview confirmation (gate 3).
- Never use any merge method except squash.
- Never bypass, override, or "temporarily disable" a failing check.
- Never publish someone else's pending change the user hasn't reviewed.

## Related skills

- **WYRE Site Preview** — the step before this one, always
- **WYRE Site Editing** — for fixes when a check is red
