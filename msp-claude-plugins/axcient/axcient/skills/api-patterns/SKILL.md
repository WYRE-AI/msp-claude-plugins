---
name: "Axcient API Patterns"
description: >
  Axcient x360Recover API and MCP fundamentals: x-api-key header
  authentication, the single production base URL, the full 19-tool MCP
  catalog by domain, why most list endpoints return bare arrays with no
  pagination, and the five distinct error response shapes the upstream API
  actually returns.
when_to_use: >-
  When authenticating to or calling the Axcient x360Recover API directly or
  through the MCP tools, or when discovering which Axcient tool to use. Use
  when: axcient api, axcient authentication, axcient pagination, axcient mcp,
  axcient tools, axcient request, axcient error, axcient connection, or
  x360recover api.
---

# Axcient MCP Tools & API Patterns

## Overview

The Axcient MCP server wraps the x360Recover Public API (BCDR — backup
continuity and disaster recovery for servers and workstations behind Axcient
appliances, plus direct-to-cloud agents). It registers 19 tools covering the
caller's organization, clients, devices, backup jobs, vaults, and appliances.
Seventeen are read-only `GET` calls; two mutate state —
`axcient_vaults_set_threshold` and `axcient_clients_get_d2c_agent_token`.

## Anti-triggers

- **Datto BCDR (SIRIS/ALTO) devices** — different vendor, different API.
  Use `datto-bcdr`.
- **Datto SaaS Protection (M365/Google Workspace backup)** — use
  `datto-saas-protection`.
- **Unitrends appliances** — use `unitrends`.
- **Billing/usage reconciliation across the whole x360 suite** — Axcient's
  separate Billing API is not wrapped by this server; nothing here returns
  invoice line items.

## Connection & Authentication

### API Key Authentication

x360Recover authenticates with a single HTTP header:

| Header | Value |
|--------|-------|
| `x-api-key` | Your Axcient API key |

Generate credentials at: **partner.axcient.com > Settings > API Keys**
(any administrator can create one; all administrators can view and delete
keys created by others in the same organization).

**Environment Variables (self-hosted / stdio mode):**

```bash
export AXCIENT_API_KEY="your-api-key"
```

Through the WYRE Conduit gateway you set nothing — Conduit holds the key and
injects it per request as `X-Axcient-Api-Key`, which the server forwards
upstream as `x-api-key`. See `GOVERNANCE.md`.

> **IMPORTANT:** Never hardcode credentials.

### Base URL

```
https://axapi.axcient.com/x360recover
```

There is no region selection — one production host for all customers.
(Axcient also publishes a mock server at `ax-pub-recover.wiremockapi.cloud`
for testing without live credentials; this plugin's MCP server always talks
to production.)

## The call shape: client- and device-scoped, not flat

Devices, jobs, and appliances nest under a client (`client_id`), and jobs
additionally nest under a device (`device_id`). There are two ways to reach
devices and appliances: an org-wide list (`axcient_devices_list`,
`axcient_appliances_list`) or a client-scoped list
(`axcient_devices_list_by_client`, `axcient_appliances_list_by_client`).
Jobs have **no org-wide list** — you always need a `client_id` and
`device_id` in hand first, from a prior devices call.

All IDs are **integers**, not strings.

## Available MCP Tools

### Status & Organization

| Tool | Arguments | Description |
|------|-----------|-------------|
| `axcient_status` | *(none)* | Server's Axcient connection/credential state |
| `axcient_organization_get` | *(none)* | The caller's own organization, resolved from the API key |

### Clients

| Tool | Arguments | Description |
|------|-----------|-------------|
| `axcient_clients_list` | `include_appliances?` | Every client visible to this credential |
| `axcient_clients_get` | `client_id`, `include_appliances?` | One client, with health status and protected-system counters |
| `axcient_clients_get_d2c_agent_token` | `client_id`, `vault_id` | Mints a direct-to-cloud agent enrollment token (POST, 201) |

### Devices

| Tool | Arguments | Description |
|------|-----------|-------------|
| `axcient_devices_list` | `limit?`, `offset?` | Every device across the organization |
| `axcient_devices_list_by_client` | `client_id`, `service_id?`, `d2c_only?` | Devices for one client |
| `axcient_devices_get` | `device_id` | Full detail for one device |
| `axcient_devices_get_autoverify` | `device_id` | Latest screenshot-verification (AutoVerify) results |
| `axcient_devices_get_restore_points` | `device_id` | Available restore points for the device |

### Jobs

