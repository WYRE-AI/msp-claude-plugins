---
name: "Inforcer API Patterns"
when_to_use: "When working with Inforcer authentication headers, region selection, the base URL, pagination, the envelope shape, or error handling for the Inforcer MCP server"
description: >
  Use this skill when working with the Inforcer MCP tools — the gateway
  X-Inforcer-Region / X-Inforcer-Api-Key headers, the region-based base
  URL and upstream Inf-Api-Key header, the /beta/ route prefix, the
  {success,message,errors,data} response envelope, continuationToken
  pagination, and the integer Client Tenant ID vs Azure AD GUID gotcha.
  Read this first — every other Inforcer skill assumes these patterns.
triggers:
  - inforcer api
  - inforcer authentication
  - inforcer region
  - inforcer pagination
  - inforcer mcp
  - inforcer api key
  - client tenant id
  - inf-api-key
---

# Inforcer MCP Tools & API Patterns

## Overview

The Inforcer MCP server exposes a read-only Microsoft 365 security
baseline governance surface for MSPs — managed tenants, baseline
templates, alignment/drift, secure scores, identity inventory, and
audit events — plus exactly **one** write action: triggering an
assessment run. Read this skill first; the other Inforcer skills build
on the connection, envelope, and tenant-id conventions described here.

> **Community-sourced API caveat.** Inforcer publishes **no official
> public API documentation**. The API surface modelled here is
> **community-sourced** from the
> [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity)
> project. Endpoint paths, field names, and behaviour may change without
> notice. Tool names below are illustrative of the MCP surface, not a
> guaranteed contract.

## Connection & Authentication

The gateway authenticates to Inforcer using **two** credentials, each
on its own `X-` header:

| Gateway header | Env var | Value |
|----------------|---------|-------|
| `X-Inforcer-Region` | `INFORCER_REGION` | One of `us`, `uk`, `eu`, `anz` (**required**) |
| `X-Inforcer-Api-Key` | `INFORCER_API_KEY` | Your raw Inforcer API key |

```bash
export INFORCER_REGION="us"        # or uk / eu / anz
export INFORCER_API_KEY="your-inforcer-api-key"
```

The `.mcp.json` substitutes `${INFORCER_REGION}` and
`${INFORCER_API_KEY}` into the `X-Inforcer-Region` and
`X-Inforcer-Api-Key` headers respectively.

### What the MCP server does upstream

The gateway-facing `X-` headers are **not** what Inforcer's own API
expects. The MCP server translates them:

- **Region → base URL host.** `X-Inforcer-Region` selects the regional
  host. The upstream base URL is
  `https://api-{region}.inforcer.com/api`, e.g.
  `https://api-us.inforcer.com/api`. Region is **required** — there is
  no default host.
- **API key → upstream header.** `X-Inforcer-Api-Key` is forwarded
  upstream as the custom `Inf-Api-Key` header that Inforcer's API
  actually reads.

You never set `Inf-Api-Key` or the base URL yourself — the MCP server
handles both. You only need the two `X-` headers (via the env vars).

## Route prefix

Many Inforcer routes live under a **`/beta/`** path prefix (the beta
API), e.g. `https://api-{region}.inforcer.com/api/beta/...`. The MCP
server builds these paths for you, but be aware that the surface is a
beta API and may evolve.

## Response envelope

Inforcer responses are wrapped in a consistent envelope:

```json
{
  "success": true,
  "message": "OK",
  "errors": [],
  "data": [ ... ]
}
```

| Field | Meaning |
|-------|---------|
| `success` | Boolean — whether the call succeeded |
| `message` | Human-readable status string |
| `errors` | Array of error detail (empty on success) |
| `data` | The actual payload (object or array) |

Always read from `data`. Treat `success: false` (or a non-empty
`errors`) as a failure even if an HTTP 200 came back.

## Pagination

List endpoints paginate with a **`continuationToken`**:

- A response may include a `continuationToken`. Pass it back on the next
  request to fetch the following page.
- **Absence of a `continuationToken` means you are on the last page.**

Loop until no `continuationToken` is returned before claiming a result
set is complete — especially for portfolio-wide reports where a partial
page silently understates drift or inventory.

## The Client Tenant ID gotcha

Tenant-scoped Inforcer paths take an **integer Client Tenant ID** —
**not** the Azure AD tenant GUID and **not** the tenant domain.

| Identifier | Works in the path? |
|------------|--------------------|
| Integer Client Tenant ID (e.g. `1423`) | **Yes** — this is what the path expects |
| Azure AD tenant GUID (`00000000-…`) | No — must be resolved to the integer id |
| Tenant domain (`contoso.onmicrosoft.com`) | No — must be resolved to the integer id |
| Friendly display name (`Contoso`) | No — must be resolved to the integer id |

The MCP server **resolves** friendly names, DNS domains, and Azure AD
GUIDs to the integer Client Tenant ID for you, so you can refer to a
tenant naturally. But the underlying API path is the integer id. If a
tenant-scoped call returns nothing, the most common cause is that a
GUID or domain reached the path without being resolved to the integer
Client Tenant ID — re-resolve via `inforcer_tenants_list` (see
[tenant-management](../tenant-management/SKILL.md)).

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad request — often a malformed tenant id (GUID/domain where an integer is expected) | Resolve to the integer Client Tenant ID and retry |
| 401 | Missing or invalid API key | Re-check `INFORCER_API_KEY` → `X-Inforcer-Api-Key` (forwarded as `Inf-Api-Key`) |
| 403 | Key valid but not authorized for this resource/region | Check the key's scope and that `INFORCER_REGION` matches the key's region |
| 404 | Unknown tenant / baseline / assessment id | Re-list to confirm the id exists; check you used the integer Client Tenant ID |
| 429 | Rate limit | Back off and retry |
| `success: false` in a 200 body | Application-level failure | Read `message` and `errors`; do not trust `data` |

## Best Practices

- Treat almost every Inforcer tool as **read-only**. The single
  mutation is `inforcer_assessments_run` — flag it explicitly before
  invoking (see [assessments](../assessments/SKILL.md)).
- Always confirm `INFORCER_REGION` is set and matches the key's region —
  a missing or wrong region points the MCP server at the wrong host.
- Page to completion using `continuationToken` before reporting totals.
- Never pass a GUID or domain into a tenant-scoped path expecting it to
  work — resolve to the integer Client Tenant ID first.
- Remember the API is community-sourced; verify surprising shapes
  against the [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity)
  project rather than assuming a stable contract.

## Related Skills

- [tenant-management](../tenant-management/SKILL.md) - listing tenants and resolving names to the integer Client Tenant ID
- [baseline-alignment](../baseline-alignment/SKILL.md) - baselines, alignment scores, and per-policy drift detail
- [compliance-reporting](../compliance-reporting/SKILL.md) - secure score and posture roll-up with alignment thresholds
- [identity-governance](../identity-governance/SKILL.md) - users, groups, and roles inventory
- [audit-events](../audit-events/SKILL.md) - searching audit events and listing event types
- [assessments](../assessments/SKILL.md) - listing and running assessments (the one write action)
