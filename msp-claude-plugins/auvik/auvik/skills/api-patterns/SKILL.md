---
name: "Auvik API Patterns"
description: >
  Auvik MCP fundamentals: the JSON:API envelope shape, basic-auth
  credential model, region routing, cursor-based pagination, rate-limit
  handling, and the v1 vs v2 device API distinction.
when_to_use: >-
  When working with Auvik authentication, region selection, pagination, rate limits, or
  interpreting the JSON:API response shape. Use when: auvik api, auvik authentication, auvik
  pagination, auvik region, auvik rate limit, auvik v1 v2, or auvik jsonapi.
---

# Auvik MCP Tools and API Patterns

## Overview

The Auvik MCP server wraps the Auvik REST API (`https://auvikapi.{region}.my.auvik.com/v1` and `/v2`) and exposes tools across tenants, devices, networks, interfaces, configurations, alerts, statistics, and billing. Two quirks to know up front: Auvik uses HTTP Basic auth with `username:apiKey` (not a bearer token), and the API base URL is region-pinned - your credentials only work against the cluster your tenant lives in.

## Authentication

Auvik authenticates with HTTP Basic - the username is the Auvik user's email and the password is the API key.

| Field | Value |
|-------|-------|
| Auth scheme | HTTP Basic |
| Username | `AUVIK_USERNAME` (your Auvik login email) |
| Password | `AUVIK_API_KEY` |

The MCP server handles the basic-auth encoding. Set the env vars; do not pre-encode.

## Region Routing

Auvik tenants live in one of several regional clusters:

| Region | Base host |
|--------|-----------|
| `us1` | `auvikapi.us1.my.auvik.com` |
| `us2` | `auvikapi.us2.my.auvik.com` |
| `us3` | `auvikapi.us3.my.auvik.com` |
| `us4` | `auvikapi.us4.my.auvik.com` |
| `eu1` | `auvikapi.eu1.my.auvik.com` |
| `eu2` | `auvikapi.eu2.my.auvik.com` |
| `au1` | `auvikapi.au1.my.auvik.com` |
| `ca1` | `auvikapi.ca1.my.auvik.com` |

Set `AUVIK_REGION` to pin the region. If omitted, the server attempts to detect the region from the credentials. Misroutes typically surface as 404 or redirect loops on calls that should obviously succeed.

## JSON:API Envelope

Auvik returns JSON:API-shaped responses. The tools surface this through to users, so know the shape:

```json
{
  "data": [
    {
      "id": "...",
      "type": "device",
      "attributes": { ... },
      "relationships": { ... }
    }
  ],
  "links": { "next": "...", "prev": "...", "first": "...", "last": "..." },
  "meta": { "totalRecords": 1284, "totalPages": 26 },
  "included": [ ... ]
}
```

Key points:

- The record's real fields live under `attributes`, not the top level.
- Relationships to other entities are referenced under `relationships`, not embedded - use `included` (when present) for sideloads.
- Use `links.next` for the next page rather than constructing the URL yourself.

Singletons (`*_get` style tools) return `data` as an object, not an array.

## Pagination

Auvik uses cursor-style pagination via `links.next`. Pattern:

1. Call the list tool. Read `data` and `links.next`.
2. If `links.next` is non-null, the tool exposes a way to fetch the next page (usually a `page_first` / `page_after` argument that the MCP server populates from the cursor).
3. Continue until `links.next` is null or your accumulated count reaches a sane cap.

Use page sizes of 100-500. Larger pages can time out on big tenants.

`meta.totalRecords` is the authoritative count - prefer it over counting accumulated rows when reporting size.

## Rate Limits

Auvik enforces per-API-key rate limits. Behavior at limit:

- 429 status with a `Retry-After` header.
- The MCP server surfaces this as a tool error. Back off, then retry.
- If you're hitting limits routinely, narrow the query (one tenant at a time, smaller windows) rather than tightening the retry loop.

Statistics endpoints (`auvik_statistics_*`) are noticeably heavier than entity listings - rate-limit pressure usually shows up there first when scanning a large tenant.

## v1 vs v2 Device API

Auvik exposes two generations of device endpoints. The MCP tools split them:

| Tool | API |
|------|-----|
| `auvik_devices_list`, `auvik_devices_get` | v1 - light record, fast |
| `auvik_devices_get_details` | v2 - extended attributes |
| `auvik_devices_get_lifecycle` | v2 - lifecycle fields |
| `auvik_devices_get_warranty` | v2 - warranty fields |

Default to v1 for bulk listings; reach for v2 only when you need the extended fields. Calling v2 tools in a tight loop over a large device set is the single most common cause of rate-limit problems.

## Multi-Tenant Routing

Auvik is multi-tenant by design - a single MSP credential sees every client tenant the MSP manages. Pattern:

1. `auvik_tenants_list` to enumerate visible tenants.
2. Filter and pass the chosen `tenant_id` (or `tenantId`, depending on the tool) on subsequent calls.
3. For fleet-wide reports, fan out across tenants client-side rather than expecting a single call to roll them up.

## Error Handling

| Code | Meaning | Fix |
|------|---------|-----|
| 401 | Bad credentials | Check `AUVIK_USERNAME` + `AUVIK_API_KEY` |
| 403 | Credentials valid, no access to the resource | Wrong tenant, or key lacks scope |
| 404 | Unknown ID, or wrong region | Verify region; verify ID |
| 429 | Rate limit | Back off; narrow the query |
| 500 | Auvik-side hiccup | Retry, then escalate |

## Best Practices

- Always pass `tenant_id` explicitly on per-tenant reports - implicit scoping is a source of cross-tenant data leaks in human-facing output.
- Default to v1 device endpoints; promote to v2 only for the device subset that needs it.
- For statistics queries, prefer short windows (24h) for interactive use and reserve longer windows (7d / 30d) for batch capacity reports.
- Cache `auvik_tenants_list` results within a session - the tenant list rarely changes.

## Related Skills

- [devices](../devices/SKILL.md)
- [alerts](../alerts/SKILL.md)
- [networks](../networks/SKILL.md)
