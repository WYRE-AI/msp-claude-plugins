# Slack Plugin

Claude Code plugin for Slack — messages, channels, canvases, files, reactions via Slack's first-party hosted MCP server.

## Overview

This plugin connects to Slack's hosted MCP server at `mcp.slack.com/mcp`, exposing Slack workspace operations to Claude:

- **Search** — messages, channels, files, users
- **Messaging** — send messages to channels/DMs/groups
- **Channels & Conversations** — read history, manage channels, groups, im, mpim
- **Canvases** — read/write canvases
- **Users & Reactions** — user lookup, emoji reactions
- **Files** — read file metadata + content

## Prerequisites

### Connection model — BYOC (operator-provisioned app)

Slack does NOT support RFC 7591 Dynamic Client Registration. Each operator must register their own Slack app:

1. Go to https://api.slack.com/apps and click "Create New App" → "From scratch"
2. Name your app (e.g. "WYRE Gateway — <your org>") and choose a workspace
3. Under **OAuth & Permissions** → **Redirect URLs**, add your gateway's vendor callback:
   `https://<your-gateway>/oauth/vendor/slack/callback`
4. Under **OAuth & Permissions** → **User Token Scopes**, enable the scopes your tenants should be able to grant (Slack uses operator-side downscope — see `src/credentials/vendor-config.ts` `slack:` entry for the full scope list the gateway requests)
5. Copy your app's `Client ID` and `Client Secret` from **Basic Information** → **App Credentials**
6. Set as `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in the WYRE Gateway environment

### Per-tenant authorization

Each tenant authorizes their own Slack workspace through the gateway's OAuth flow using the operator-provisioned app.

## What this plugin provides

WYRE-authored skill / agent / command content (strong first pass, 2026-06-13):

**Skills**
- `messaging` — read channel history, search the workspace with operators, post messages + thread replies.
- `channels-users` — resolve `#name`→id and email/id→user; read membership + metadata (the lookup layer).
- `threads-reactions` — read/reply within threads; reactions as acknowledgement / status signals.

**Agent**
- `slack-workspace-assistant` — workspace-ops persona: resolve-then-act, posting restraint, threaded by default.

**Commands**
- `/channel-digest <channel>` — summarize a channel into decisions / action items / open questions.
- `/find-discussions <query>` — locate where a topic was discussed, with context + permalinks.

The hosted Slack MCP server serves the actual tools through the connection; this content is a guidance/enhancement layer, not a prerequisite for tool access. Tool names referenced are the gateway-prefixed `slack__*` form — confirm exact names against a live `tools/list` once connected. A tool failing with a scope error means that user-token scope wasn't enabled on the operator's Slack app.

**Deferred (follow-up):** a canvases skill + a files skill (the scaffold README lists both surfaces), more commands (e.g. `/post-update`, `/user-lookup`), and exact tool-name verification against the live hosted server (authored without live credentials).

## Conduit relevance

**YES (data layer).** This new plugin content regenerates `docs/src/data/plugins.ts`, and conduit's white-label docs `public/` is built from this Astro source at CI time (per `conduit/docs/white-label.md`). So these plugin pages propagate to conduit's white-label docs — flagged for the conduit digest. (Determined read-only, 2026-06-13.)

## See also

- WYRE MCP Gateway vendor config: `src/credentials/vendor-config.ts` (`slack:` entry)
- Slack MCP docs: https://docs.slack.dev/ai/slack-mcp-server/
- Hosted endpoint: https://mcp.slack.com/mcp
