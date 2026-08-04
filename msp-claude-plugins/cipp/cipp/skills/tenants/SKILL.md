---
name: "cipp-tenants"
description: "The top-level CIPP scope: enumerating managed M365 tenants, retrieving tenant detail, and the accepted `tenantFilter` identifier formats (default domain, custom domain, GUID, `allTenants`). Also covers stale-cache detection and the two common tenant-resolution failure modes."
when_to_use: >-
  When listing managed M365 tenants, looking up tenant IDs/domains, or scoping operations across
  the MSP portfolio. Use when: cipp tenant, list tenants, m365 tenant, tenant details, which
  tenants, all tenants, cipp portfolio, or msp tenant list.
---

# CIPP Tenants

Tenants are the top-level scope in CIPP. Every operational tool — users, mailboxes, standards, security — takes a `tenantFilter` parameter that scopes the call to one tenant or to `allTenants`. Knowing how to enumerate tenants and resolve a friendly name to its tenant ID is the first step in almost every CIPP workflow.

## Anti-triggers

- **Inforcer's tenant list** — Inforcer manages the same M365 tenants
  but keys them by an *integer* Client Tenant ID, not a domain or GUID.
  A `tenantFilter` value from here will not work there; use
  `inforcer-tenant-management`.
- **Why a tenant is missing, stale, or failing** — that is usually the
  GDAP delegation chain, not the tenant record; use `cipp-ops`.
- **A tenant's licence, standards, or CA posture** — this skill only
  resolves and describes the tenant itself; use `cipp-licenses`,
  `cipp-standards`, or `cipp-security`.

## Tools

### `cipp_list_tenants`

List every tenant CIPP manages. Returns a list of tenant objects with `customerId`, `defaultDomainName`, `displayName`, and onboarding status.

```
cipp_list_tenants()
```

Use this whenever a user refers to a client by name — the response gives you the `defaultDomainName` (or `customerId`) needed for `tenantFilter` on every other tool.

### `cipp_get_tenant_details`

Retrieve detailed information for one tenant: license count, domain list, GDAP relationship status, last refresh time.

```
cipp_get_tenant_details(tenantFilter='contoso.onmicrosoft.com')
```

Use `tenantFilter='allTenants'` to get a portfolio-wide aggregate — useful for fleet reports.

## Identifying a tenant

Most CIPP tools accept any of these in `tenantFilter`:

| Format | Example | Notes |
|--------|---------|-------|
| Default domain | `contoso.onmicrosoft.com` | Most readable, recommended |
| Custom domain | `contoso.com` | Works if CIPP has it cached |
| Tenant GUID | `00000000-0000-0000-0000-000000000000` | Most stable but opaque |
| `allTenants` | `allTenants` | Portfolio-wide; only some tools support it |

When a user says "Acme", always run `cipp_list_tenants` first and resolve to the canonical `defaultDomainName` before calling other tools. Never guess the tenant identifier.

## Common patterns

**Resolve a friendly name → tenant filter**

```
tenants = cipp_list_tenants()
acme = next(t for t in tenants if 'acme' in t['displayName'].lower())
tenant_filter = acme['defaultDomainName']
```

**Audit which tenants are stale in CIPP cache**

`cipp_get_tenant_details` returns `lastRefresh`. Tenants not refreshed in >24h often signal a broken GDAP relationship or revoked consent — flag them before running standards or BPA checks against them.

## Failure modes

- **`tenantFilter` not found** — the tenant exists in M365 but CIPP hasn't onboarded it. Trigger a tenant cache refresh in CIPP UI or check GDAP roles.
- **Empty tenant list** — the API client has no tenant scope assigned. Check the role assigned to the API client in CIPP Settings → API Client Management.
