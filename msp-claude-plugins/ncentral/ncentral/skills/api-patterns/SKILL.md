---
name: "N-central API Patterns"
when_to_use: >-
  When working with N-central authentication, the Conduit connection, pagination, rate limits, or
  preview-endpoint availability for the N-central MCP server. Use when: ncentral api, ncentral
  authentication, ncentral jwt, ncentral pagination, ncentral mcp, ncentral token, n-able api, or
  api-explorer.
description: >
  Use this skill when working with the N-central MCP tools — User-API Token
  (JWT) authentication through Conduit, 1-based
  pagination with the totalItems/totalPages envelope, rate-limit behavior,
  preview-endpoint caveats, and on-prem server specifics.
---

# N-central MCP Tools & API Patterns

## Overview

The N-central MCP server exposes the N-able N-central REST API (`/api/*`)
for MSP technicians: devices, org units (service organizations, customers,
sites), active issues, scheduled tasks, custom properties, maintenance
windows, and access groups. Unlike SaaS RMMs, every MSP runs its own
N-central server — on-prem or N-able hosted — so all calls target a
per-tenant server FQDN.

## Connection & Authentication

The plugin talks to N-central through **Conduit** (`conduit.wyre.ai`). The
MCP client authenticates to Conduit with OAuth — no client-side environment
variables or headers. N-central credentials (a permanent **User-API Token**
JWT plus your server URL) are entered once in Conduit's connect UI; Conduit
stores them and injects them per-request as sidecar headers:

| Header (Conduit → sidecar, server-side) | Value |
|--------|-------|
| `X-NCentral-Server-URL` | Base URL of your N-central server (e.g. `https://ncentral.yourcompany.com`) |
| `X-NCentral-JWT` | The User-API Token JWT |

The MCP server handles upstream auth translation from those headers. If a
tool call fails with an authentication error, fix the credentials in
Conduit's connect page — not in the MCP client.

### How the token flow actually works

The JWT you supply is the *permanent* User-API Token generated in the
N-central UI (Administration → User Management → Users → user → API Access
→ Generate JSON Web Token). The MCP server exchanges it at
`POST /api/auth/authenticate` for a short-lived **access token (~1 hour)**
and **refresh token (~25 hours)**, and refreshes them transparently. You
never manage access/refresh tokens yourself — supply the JWT and server URL
and the server does the rest. Two constraints on the N-central side:

- The API user must have **MFA disabled** — N-central rejects API token
  authentication for MFA-enabled users.
- The token inherits the user's role and access groups. A least-privilege
  dedicated API user is strongly recommended.

Use `ncentral_validate_token` to confirm the token is valid and see which
user it authenticates as; `ncentral_server_info` reports the server version.

## Tool Navigation

Tools are exposed behind decision-tree navigation. Call `ncentral_navigate`
to move into a domain (orgs, devices, monitoring, tasks, custom-properties,
maintenance, access-groups), `ncentral_back` to go up a level, and
`ncentral_status` to see where you are and what is currently available.
`ncentral_health` works from anywhere.

## Pagination

List endpoints use 1-based page pagination:

| Parameter | Notes |
|-----------|-------|
| `pageNumber` | **1-based** (the first page is 1, not 0) |
| `pageSize` | Max **1000**; default varies by endpoint |
| `sortBy` | Field name to sort on |
| `sortOrder` | `asc` / `ASC` / `ascending` or `desc` / `DESC` / `descending` |

Responses arrive in an envelope:

```json
{
  "data": [ ... ],
  "totalItems": 4321,
  "totalPages": 5,
  "pageNumber": 1,
  "pageSize": 1000,
  "_links": { "nextPage": "...", "lastPage": "..." }
}
```

Always check `totalItems`/`totalPages` before claiming a result set is
complete; walk `pageNumber` up to `totalPages` (or follow `_links.nextPage`)
for full inventories.

## Rate Limiting

N-central returns **HTTP 429** when a client sends requests too quickly.
The MCP sidecar retries 429s with backoff automatically, so occasional
throttling is invisible; sustained parallel sweeps across large device
fleets will still slow down. Prefer server-side filters (`filterId`,
org-unit scoping) over client-side filtering of huge pages.

## Preview Endpoints

Several REST endpoints are published at N-able's **"preview"** stage —
their shape and availability vary by N-central release (this affects
active issues, scheduled tasks, maintenance windows, and custom properties
in older releases). If a tool returns 404 or an unexpected schema, check
what your server actually ships: the interactive Swagger UI at
`https://<your-server>/api-explorer` is the authoritative list for your
exact version.

## On-Prem Specifics

- **Per-server FQDN** — there is no shared cloud endpoint. Each MSP's
  N-central server has its own URL, and credentials are only valid there.
- **Conduit reachability** — Conduit must be able to reach the
  server. Firewalled or LAN-only on-prem servers need an inbound path
  (HTTPS/443) from Conduit.
- **Private CA certificates** — if the server presents a certificate from
  an internal CA, the MCP sidecar needs the CA bundle via
  `NODE_EXTRA_CA_CERTS`. Never disable TLS verification as a workaround.
- **Version drift** — hosted servers track current releases; on-prem
  servers may lag. Use `ncentral_server_info` and the api-explorer to
  confirm endpoint availability before debugging a "broken" tool.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | JWT invalid, expired, or user has MFA enabled | Regenerate the token; verify MFA is off for the API user |
| 403 | Authenticated but role/access group forbids the resource | Check the API user's role and access groups |
| 404 | Unknown ID, or endpoint not in this N-central release | Re-list to confirm the ID; check `/api-explorer` for availability |
| 429 | Rate limit | Sidecar retries automatically; slow sweeps if persistent |

## Related Skills

- [devices](../devices/SKILL.md) - device inventory, filters, assets, lifecycle
- [organizations](../organizations/SKILL.md) - SO/customer/site hierarchy, custom properties
- [monitoring-tasks](../monitoring-tasks/SKILL.md) - active issues, job statuses, scheduled tasks
