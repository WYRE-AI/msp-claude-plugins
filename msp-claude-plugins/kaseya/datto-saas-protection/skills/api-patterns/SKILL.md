---
name: "Datto SaaS Protection API Patterns"
description: >
  Datto SaaS Protection (formerly Backupify) REST API fundamentals: regional
  base URLs, bearer-token auth, the seat/tenant object model, backup status
  queries, and restore operations.
when_to_use: >-
  When working with the Datto SaaS Protection (Backupify) REST API. Use when: datto saas
  protection, backupify, saas backup, m365 backup, google workspace backup, or saas protection
  api.
---

# Datto SaaS Protection API Patterns

## Status note

The MCP server (`datto-saas-protection-mcp`) and SDK (`@wyre-technology/node-datto-saas-protection`) are in development.

## Overview

Datto SaaS Protection (rebranded Backupify, now also folded together with Spanning under the same product family) provides cloud-to-cloud backup for Microsoft 365 and Google Workspace tenants.

Reference: <https://saasprotection.datto.com/help/M365/Content/Other_Administrative_Tasks/using-rest-api-saas-protection.htm>

Base URLs (per region):

```
https://api.datto.com/api/v1            (US)
https://api.eu.datto.com/api/v1         (EU)
```

The MCP server takes a `region` credential field (`us` or `eu`); never hard-code.

## Authentication

API key issued from the SaaS Protection partner portal:

1. SaaS Protection portal → Settings → API → Create Key
2. Optional: scope key to specific clients
3. Send on every request:

```
Authorization: Bearer <api_key>
```

Keys are long-lived; rotate from the same UI.

## Object model

```
Partner
 └── Client (a customer organization)
      └── Domain (M365 tenant / Google domain)
           └── Seat (mailbox / OneDrive / SharePoint site / Google user)
                └── Backup runs / restore points
```

## Common endpoints

| Domain | Endpoint | Notes |
|--------|----------|-------|
| Clients | `GET /clients` | All client orgs |
| Domains | `GET /clients/{clientId}/domains` | M365/Google tenants |
| Seats | `GET /clients/{clientId}/domains/{domainId}/seats` | Active + archived |
| Single seat | `GET /seats/{seatId}` | |
| Backup status | `GET /seats/{seatId}/backups` | Most recent backup runs |
| Activity log | `GET /clients/{clientId}/activity` | Org-level events |
| Restore (request) | `POST /seats/{seatId}/restores` | Queue restore |
| Restore status | `GET /restores/{restoreId}` | |
| License usage | `GET /clients/{clientId}/usage` | Seat counts |

## Pagination

Cursor-based:

```
GET /clients?limit=100
→ { items: [...], nextCursor: "abc123" }

GET /clients?limit=100&cursor=abc123
```

Default `limit` is 50, max is 250. Stop when `nextCursor` is missing or null.

## Restore operations

Restores are async. The flow:

```
1. POST /seats/{seatId}/restores   → { restoreId, status: "queued" }
2. Poll GET /restores/{restoreId}  → status transitions queued → running → completed | failed
3. On completed, fetch the result location (URL or destination metadata)
```

Typical restore wall-clock: minutes to hours depending on data volume. Poll at 30-second intervals; do not poll faster.

## Rate limits

**60 req/min per API key** under default policy. HTTP 429 includes `Retry-After`. Aggregate operations (list all seats across all clients) should use `Promise.all` with concurrency capped at 4.

## Error handling

| HTTP | Meaning | Action |
|------|---------|--------|
| 200 | OK | |
| 400 | Bad request | Validate inputs |
| 401 | Bad / expired key | Rotate key |
| 403 | Key lacks scope on this client | Verify scope |
| 404 | Unknown seatId / clientId / domainId | |
| 409 | Restore already queued for this seat | Surface; offer to cancel-and-retry |
| 429 | Rate limited | Back off per `Retry-After` |
| 500-503 | Transient | Exponential backoff |

## Gotchas

- **Region selection is sticky**: A US-region key cannot call EU endpoints. The error is a generic 401, not a 404 — surface a clear message asking the user to check the region credential.
- **Archived seats**: By default, list endpoints return only active seats. Pass `?includeArchived=true` to see seats whose source mailboxes were deleted but whose backups are retained.
- **Spanning vs. SaaS Protection**: These are different products that share marketing branding. Spanning has its own API (`spanning-mcp` plugin) — don't conflate keys.
- **Restore destination quirks**: Restoring an M365 mailbox to an existing user requires Graph API permissions on the target tenant; the SaaS Protection API surfaces the dependency as a 400 once the restore starts running, not at queue time.

## Related skills

When the build-out lands, expect domain skills for: clients, seats, restores, activity-logs, license-usage.
