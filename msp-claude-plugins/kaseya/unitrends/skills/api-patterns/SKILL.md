---
name: "Unitrends API Patterns"
when_to_use: >-
  When working with the Unitrends Backup REST API — login flow, appliance & asset hierarchy, job
  status, recovery points. Use when: unitrends, unitrends api, unitrends backup, unitrends job, or
  unitrends recovery.
description: >
  Use this skill when integrating with the Unitrends Backup REST API. Covers login token
  exchange, appliance vs asset hierarchy, backup job status queries, recovery point
  listing, replication state, and Unitrends-specific gotchas.
---

# Unitrends API Patterns

## Status note

The MCP server (`unitrends-mcp`) and SDK (`@wyre-technology/node-unitrends`) are in development.

## Overview

Unitrends Backup appliances expose a REST API on each appliance. Reference: <https://github.com/unitrends/unitrends-api-doc/wiki>

Base URL is per-appliance:

```
https://<appliance>/api
```

For multi-appliance MSPs, an MSP Console aggregates across appliances at:

```
https://<msp-console>/api
```

The MCP server takes the base URL as a credential field.

## Authentication

Session-token flow:

1. `POST /api/login` with body `{ "username": "...", "password": "..." }`
2. Response: `{ "token": "...", "expires": <epochSeconds> }`
3. Send on every call: `Authorization: Bearer <token>`
4. Token TTL: 60 minutes idle, sliding window

Re-auth on 401; wrap in single-flight mutex to avoid concurrent re-auth races.

## Hierarchy

```
Appliance (the Unitrends host)
 └── Asset (a protected machine — VM, physical, NAS, M365 tenant)
      └── Asset Source (specific data type — VMware VM, file system, SQL DB)
           └── Backup Job
                └── Recovery Point (restore point)
```

When designing queries, always think appliance-first; assets are scoped to one appliance unless on the MSP Console.

## Common endpoints

| Domain | Endpoint | Notes |
|--------|----------|-------|
| Appliances (MSP Console) | `GET /api/appliances` | |
| Assets | `GET /api/assets` | Filter by `applianceId` |
| Backup jobs | `GET /api/jobs/backups` | Currently running + queued |
| Job history | `GET /api/jobs/history` | Date-ranged |
| Recovery points | `GET /api/recovery_points` | Per asset |
| Restore | `POST /api/restores` | Queue a restore |
| Replication | `GET /api/replication/queue` | Hot copy targets |
| Alerts | `GET /api/alerts` | Open alarms |
| Reports | `GET /api/reports/successrate` | RPO compliance |

## Pagination

Page-based:

| Param | Default | Max |
|-------|---------|-----|
| `limit` | 50 | 500 |
| `offset` | 0 | — |

Responses include `total` for the full result count.

## Rate limits

Per-appliance limits depend on hardware tier; Unitrends doesn't publish them. Defensive defaults: cap concurrency at 2 per appliance, sustained 60 req/min. HTTP 503 typically signals an appliance under load — back off for 30 seconds.

## Error handling

| HTTP | Meaning | Action |
|------|---------|--------|
| 200 | OK | |
| 400 | Bad parameter | Validate |
| 401 | Token expired | Re-auth, retry once |
| 403 | User lacks role on this appliance | Surface |
| 404 | Asset / job / recovery point unknown | |
| 503 | Appliance overloaded or in maintenance | Back off 30s |

## Gotchas

- **Self-signed certs**: On-prem Unitrends appliances often ship with self-signed certs. The MCP server should accept a `verifyTls` credential field; default `true`, allow `false` for trusted internal networks.
- **MSP Console vs appliance API drift**: The MSP Console aggregates a subset of endpoints. Asset-level operations (mount, restore) typically must target the appliance directly, not the console.
- **Asset IDs are appliance-scoped**: An asset ID `123` on appliance A is *not* the same asset on appliance B. Always carry `applianceId` alongside.
- **Job status semantics**: `success` ≠ "data is recoverable". A job can complete successfully with a degraded recovery point. Inspect both `status` and `verifyState` for full health.

## Related skills

When the build-out lands, expect domain skills for: appliances, assets, jobs, recovery-points, replication.
