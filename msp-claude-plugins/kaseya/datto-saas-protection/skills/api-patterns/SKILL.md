---
name: "Datto SaaS Protection API Patterns"
description: >
  Datto SaaS Protection (formerly Backupify) through Conduit: the six
  datto_saas_* tools, the customer/domain/seat object model, Basic-auth key
  pair, seat types and states, and the confirm-gated bulk seat change.
when_to_use: >-
  When working with the Datto SaaS Protection (Backupify) tools or REST API. Use when: datto saas
  protection, backupify, saas backup, m365 backup, google workspace backup, saas protection api,
  datto_saas tools, seat license, or pause seat.
---

# Datto SaaS Protection API Patterns

## Overview

Datto SaaS Protection (rebranded Backupify) provides cloud-to-cloud backup for Microsoft 365 and Google Workspace tenants. Conduit brokers it through the `datto-saas-protection-mcp` sidecar (vendor slug `datto-saas-protection`), which wraps the documented Datto REST API at `https://api.datto.com/v1/saas`.

Reference: <https://saasprotection.datto.com/help/M365/Content/Other_Administrative_Tasks/using-rest-api-saas-protection.htm>

## Anti-triggers

- **Spanning** — Kaseya's other cloud-to-cloud backup product covers
  the same Microsoft 365 and Google Workspace workloads (plus
  Salesforce) under separate credentials and a separate API; use
  `spanning-api-patterns`.
- **Datto's appliance backup** — SIRIS/Alto image backup is BCDR, a
  different product and API; use `datto-bcdr-api-patterns`.

## Authentication

The Datto REST API uses HTTP Basic auth with the **public/secret API key pair** from the Datto Partner Portal (Admin → Integrations → API Keys). Both are stored on the Datto SaaS Protection connection in Conduit, which injects them on every request; nothing is set on the client.

There is a single API host, `api.datto.com`. The connection's Region field is accepted for backward compatibility but has no effect: Datto publishes no EU SaaS Protection API host.

## Tools

| Tool | Tier | What it returns | REST call |
|------|------|-----------------|-----------|
| `datto_saas_list_domains` | read | Every customer domain (M365 tenant or Google Workspace domain): `saasCustomerId`, customer name, domain, `productType`, `externalSubscriptionId`, retention, `seatsUsed`, backup stats. Optional `search` filter. **Start here.** | `GET /v1/saas/domains` |
| `datto_saas_list_seats` | read | Seats for one customer with `seatType`, `seatState`, billable flag and `remoteId`. Optional `seatType` and `seatState` filters. | `GET /v1/saas/{saasCustomerId}/seats` |
| `datto_saas_get_seat` | read | One seat by `remoteId` or `mainId` (email or site URL), rendered as a seat card. Datto has no single-seat endpoint; this filters the seat list. | `GET /v1/saas/{saasCustomerId}/seats` |
| `datto_saas_list_applications` | read | Backup history per suite/application (Exchange, OneDrive, SharePoint, Teams, Gmail, Drive) with per-window status. `daysUntil` (up to about 30), `includeRemoteID`. | `GET /v1/saas/{saasCustomerId}/applications` |
| `datto_saas_get_backup_stats` | read | Detailed per-service backup statistics: last-7-day status, last backups, storage. | `GET /v1/saas/{saasCustomerId}/detailedBackupStats` |
| `datto_saas_bulk_seat_change` | write | License, Pause or Unlicense up to 100 seats of one type. Confirm-gated (see below). | `PUT /v1/saas/{saasCustomerId}/{externalSubscriptionId}/bulkSeatChange` |

`saasCustomerId` is optional on the read tools: if it is omitted and the client supports prompts, the server asks the user to pick a customer.

There is **no restore tool and no activity-log tool.** Restores are started in the SaaS Protection portal. Do not tell a user that a restore can be queued or polled from here.

## Object model

```
Partner (API key pair)
 └── Customer domain (saasCustomerId, externalSubscriptionId)
      └── Seat (remoteId / mainId, seatType, seatState, billable)
           └── Application backup history (per suite, per window)
```

| Seat types (case-sensitive) | `User`, `SharedMailbox`, `SharedDrive`, `Site`, `TeamSite`, `Team` |
|---|---|
| Seat states | `Active`, `Paused`, `Archived`, `Unprotected` |
| Bulk actions (case-sensitive) | `License`, `Pause`, `Unlicense` |

## Bulk seat change

`datto_saas_bulk_seat_change` requires `saasCustomerId`, `externalSubscriptionId` (both from `datto_saas_list_domains`, e.g. `Classic:Office365:123456`), `seatType`, `actionType` and `ids` (1-100 `remoteId` values from `datto_saas_list_seats`).

- **License** starts protection and billing.
- **Pause** keeps existing backups but stops new ones.
- **Unlicense** stops protection.

The server asks the user to confirm the exact change. On clients that cannot show a prompt it refuses unless `confirm: true` is passed, and that flag may only be set after the user has explicitly approved this exact change. Seat Management 2.0 tenants only.

```json
{
  "saasCustomerId": 123456,
  "externalSubscriptionId": "Classic:Office365:123456",
  "seatType": "User",
  "actionType": "License",
  "ids": ["00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"]
}
```

Add `"confirm": true` only after the user has approved this exact list.

## Pagination

`/domains` and `/seats` return bare arrays. Endpoints that answer with Datto's paged envelope (`{ pagination: { page, perPage, totalPages }, items }`) are followed automatically. List tools return a flat array, so there is no cursor to manage; `datto_saas_get_seat` returns a single seat object.

## Error handling

| HTTP | Meaning | Action |
|------|---------|--------|
| 401 | Bad or inactive key pair | Re-check the key pair on the Conduit connection |
| 403 | Key lacks access to this customer | Verify the key's scope in the Partner Portal |
| 404 | Unknown `saasCustomerId` or `externalSubscriptionId` | Re-run `datto_saas_list_domains` |
| 429 | Rate limited | Back off per `Retry-After` |
| 500-503 | Transient | Exponential backoff |

## Gotchas

- **Unprotected is not the same as never backed up.** A seat that exists in the tenant but is not licensed shows as `Unprotected`. Coverage gaps are seats in that state, not missing rows.
- **Archived seats keep their backups.** Seats whose source mailbox or site was deleted stay listed as `Archived`; filter with `seatState` rather than assuming the list is active-only.
- **Spanning vs. SaaS Protection**: these are different products that share marketing branding. Spanning has its own API and plugin; don't conflate keys or coverage.

## Related skills

- `datto-saas-protection-seat-coverage` — seat-coverage and backup-health sweep across customers.
