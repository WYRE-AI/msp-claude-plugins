---
name: "cipp-licenses"
description: "Read-only M365 license visibility through CIPP: per-tenant SKU purchase vs. consumption, portfolio-wide CSP license commitments, common SKU part numbers and their friendly names, and the license-mix red flags that drive rightsizing and billing reconciliation."
when_to_use: >-
  When auditing M365 license usage, finding unused/overprovisioned licenses, or reviewing CSP
  license inventory across the MSP portfolio. Use when: cipp license, license usage, license
  audit, unused licenses, csp licenses, m365 sku, license report, or rightsize licenses.
---

# CIPP Licenses

License visibility across managed tenants. Two tools cover the read surface: per-tenant assignment + usage, and portfolio CSP inventory. License *changes* (assigning, removing) flow through `cipp_create_user`, `cipp_offboard_user`, or the M365 plugin — this skill is read-only.

## Tools

### `cipp_list_licenses`

```
cipp_list_licenses(tenantFilter='contoso.onmicrosoft.com')
```

Returns every SKU in the tenant with `skuPartNumber`, friendly name, `prepaidUnits.enabled` (purchased), `consumedUnits` (assigned), and per-SKU service plan detail. The gap between purchased and consumed is your unused-license inventory.

### `cipp_list_csp_licenses`

```
cipp_list_csp_licenses()
```

Portfolio-wide view of CSP (Cloud Solution Provider) license commitments — what the MSP owns across all tenants. Use to reconcile what's deployed against what's billed.

## Common SKU reference

| Part number | Friendly | Notes |
|-------------|----------|-------|
| `O365_BUSINESS_PREMIUM` | M365 Business Premium | SMB sweet spot — Exchange + EMS basics |
| `SPB` | M365 Business Premium (legacy code) | Same as above on older tenants |
| `SPE_E3` | M365 E3 | Mid-market, includes Intune + EMS |
| `SPE_E5` | M365 E5 | E3 + Defender + advanced compliance |
| `ENTERPRISEPACK` | Office 365 E3 | Apps + Exchange + SharePoint, no EMS |
| `EMS` / `EMSPREMIUM` | EMS E3 / E5 | Identity + device management add-on |
| `AAD_PREMIUM` / `AAD_PREMIUM_P2` | Entra ID P1 / P2 | Conditional access requires P1+ |
| `EXCHANGESTANDARD` | Exchange Online Plan 1 | Mail-only, no Office apps |
| `MCOMEETADV` | Teams Audio Conferencing | Per-user PSTN dial-in |

## Workflow patterns

### Unused-license report (single tenant)

```
licenses = cipp_list_licenses(tenantFilter='contoso.onmicrosoft.com')
unused = [
    {
        'sku': sku['skuPartNumber'],
        'purchased': sku['prepaidUnits']['enabled'],
        'consumed': sku['consumedUnits'],
        'unused': sku['prepaidUnits']['enabled'] - sku['consumedUnits']
    }
    for sku in licenses
    if sku['prepaidUnits']['enabled'] - sku['consumedUnits'] > 0
]
```

Anything with > 3 unused licenses or > 10% unused is worth flagging in the next QBR.

### Portfolio license-mix audit

For each tenant in `cipp_list_tenants`, call `cipp_list_licenses` and tally SKUs. Cross-reference against `cipp_list_csp_licenses`. Mismatches signal:

- Tenants on direct-billing where the MSP isn't earning CSP margin
- CSP licenses purchased but not yet assigned to any tenant
- Licenses assigned in a tenant without a corresponding CSP reservation (overage billing risk)

### License-mix red flags

| Pattern | Concern |
|---------|---------|
| Tenant has E3 + EMS E3 separately | Should be on M365 E3 — bundle is cheaper |
| Multiple Business Premium tenants > 300 users | Above 300, E3 typically wins on TCO |
| Entra ID P1 absent but conditional access deployed | CA requires P1; tenant is using a feature not licensed |
| Defender for Office not assigned but standards expect it | Standards will report failures until licensing is fixed |

## Caveats

- License *write* operations (assign/remove SKU) aren't in the MCP surface — use `cipp_create_user` (assigns at create time), `cipp_offboard_user` with `removeLicenses=true`, or fall back to the M365 plugin / Graph for runtime changes.
- `consumedUnits` can lag the live tenant by minutes; trust the tenant UI for time-sensitive decisions.
