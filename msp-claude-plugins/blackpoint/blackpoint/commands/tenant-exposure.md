---
description: Build a prioritized exposure report for a Blackpoint Cyber / CompassOne tenant
argument-hint: "<tenant>"
arguments: [tenant]
---

# Blackpoint Tenant Exposure Report

Roll up a tenant's vulnerabilities, internet-facing exposures,
dark-web leaks, and scan coverage into a QBR-ready, prioritized
remediation report.

## Prerequisites

- Blackpoint MCP server connected with a valid `BLACKPOINT_API_TOKEN`
- Tools: `blackpoint_tenants_get`,
  `blackpoint_vulnerabilities_list`,
  `blackpoint_vulnerabilities_scans_list`,
  `blackpoint_vulnerabilities_external_list`,
  `blackpoint_vulnerabilities_darkweb_list`

## Steps

1. **Confirm the tenant**

   Resolve `tenant` with `blackpoint_tenants_get`.

2. **Check scan freshness**

   Call `blackpoint_vulnerabilities_scans_list`. If the last
   `completed` scan is stale or recent scans `failed`, lead the
   report with that caveat.

3. **Pull host vulnerabilities**

   Call `blackpoint_vulnerabilities_list` for the tenant. Build the
   fix-now cohort: `severity` high/critical, `status: open`,
   `exploit_available: true`, `patch_available: true`.

4. **Pull external exposures**

   Call `blackpoint_vulnerabilities_external_list`; group by exposure
   type (open port, vulnerable service, certificate, misconfig).

5. **Pull dark-web exposures**

   Call `blackpoint_vulnerabilities_darkweb_list`. For `credentials`
   leaks, recommend forced password resets and an MFA check.

6. **Output**

   Header (tenant, window, scan status), Fix-Now Vulnerabilities
   table, Other Open Findings counts, External Exposures table,
   Dark-Web Exposures table, and a numbered Remediation Priorities
   list.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| tenant | string | Yes | none | Tenant name or ID |

## Examples

### Exposure report for one tenant
```
/tenant-exposure "Acme Corp"
```

## Related Commands

- `/partner-overview` - Compare exposure across all tenants
- `/triage-detections` - Pair exposure with active detections
