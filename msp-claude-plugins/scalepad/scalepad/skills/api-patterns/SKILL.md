---
name: "ScalePad API Patterns"
description: >
  Use this skill when working with the ScalePad MCP tools — API-key
  authentication via the `X-ScalePad-Api-Key` header, tool discovery
  across the five product domains, cursor pagination, the
  50-requests-per-5-seconds rate limit, and 402 subscription
  errors.
when_to_use: >-
  When working with ScalePad authentication headers, navigation, pagination, rate limits, or 
  error handling for the ScalePad MCP server. Use when: scalepad api, scalepad authentication, 
  scalepad pagination, scalepad mcp, scalepad rate limit, scalepad navigate.
---

# ScalePad MCP Tools & API Patterns

## Overview

The ScalePad MCP server covers five product APIs behind one unified
ScalePad API key: Core (read-only platform data), Lifecycle Manager
(engagement/roadmap CRUD), ControlMap (compliance CRUD), Backup Radar
(read-only backup health), and Quoter (quotes + catalog CRUD).

## Connection & Authentication

The gateway header contract (all credentials travel as HTTP headers,
never as `Authorization: Bearer`):

| Header | Required | Value |
|--------|----------|-------|
| `X-ScalePad-Api-Key` | Yes | ScalePad platform API key (generated in the ScalePad app by an Administrator). One key covers every product; endpoints for unsubscribed products return 402. |
| `X-ScalePad-Region` | No | Data-residency region: `us` (default), `eu`, `ca`, `au`. Selects the regional base URL for ControlMap (us/eu/ca/au) and Backup Radar (us/eu); Core and Lifecycle Manager are US-only. |
| `X-Quoter-Client-Id` | No | Quoter OAuth client ID — only for the standalone api.quoter.com path (Account Owner generates it in Quoter Account > API Keys). ScalePad-only customers leave it blank. |
| `X-Quoter-Client-Secret` | No | Quoter OAuth client secret, paired with the client ID. |

The MCP server translates upstream auth for you: the gateway's
`X-ScalePad-Api-Key` is forwarded to `api.scalepad.com` as the
upstream `x-api-key` header, and for the standalone Quoter path the
server exchanges the client ID/secret for a Bearer `access_token`
(1 hour TTL) via `POST /v1/auth/oauth/authorize` and refreshes it via
`POST /v1/auth/refresh`. You never handle upstream tokens directly.

```bash
export X_SCALEPAD_API_KEY="your-scalepad-api-key"
export X_SCALEPAD_REGION="us"   # optional
```

## Discovery

All tools are exposed upfront — nothing is gated behind navigation.
Two helper tools aid discovery:

- `scalepad_navigate` — list a product domain's tools with
  descriptions (`core`, `lifecycle-manager`, `controlmap`,
  `backup-radar`, `quoter`); a help aid, not a prerequisite
- `scalepad_status` — credential status and available domains

Tool names follow `scalepad_<domain-prefix>_<resource>_<action>`
with prefixes `core`, `lm`, `cm`, `br`, and `quoter`.

## Pagination

List endpoints use cursor pagination: pass `page_size` (1-200, API
default 25) and the opaque `cursor` from the previous response; omit
`cursor` for the first page. Keep following the cursor until the
response no longer returns one before claiming a result set is
complete.

## Rate Limits

All ScalePad API endpoints share one limit: **50 requests per 5
seconds per API key**. Exceeding it returns HTTP 429 with a
`Retry-After` header (seconds). Back off for the indicated time and
retry; batch analysis loops should stay well under the limit.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Missing or invalid API key | Re-check `X_SCALEPAD_API_KEY` |
| 402 | No active subscription for this product | Expected for products the account doesn't license — report it, don't retry |
| 403 | Key valid but not authorized for this resource | Check key scope / administrator role |
| 404 | Unknown record ID | Re-list to confirm the ID |
| 429 | Rate limit exceeded | Honor `Retry-After`, then retry |

## Best Practices

- Call `scalepad_status` first to confirm credentials and see which
  domains are available.
- Treat every `*_delete`, `*_revoke`, and destructive `*_detach` tool
  as irreversible — confirm the target record ID before invoking.
- Core is entirely read-only; prefer it for cross-product lookups
  (client IDs, asset serials) before mutating anything in Lifecycle
  Manager or ControlMap.
- A 402 is a subscription signal, not an auth failure — surface it to
  the user rather than retrying with different credentials.

## Related Skills

- [core](../core/SKILL.md) - unified platform data (read-only)
- [lifecycle-manager](../lifecycle-manager/SKILL.md) - initiatives, goals, meetings, warranties
- [controlmap](../controlmap/SKILL.md) - compliance management
- [backup-radar](../backup-radar/SKILL.md) - backup health
- [quoter](../quoter/SKILL.md) - quote building
