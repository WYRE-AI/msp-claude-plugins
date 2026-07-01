---
name: "Inforcer Tenant Management"
when_to_use: "When listing managed M365 tenants with Inforcer, resolving a friendly name / domain / GUID to the integer Client Tenant ID, or scoping any operation to a specific tenant"
description: >
  Use this skill when working with Inforcer tenants — listing managed
  Microsoft 365 tenants, resolving a friendly name, DNS domain, or Azure
  AD GUID to the integer Client Tenant ID, and scoping every other
  Inforcer operation to the right tenant. The starting point for almost
  every Inforcer workflow, since alignment, secure score, identity, and
  audit calls are all tenant-scoped.
triggers:
  - inforcer tenant
  - list tenants
  - managed tenants
  - client tenant id
  - resolve tenant
  - which tenants
  - m365 tenant inforcer
  - msp tenant portfolio
---

# Inforcer Tenant Management

Tenants are the top-level scope in Inforcer. Alignment, secure score,
identity inventory, audit, and assessment calls are all scoped to a
single managed tenant. Knowing how to enumerate tenants and resolve a
friendly name to its **integer Client Tenant ID** is the first step in
almost every Inforcer workflow.

Read [api-patterns](../api-patterns/SKILL.md) first for the gateway
headers, the region requirement, the envelope, and pagination.

## Tools

### `inforcer_tenants_list`

List every Microsoft 365 tenant Inforcer manages. Returns tenant
objects including the integer **Client Tenant ID**, display name, the
default/primary domain, and (where present) the Azure AD tenant GUID.

```
inforcer_tenants_list()
```

Use this whenever a user refers to a client by name — the response is
how you resolve that name to the integer Client Tenant ID needed by
every tenant-scoped tool. Page through `continuationToken` until it is
absent so the list is complete.

## The Client Tenant ID gotcha (reinforced)

Inforcer's tenant-scoped paths take an **integer Client Tenant ID** —
**not** the Azure AD GUID and **not** the domain.

| Identifier | Use directly in a tenant path? |
|------------|--------------------------------|
| Integer Client Tenant ID (e.g. `1423`) | **Yes** |
| Azure AD tenant GUID (`00000000-…`) | No — resolve first |
| Tenant domain (`contoso.onmicrosoft.com`) | No — resolve first |
| Friendly display name (`Contoso`) | No — resolve first |

The MCP server resolves friendly names, DNS domains, and Azure AD GUIDs
to the integer Client Tenant ID for you. You can therefore say "scope to
Contoso" — but under the hood the path is the integer id. When a
tenant-scoped call returns nothing, the usual cause is a GUID or domain
that never got mapped to the integer id. Re-run `inforcer_tenants_list`
and confirm the resolution. Never guess the tenant identifier.

## Region is required

Every Inforcer call depends on `INFORCER_REGION` (`us`, `uk`, `eu`, or
`anz`) because the upstream host is region-specific. If
`inforcer_tenants_list` returns empty or 401/403, confirm the region
matches the region your API key belongs to before assuming the tenant
list is genuinely empty.

## Common patterns

**Resolve a friendly name → Client Tenant ID**

```
tenants = inforcer_tenants_list()
acme = next(t for t in tenants if 'acme' in t['displayName'].lower())
client_tenant_id = acme['clientTenantId']   # integer
```

Pass `client_tenant_id` to alignment, secure score, identity, audit,
and assessment tools.

**Build a portfolio loop**

List once, then iterate every tenant's integer Client Tenant ID for
fleet-wide reports (drift roll-ups, posture scorecards). Always page
`continuationToken` to completion first — a partial tenant list silently
drops clients from the report.

## Failure modes

- **Empty tenant list** — most often a region mismatch (`INFORCER_REGION`
  points at the wrong host) or a key with no tenant scope. Confirm region
  and key scope before concluding there are no managed tenants.
- **Tenant-scoped call returns nothing for a known client** — a GUID or
  domain reached the path instead of the integer Client Tenant ID.
  Re-resolve via `inforcer_tenants_list`.
- **GUID looks "close enough"** — it is not. The path needs the integer
  id; the GUID and domain are only inputs to resolution.

## Caveats

- Inforcer's API is **community-sourced** (no official public docs);
  field names like `clientTenantId` are illustrative and credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
  Verify the exact field on first use.
- There is **no** tenant create/edit/delete via this API — tenant
  management here is read-only enumeration and resolution.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - headers, region, envelope, pagination, and the id gotcha in depth
- [baseline-alignment](../baseline-alignment/SKILL.md) - read a tenant's alignment and per-policy drift once scoped
- [compliance-reporting](../compliance-reporting/SKILL.md) - roll a tenant's posture into a portfolio view
- [assessments](../assessments/SKILL.md) - trigger an assessment for a scoped tenant
