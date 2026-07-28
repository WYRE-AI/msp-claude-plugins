---
name: "Kaseya BMS API Patterns"
description: >
  Kaseya BMS PSA REST API v2 fundamentals: tenant subdomain routing,
  API-token bearer auth, Kaseya One SSO bridging, ticket and account
  workflows, and OData-style pagination.
when_to_use: >-
  When working with the Kaseya BMS REST API v2. Use when: kaseya bms, bms api, bms tickets, bms
  accounts, bms psa, vorex, or kaseya psa.
---

# Kaseya BMS API Patterns

## Status note

The MCP server (`kaseya-bms-mcp`) and SDK (`@wyre-technology/node-kaseya-bms`) are in development. This skill is reference documentation.

## Overview

Kaseya BMS exposes a REST v2 API at `/api/` on every BMS tenant. Reference: <https://help.bms.kaseya.com/help/Content/BMS%20API/bms-api-v2-bms-rest-apis.html>

Each MSP has a private tenant — there is no shared regional endpoint:

```
https://<tenant>.bms.kaseya.com/api
```

The tenant subdomain is a credential field; never hard-code.

## Authentication

Two supported flows.

### API Token (recommended for integrations)

1. BMS Admin → Service Desk → API Tokens → Create
2. Copy the token (shown once)
3. Send on every request as:

```
Authorization: Bearer <api_token>
X-Tenant: <tenantSubdomain>
```

Tokens are long-lived; revoke from the same UI.

### Kaseya One SSO

On Kaseya One tenants, mint a token via `https://one.kaseya.com/oauth/token` with `scope=bms.api`, then call BMS endpoints with `Authorization: Bearer <kaseya_one_jwt>`. The JWT carries the tenant claim — no `X-Tenant` header needed.

## Pagination

OData-style:

| Param | Default | Max | Notes |
|-------|---------|-----|-------|
| `$top` | 50 | 500 | Page size |
| `$skip` | 0 | — | Records to skip |
| `$filter` | none | — | OData filter (e.g. `Status eq 'Open'`) |
| `$orderby` | none | — | e.g. `CreatedDate desc` |

Responses include `TotalRecords` for total count; loop with `$skip += $top` until `$skip >= TotalRecords`.

## Common endpoints

| Domain | Endpoint | Notes |
|--------|----------|-------|
| Tickets | `GET /api/v2/service/tickets` | Filter via `$filter` |
| Single ticket | `GET /api/v2/service/tickets/{id}` | Includes notes if `?includeNotes=true` |
| Create ticket | `POST /api/v2/service/tickets` | |
| Add ticket note | `POST /api/v2/service/tickets/{id}/notes` | |
| Time entries | `GET /api/v2/service/timeentries` | Per-user/ticket |
| Accounts | `GET /api/v2/finance/accounts` | Clients |
| Contacts | `GET /api/v2/crm/contacts` | |
| Contracts | `GET /api/v2/finance/contracts` | |
| Service catalog | `GET /api/v2/service/catalog` | |
| KB articles | `GET /api/v2/service/knowledgebase` | |

## Response shape

```json
{
  "Result": [ /* records */ ],
  "TotalRecords": 1234,
  "ResponseCode": 0,
  "Status": "Ok"
}
```

`ResponseCode != 0` means application-level error even with HTTP 200; surface `Error` field to the user.

## Rate limits

BMS throttles at **300 req/min per tenant** under default policy. HTTP 429 includes `Retry-After`. Sustained abuse can trigger temporary tenant-level lockouts — back off aggressively.

## Error handling

| HTTP | Meaning | Action |
|------|---------|--------|
| 200 | OK (check `ResponseCode`) | |
| 400 | Bad filter / missing required field | Validate inputs |
| 401 | Bad token or expired | Re-issue token; check `X-Tenant` |
| 403 | Token lacks scope on this resource | Surface; verify role |
| 404 | Endpoint or record missing | Confirm tenant subdomain |
| 429 | Rate limited | Back off per `Retry-After` |
| 500-503 | Transient | Exponential backoff |

## Gotchas

- **Tenant header vs JWT claim**: With API token auth, `X-Tenant` is required. With Kaseya One SSO, the JWT carries the tenant claim and `X-Tenant` is *ignored* (or rejected on some versions). Pick one; don't send both.
- **OData filter strings**: Field names are PascalCase (`CreatedDate`, `Status`). Common 400s come from camelCase (`createdDate`).
- **Ticket status transitions**: BMS enforces a state machine on `Status`. Setting an invalid transition returns 400 with a generic message; check the workflow definition before bulk updates.
- **Vorex compatibility shims**: Some legacy Vorex tenants still respond on BMS endpoints with subtly different field names (e.g. `AccountID` vs `AccountId`). Defensive parsing pays off.

## Related skills

When the build-out lands, expect domain skills under this plugin for: tickets, accounts, contracts, time-entries, knowledge-base.
