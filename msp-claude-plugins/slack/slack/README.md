# Slack Plugin

Claude Code plugin for Slack — messages, channels, canvases, files, reactions via Slack's first-party hosted MCP server.

> **Not currently brokered by Conduit.** Conduit has no `slack` vendor, so there is no slug to connect and a connect attempt through `https://conduit.wyre.ai` fails. The connection model below describes how a gateway operator would wire Slack's hosted MCP server; it is not available in Conduit today. This plugin ships no `.mcp.json`, so nothing is silently misrouted.

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
4. Under **OAuth & Permissions** → **User Token Scopes**, enable the scopes your tenants should be able to grant (Slack uses operator-side downscope)
5. Copy your app's `Client ID` and `Client Secret` from **Basic Information** → **App Credentials**
6. Set as `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET` in the WYRE Gateway environment

### Per-tenant authorization

Each tenant authorizes their own Slack workspace through the gateway's OAuth flow using the operator-provisioned app.

## Status

**Scaffold-only.** Marketplace registration + connection wiring; WYRE-authored skill/agent/command content deliberately empty for follow-up.

## See also

- Conduit vendor config: none yet (`slack` is not in Conduit's `VENDORS`)
- Slack MCP docs: https://docs.slack.dev/ai/slack-mcp-server/
- Hosted endpoint: https://mcp.slack.com/mcp
