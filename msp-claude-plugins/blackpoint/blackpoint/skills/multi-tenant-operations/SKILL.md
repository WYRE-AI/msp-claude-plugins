---
name: "Blackpoint Multi-Tenant Operations"
description: >
  Partner-level Blackpoint Cyber (CompassOne) operations: the
  partner-tenant hierarchy, enumerating customer tenants, sweeping
  detections and vulnerabilities across all of them, spotting volume
  anomalies, and building per-tenant scorecards.
when_to_use: >-
  When running partner-level Blackpoint Cyber / CompassOne work across many customer tenants —
  detection sweeps, exposure rollups, and per-tenant scorecards for MSP SOC operations and QBRs.
  Use when: blackpoint multi-tenant, blackpoint partner, compassone tenants, blackpoint all
  tenants, blackpoint msp sweep, blackpoint tenant rollup, or blackpoint qbr.
---

# Blackpoint Multi-Tenant Operations

The CompassOne partner account sees every customer tenant. This
skill covers the partner-level operating loop: enumerate tenants,
sweep across them, and roll up into a portfolio view.

## Anti-triggers

- **`blackpoint_partners_*`** — the partners domain is a stub. Partner
  scope comes from the token itself; `blackpoint_tenants_list` is the
  only enumeration that works.
- **Investigating one detection** — the drill-down flow is
  `blackpoint-incident-response`; this skill is the sweep across
  tenants, not the deep dive within one.
- **A tenant portfolio in another product** — M365 tenants are
  `cipp-tenants` or `inforcer-tenant-management`; Blumira client
  accounts are `blumira-msp`. A CompassOne tenant maps to none of them
  automatically.

## The Partner-Tenant Model

```
Partner (the MSP)
  └── Tenant (customer)        ← blackpoint_tenants_list / _get
        └── Asset
              └── Detections / Vulnerabilities
```

Every partner-level operation starts the same way: enumerate tenants,
then iterate. Never present partner output without tenant attribution
on every row.

## API Tools

| Tool | Purpose |
|------|---------|
| `blackpoint_tenants_list` | Enumerate customer tenants (filter by account, status, name search) |
| `blackpoint_tenants_get` | Detail for one tenant |
| `blackpoint_detections_list` | Detections — call once per tenant with `tenant_id` |
| `blackpoint_vulnerabilities_list` | Vulnerabilities — call once per tenant |
| `blackpoint_vulnerabilities_external_list` | External exposures per tenant |
| `blackpoint_vulnerabilities_darkweb_list` | Dark-web exposures per tenant |

## Common Workflows

### Multi-tenant detection sweep

1. `blackpoint_tenants_list` — enumerate all customers.
2. For each tenant, `blackpoint_detections_list` filtered to a recent
   window and `status` in {`new`, `investigating`}.
3. Roll up: detections per tenant, severity distribution, top
   detection types.
4. Flag tenants with abnormal volume — a tenant well above its
   apparent baseline is itself the signal.

### Portfolio exposure rollup (QBR prep)

1. Enumerate tenants.
2. Per tenant, pull `blackpoint_vulnerabilities_list`,
   `blackpoint_vulnerabilities_external_list`, and
   `blackpoint_vulnerabilities_darkweb_list`.
3. Build a per-tenant scorecard: fix-now vulnerability count,
   external-exposure count, dark-web count.
4. Rank tenants by exposure so the MSP knows where to spend
   remediation effort.

### Morning queue triage

1. Enumerate tenants.
2. Sweep `new` detections from the last 24h across all of them.
3. Rank by severity, then tenant impact, then recency.
4. Produce a shift-ready priority list (see the
   `alert-response-coordinator` agent).

## Edge Cases

- **Tenant scoping (403)** — a partner may not have access to every
  tenant returned; a 403 on drill-down means scoping, not a bad
  token.
- **Pagination at scale** — `blackpoint_tenants_list` and per-tenant
  detection lists can both paginate; fully page before claiming a
  count is complete.
- **Read-only** — partner-level work here is reporting and triage;
  state changes happen in the CompassOne portal.

## Best Practices

- Always start with `blackpoint_tenants_list` — never hard-code a
  tenant set.
- For QBRs, combine detection and exposure rollups into one
  per-tenant scorecard.

## Related Skills

- [incident-response](../incident-response/SKILL.md) - Drilling into one tenant's detections
- [vulnerability-management](../vulnerability-management/SKILL.md) - Exposure data per tenant
- [api-patterns](../api-patterns/SKILL.md) - Auth, hierarchy, pagination