| Tool | Arguments | Description |
|------|-----------|-------------|
| `axcient_jobs_list_by_device` | `client_id`, `device_id` | All backup jobs for a device |
| `axcient_jobs_get` | `client_id`, `device_id`, `job_id` | One job |
| `axcient_jobs_get_history` | `client_id`, `device_id`, `job_id`, `limit?`, `offset?`, `starttime_begin?` | Run history for a job |

Jobs come in two shapes discriminated by the upstream schema — BRC
(appliance-based, legacy) and Replibit (current appliance OS). Both are
returned by the same tools; treat the response as a tagged union rather than
assuming one field set.

### Vaults

| Tool | Arguments | Description |
|------|-----------|-------------|
| `axcient_vaults_list` | `vault_type?` (`Private`\|`Cloud`), `active?`, `with_url?`, `limit?`, `include_devices?` | Every vault (private on-prem or Axcient cloud) |
| `axcient_vaults_get` | `vault_id` | One vault |
| `axcient_vaults_get_threshold` | `vault_id` | Current connectivity-loss alert threshold |
| `axcient_vaults_set_threshold` | `vault_id`, `threshold` | **Changes** the connectivity-loss threshold (minutes) |

### Appliances

| Tool | Arguments | Description |
|------|-----------|-------------|
| `axcient_appliances_list` | `service_id?`, `include_devices?` | Every appliance in the organization |
| `axcient_appliances_list_by_client` | `client_id`, `include_devices?` | Appliances for one client |
| `axcient_appliances_get` | `appliance_id`, `include_devices?` | One appliance |

## Pagination

Only two endpoints accept pagination arguments: `axcient_devices_list`
(`limit`/`offset`) and `axcient_jobs_get_history` (`limit`/`offset`, plus
`starttime_begin` as a unix timestamp floor). Every other list tool returns
its complete result set in a single response — there is no cursor and no
`has_more` flag anywhere in this API. Client, appliance, and vault lists in
particular can return everything the credential can see in one call; do not
add a pagination loop where the tool signature doesn't accept one.

## Error Handling

x360Recover is a young public API (beta as of the current schema) and its
error responses are **not uniform** — the same conceptual failure can arrive
in different shapes depending on which layer rejects the request. The MCP
server normalizes all of these into a consistent `AxcientApiError`, but it's
worth knowing what's actually happening upstream:

| Situation | HTTP Status | Content-Type | Body shape |
|-----------|-------------|---------------|------------|
| Invalid API key | 401 | `application/json` | `{"message": "Unauthorized"}` |
| Invalid endpoint / bad path param (e.g. non-numeric ID) | 401 (not 400, despite the OpenAPI spec) | `text/html` | `{"code": 401, "msg": "Unauthorized"}` |
| Resource not found | 404 | `application/problem+json` | `{"detail", "status", "title", "type": "NotFoundException"}` |
| Bad request | 400 | `application/problem+json` | `{"detail", "status", "title", "type": "about:blank"}` |
| Insufficient permissions (mutating calls) | 403 | `application/problem+json` | `{"detail", "status", "title", "type": "ForbiddenException"}` |

**The practical consequence:** a malformed ID (e.g. passing a client's name
instead of its integer `client_id`) surfaces as a 401, identically to a bad
API key. If a single call fails with "unauthorized" but `axcient_status`
confirms the credential works, the actual problem is almost always an
invalid path parameter, not a revoked key.

## Best Practices

- Resolve `client_id` and `device_id` from a list call before calling any
  job tool — there is no way to reach a job without both ancestors in hand.
- Treat `axcient_devices_get_restore_points` and `axcient_jobs_get_history`
  as the two tools to reach for when a question is "did the backup actually
  run", not the job's own `latest_*_rp` timestamps alone — a device can show
  a recent local RP while its cloud/vault replication has stalled.
- `axcient_clients_get_d2c_agent_token` returns short-lived enrollment
  material for provisioning a *new* direct-to-cloud agent — it is not a way
  to read an existing agent's credentials, and calling it does not affect
  any device already enrolled.
- Cache `axcient_clients_list` and `axcient_appliances_list` results within
  a session; they change far less often than device or job state.

## Related Skills

- [clients](../clients/SKILL.md) - Client health, protected-system counters, D2C enrollment
- [devices](../devices/SKILL.md) - Device inventory, AutoVerify, restore points
- [jobs](../jobs/SKILL.md) - Backup job status and run history
- [vaults](../vaults/SKILL.md) - Private/cloud vault state and connectivity thresholds
- [appliances](../appliances/SKILL.md) - Appliance inventory and hardware detail
