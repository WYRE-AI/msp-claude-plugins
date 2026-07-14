# wyre-site-editor

Edit the wyre.ai website by talking. Built for non-technical teammates: you
describe the change, the plugin makes it, shows you a live preview link, and
publishes only when you say so. No git, no CMS login, no code.

## What you can do

- "Change the homepage headline to *AI that ships*"
- "Update the second service card's blurb"
- "Show me a preview" → clickable link to a live draft of the site
- "Publish it" → the change goes live (after you've seen the preview)

## What's editable

Homepage copy (hero + contact) and the five service cards, per the site's
content contract (`docs/decap-content-contract.md` in
[`wyre-technology/wyre-ai`](https://github.com/wyre-technology/wyre-ai)).
Pricing copy/FAQ and features cards are planned next. Pricing **dollar
amounts** are never editable here — they sync from the billing system.

## Safety model

- Every change is validated by the site's build before it can publish — a
  bad edit fails loudly in the draft, never on the live site.
- Nothing publishes without three gates: green checks, you saw the preview,
  and your explicit go-ahead after seeing it. This holds no matter what
  account or credential is in use.
- The plugin can only touch approved content files — schemas, layout, and
  design are off-limits by construction.

## Components

| Piece | Purpose |
|---|---|
| `skills/site-editing` | Turn a plain-language request into a safe content change request |
| `skills/site-preview` | Fetch the live Cloudflare preview URL for a pending change |
| `skills/site-publish` | The only publish path — gates + squash merge + live confirmation |
| `skills/setup` | One-time machine setup (GitHub sign-in, repo clone, access check) |
| `/edit-site`, `/preview-site`, `/publish-site` | Explicit entry points for the three flows |

## Install

```
/plugin install wyre-site-editor@wyre-technology/msp-claude-plugins
```

Then say "set up site editing" for the one-time setup walk-through.

## Requirements

- Claude Code with `git` and `gh` (GitHub CLI)
- GitHub access to `wyre-technology/wyre-ai` (the setup skill checks and
  walks you through sign-in)

No MCP server, no API keys, no local site build — previews are built in the
cloud by the site's own pipeline.
