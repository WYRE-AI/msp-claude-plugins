---
description: Check Backup Radar health across a client's backups and surface failures
argument-hint: "[client]"
arguments: [client]
---

# Backup Radar Health Check

Sweep Backup Radar for failed, stale, or missing backups and produce a prioritized remediation list.

## Prerequisites

- ScalePad MCP server connected with a valid `X_SCALEPAD_API_KEY` (set `X_SCALEPAD_REGION=eu` for EU tenants)
- Optional discovery: `scalepad_navigate` with `domain: "backup-radar"` lists the relevant tools
- Tools used: `scalepad_br_backups_list_health`, `scalepad_br_backups_get_health`, `scalepad_br_backups_list_devices`

## Steps

1. **Pull backup health**

   Call `scalepad_br_backups_list_health` and paginate with `cursor` until exhausted. If a client was given, filter results to that client.

2. **Classify**

   Group records: failed, no-result/stale (no recent successful backup), warning, healthy.

3. **Check device coverage**

   Call `scalepad_br_backups_list_devices` and flag devices with no corresponding recent healthy backup record.

4. **Drill into failures**

   For each failure, call `scalepad_br_backups_get_health` with the record ID for the failure detail.

5. **Report**

   Output: per-client summary table (healthy/warning/failed/stale counts), then a prioritized failure list (client, device, backup job, last success, error) with recommended follow-up.

## Examples

### Whole book of business
```
/backup-health
```

### One client
```
/backup-health "Acme Dental"
```

## Related Commands

- `/asset-lifecycle-report` - correlate backup gaps with aging hardware
