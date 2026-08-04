---
name: "Spanning API Patterns"
description: >
  Spanning Cloud Backup REST API fundamentals: admin-email + API-token auth,
  the per-platform endpoint surface (M365, Google Workspace, Salesforce),
  the user/license model, backup status queries, and restore operations.
when_to_use: >-
  When working with the Spanning Cloud Backup REST API. Use when: spanning, spanning backup,
  spanning api, saas backup spanning, or cloud backup.
---

# Spanning API Patterns

## Status note

The MCP server (`spanning-mcp`) and SDK (`@wyre-technology/node-spanning`) are in development.

## Overview

Spanning Cloud Backup provides daily SaaS backup for Microsoft 365, Google Workspace, and Salesforce. Each platform has its own REST API surface but a shared auth model.

Base URLs:

```
https://o365-api.spanningbackup.com/external/   (Microsoft 365)
https://api.spanningbackup.com/external/        (Google Workspace)
https://salesforce-api.spanningbackup.com/      (Salesforce)
```

The MCP server takes a `platform` credential field (`m365` | `gws` | `salesforce`) plus the appropriate region if applicable.

## Anti-triggers

- **Datto SaaS Protection** — Kaseya's other cloud-to-cloud backup
  product, covering the same Microsoft 365 and Google Workspace
  workloads under separate credentials and a separate API; use
  `datto-saas-protection-api-patterns`.
- **Appliance-based backup** — SIRIS/Alto and Unitrends protect servers
  and images, not SaaS tenants; use `datto-bcdr-api-patterns` or
  `unitrends-api-patterns`.

## Authentication

Spanning uses **HTTP Basic auth** per the public OpenAPI spec
(<http://o365-docs.spanningbackup.com/swagger/json>):

```
Authorization: Basic base64(<admin_email>:<api_token>)
```

The admin email and API token are pair-bound — both must match the
pair on file in the Spanning admin console or the API returns 401.

Token issuance:

1. Spanning admin console → Settings → API Token
2. Copy token (shown once)
3. Tokens are tenant-scoped — one per Spanning org

## Object model

```
Org (a Spanning customer)
 └── User (a backed-up M365 / GWS / Salesforce user)
      └── Backup runs (one per day per service per user)
           └── Restorable items (mail / drive / calendar / records)
```

## Common endpoints (M365 example)

| Domain | Endpoint | Notes |
|--------|----------|-------|
| Users | `GET /external/users` | All users in the org |
| Single user | `GET /external/users/{userId}` | License + backup state |
| User services | `GET /external/users/{userId}/services` | Mail, OneDrive, etc. |
| Backup runs | `GET /external/users/{userId}/services/{service}/backups` | |
| Restore (queue) | `POST /external/users/{userId}/services/{service}/restores` | |
| Restore status | `GET /external/restores/{restoreId}` | |
| Audit log | `GET /external/audit` | Date-ranged |
| License usage | `GET /external/license` | Seats used vs purchased |

Google Workspace and Salesforce surfaces mirror this with platform-appropriate substitutions.

## Pagination

Cursor-based:

```
GET /external/users?limit=100
→ { items: [...], next: "<cursor>" }

GET /external/users?limit=100&cursor=<cursor>
```

Default `limit` 50, max 200.

## Restore operations

Async, similar pattern to Datto SaaS Protection:

```
1. POST /external/users/{userId}/services/{service}/restores
   body: { items: [...], restoreDestination: "..." }
   → { restoreId, status: "queued" }
2. Poll GET /external/restores/{restoreId} every 30s
3. status: queued → running → completed | failed
```

## Rate limits

**100 req/min per token**. HTTP 429 includes `Retry-After`. Long-running list operations (e.g. iterating audit logs across 90 days) should chunk by date and serialize.

## Error handling

| HTTP | Meaning | Action |
|------|---------|--------|
| 200 | OK | |
| 400 | Bad request | Validate |
| 401 | Bad / expired token, or admin email mismatch | Re-issue |
| 403 | Token lacks scope | Verify role |
| 404 | Unknown user / backup / restore | |
| 409 | Conflicting restore in flight | Surface to user |
| 429 | Rate limited | Back off |
| 500-503 | Transient | Exponential backoff |

## Gotchas

- **Admin email + token must match**: The token is bound to the admin email. If either is wrong, the API returns 401 with a generic message — surface a clear "verify both fields" error.
- **Platform-specific URL bases**: A token that works for M365 won't work against the GWS endpoint. Cross-platform org reporting requires separate tokens (or one platform-agnostic token at the partner level for partner-tier customers).
- **Spanning vs Datto SaaS Protection**: Despite shared Kaseya branding, these are different products. Don't mix tokens.
- **Salesforce API quirks**: The Salesforce surface uses Salesforce object IDs (15- or 18-character) rather than the user-friendly identifiers used by M365/GWS endpoints.

## Related skills

When the build-out lands, expect domain skills for: users, backups, restores, audit, license.
