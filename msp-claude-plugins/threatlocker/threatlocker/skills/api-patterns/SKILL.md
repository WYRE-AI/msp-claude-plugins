---
name: "ThreatLocker API Patterns"
description: >
  Use this skill when working with the ThreatLocker MCP tools —
  raw-key authentication (NO Bearer prefix), multi-tenant routing via
  organizationId header, POST-heavy "GetByParameters" endpoints,
  pagination shape, and child-organization fan-out patterns.
when_to_use: >-
  When working with ThreatLocker auth headers, multi-tenant requests, POST-based list endpoints,
  pagination, or fanning queries across child organizations. Use when: threatlocker api,
  threatlocker authentication, threatlocker pagination, threatlocker organizationid, threatlocker
  mcp, threatlocker tools, threatlocker child organizations, threatlocker getbyparameters, or
  threatlocker portalapi.
---

# ThreatLocker MCP Tools & API Patterns

## Overview

The ThreatLocker MCP server wraps the ThreatLocker Portal API
(`https://portalapi.g.threatlocker.com/portalapi`) and exposes tools
across computers, computer groups, approval requests, audit log
("Action Log" in the UI), and organizations. The API has two quirks
that surprise people: the auth header does NOT use `Bearer`, and most
"list" endpoints are POSTs against `/Entity/EntityGetByParameters` with
a structured body — not GETs with query strings.

## Connection & Authentication

### Raw API Key Header

ThreatLocker authenticates with a raw API key — no `Bearer` prefix:

| Header | Value |
|--------|-------|
| `Authorization` | `<apiKey>` (raw, no prefix) |
| `ManagedClientId` | (optional) for legacy partner setups |
| `organizationId` | (optional) tenant to scope this call to |

> **Common mistake:** Sending `Authorization: Bearer <key>` returns
> 401. Send the key bare.

### Environment Variables

```bash
export THREATLOCKER_API_KEY="your-raw-api-key"
export THREATLOCKER_BASE_URL="https://portalapi.g.threatlocker.com/portalapi"
```

## Multi-Tenant Routing

ThreatLocker is built for MSPs and uses organizations as the tenant
boundary. Three patterns:

1. **Default org** — Omit the `organizationId` header. The API uses
   the API key's primary organization.
2. **Specific child org** — Set `organizationId` to a child org ID to
   scope a single call to that tenant.
3. **Fleet-wide fan-out** — Set the body flag `childOrganizations: true`
   on `*GetByParameters` endpoints to roll up data across all child
   organizations the API key can see.

For tenant pivots, see the `organizations` skill.

## Available MCP Tools

### Computers

| Tool | Description |
|------|-------------|
| `threatlocker_computers_list` | List computers with pagination/filters |
| `threatlocker_computers_get` | Get full details for one computer |
| `threatlocker_computers_get_checkins` | Recent check-in history |

### Computer Groups

| Tool | Description |
|------|-------------|
| `threatlocker_computer_groups_list` | Full group list with metadata |
| `threatlocker_computer_groups_dropdown` | Slim list for selection UIs |

### Approval Requests

| Tool | Description |
|------|-------------|
| `threatlocker_approvals_list` | List approval requests |
| `threatlocker_approvals_get` | Single approval with full context |
| `threatlocker_approvals_pending_count` | Quick pending-queue size |
| `threatlocker_approvals_get_permit_application` | Application that would be permitted |

### Audit Log (Action Log)

| Tool | Description |
|------|-------------|
| `threatlocker_audit_search` | Search Action Log by time/host/file |
| `threatlocker_audit_get` | Full record for one action |
| `threatlocker_audit_file_history` | All actions for a given file path/hash |

### Organizations

| Tool | Description |
|------|-------------|
| `threatlocker_organizations_list_children` | All child orgs visible to the key |
| `threatlocker_organizations_get_auth_key` | Auth key for a specific org |
| `threatlocker_organizations_for_move_computers` | Orgs eligible as move targets |

## POST-Based "GetByParameters" Pattern

Most list endpoints are `POST /Entity/EntityGetByParameters` with a
JSON body. Request shape:

```json
{
  "pageNumber": 1,
  "pageSize": 50,
  "isAscending": false,
  "orderBy": "lastCheckin",
  "searchText": "",
  "childOrganizations": false
}
```

Response shape:

```json
{
  "totalItems": 1284,
  "items": [ /* array of entities */ ]
}
```

### Pagination

ThreatLocker uses page numbers, not cursors:

1. Call with `pageNumber: 1`, `pageSize: 50` (or 100/200).
2. Compute `totalPages = ceil(totalItems / pageSize)`.
3. Continue until you have collected `totalItems` rows or reached
   the last page.

Avoid huge `pageSize` values — large pages can time out. 50–200 is the
sweet spot.

### Sort and Search

- `orderBy` is an entity-specific column name (e.g. `lastCheckin`,
  `computerName`).
- `isAscending` toggles direction.
- `searchText` is a substring match across the entity's searchable
  columns (computer name, hostname, OS, etc.).

## Error Handling

| Code | Meaning | Fix |
|------|---------|-----|
| 401 | Bad API key OR `Bearer` prefix included | Send raw key |
| 403 | Key valid, but no access to requested org | Check `organizationId` |
| 404 | Wrong endpoint or unknown entity ID | Recheck path |
| 429 | Rate limited | Backoff and retry |
| 500 | Portal API hiccup | Retry, then escalate |

## Best Practices

- Default to `pageSize: 100` and paginate; always check `totalItems`
  before assuming you have the full set.
- For multi-tenant reports, fan out with `childOrganizations: true`
  rather than looping per-org when the entity supports it.
- Cache the result of `threatlocker_organizations_list_children` —
  child org lists rarely change within a session.
- Always pass `organizationId` explicitly when generating client-facing
  reports so the source tenant is unambiguous.

## Related Skills

- [computers](../computers/SKILL.md) — Endpoint inventory
- [computer-groups](../computer-groups/SKILL.md) — Policy scoping
- [approval-requests](../approval-requests/SKILL.md) — Application approvals
- [audit-log](../audit-log/SKILL.md) — Action Log investigation
- [organizations](../organizations/SKILL.md) — Multi-tenant pivots
