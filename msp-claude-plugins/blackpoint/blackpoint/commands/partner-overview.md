---
description: Portfolio-level Blackpoint Cyber / CompassOne rollup of detections and exposure across all tenants
argument-hint: "[hours]"
arguments: [hours]
---

# Blackpoint Partner Overview

A partner-level scorecard across every CompassOne tenant — detection
volume and exposure posture rolled up so the MSP knows where to focus.

## Prerequisites

- Blackpoint MCP server connected with a valid `BLACKPOINT_API_TOKEN`
- Tools: `blackpoint_tenants_list`, `blackpoint_detections_list`,
  `blackpoint_vulnerabilities_list`,
  `blackpoint_vulnerabilities_external_list`,
  `blackpoint_vulnerabilities_darkweb_list`

## Steps

1. **Enumerate tenants**

   Call `blackpoint_tenants_list` and page fully.

2. **Sweep detections per tenant**

   For each tenant, `blackpoint_detections_list` over the look-back
   window, `status` in {`new`, `investigating`}. Record count and
   severity distribution.

3. **Sweep exposure per tenant**

   For each tenant, pull `blackpoint_vulnerabilities_list`,
   `blackpoint_vulnerabilities_external_list`, and
   `blackpoint_vulnerabilities_darkweb_list`. Record fix-now
   vulnerability count, external-exposure count, dark-web count.

4. **Build the portfolio scorecard**

   One row per tenant: detection count, critical/high count,
   fix-now vulns, external exposures, dark-web exposures. Compute an
   overall risk rank.

5. **Output**

   A ranked portfolio table, a partner-wide summary line, and short
   notes on the highest-risk tenants. Flag any tenant with anomalous
   detection volume.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| hours | number | No | 24 | Detection look-back window |

## Examples

### Portfolio overview, last 24h
```
/partner-overview
```

### Wider detection window
```
/partner-overview --hours 168
```

## Related Commands

- `/triage-detections` - Drill into the partner detection queue
- `/tenant-exposure` - Deep exposure report for one tenant
