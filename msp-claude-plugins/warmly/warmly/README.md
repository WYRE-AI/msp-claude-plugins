# Warmly Plugin

Claude Code plugin for [Warmly](https://www.warmly.ai) — visitor intelligence and account-level engagement for B2B sales teams.

> **Not currently brokered by Conduit.** Every other connector in this marketplace reaches its vendor through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`). Warmly does not: Conduit's `src/credentials/vendor-config.ts` has no `warmly` entry, so there is no slug to connect and a connect attempt 404s. The connector is wired only in the older `wyre-technology/mcp-gateway` registry, described below.
>
> This plugin ships no `.mcp.json`, so it wires no client anywhere and nothing is silently misrouted. Its skills and tool reference are accurate about Warmly's API and are why it remains listed — but treat the connection instructions below as describing the legacy system, not the one the rest of this marketplace targets. See `GOVERNANCE.md` for what that means for identity, audit, and revocation.

## Overview

This plugin gives Claude access to Warmly's hosted MCP server, which exposes three read-only tools backed by Warmly's visitor identification platform:

- **Identified site visitors** — pulled together with company and contact profiles, session data, and CRM overlap
- **Account-level rollups** — visitor data aggregated by company with engagement metrics
- **Credit balance** — current month's identification credit remaining

These are most useful inside an MSP/B2B sales workflow: triaging warm accounts before outreach, prioritizing follow-ups by engagement depth, or watching credit burn against pipeline value.

## Prerequisites

### OAuth Setup (BYOC)

Warmly's MCP server delegates authentication to a WorkOS AuthKit tenant. Each customer brings their own OAuth client.

1. Read the Warmly MCP docs: [docs.getwarmly.com/mcp](https://docs.getwarmly.com/mcp)
2. Obtain a `client_id` (and optionally `client_secret`) for your Warmly workspace's AuthKit tenant. AuthKit supports public PKCE clients, so `client_secret` may be empty.
3. Note your `organization_id` if your Warmly account contains multiple organizations; single-org accounts can skip this.

### Environment Variables

```bash
WARMLY_CLIENT_ID=your-client-id
WARMLY_CLIENT_SECRET=            # may be empty for public PKCE clients
WARMLY_ORGANIZATION_ID=          # optional; multi-org accounts only
```

## Connecting via the legacy WYRE MCP Gateway

Warmly is a first-party connector on the older WYRE MCP Gateway (`mcp.wyre.ai`, the `wyre-technology/mcp-gateway` repo) and **only** there — see the note at the top of this file. Connect Warmly in that gateway's UI: it proxies tool calls to `https://opps-api.getwarmly.com/api/mcp`, handles the AuthKit OAuth dance per tenant, and injects `X-Warmly-Organization-Id` automatically when the field is set.

Do not substitute `conduit.wyre.ai` in these steps. Conduit has no `warmly` slug, and a per-vendor path for a slug it does not know 404s while looking correct.

## Skills

| Skill | When it surfaces |
|---|---|
| `api-patterns` | OAuth flow, transport (Streamable HTTP), available tools, rate limits, error handling |
| `visitor-intelligence` | Triaging warm accounts, exporting visitor lists, scoring engagement, credit-burn checks |

## Tool Reference

| Tool | Returns |
|---|---|
| `list_warm_visitors` | Identified visitors with company + contact profiles, session details, and CRM intersection |
| `list_warm_accounts` | Visitor data grouped by company with aggregated engagement metrics |
| `get_credits_remaining` | Monthly credit balance |

All three are read-only and free to call. See `skills/api-patterns/SKILL.md` for full schemas and usage patterns.
