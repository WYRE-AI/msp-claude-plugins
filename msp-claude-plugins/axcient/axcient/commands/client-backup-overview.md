---
description: Backup health overview across every device for one Axcient client
argument-hint: "<client_id>"
arguments: [client_id]
---

# Client Backup Overview

Rolls up backup health across every device for one Axcient x360Recover
client — the fastest way to answer "is this customer's backup posture
okay" without checking each device one at a time.

## Prerequisites

- Axcient MCP server connected with a valid API key
- MCP tools `axcient_clients_get` and `axcient_devices_list_by_client`
  available

## Steps

1. **Pull client summary**

   Call `axcient_clients_get` with `client_id`. Note `health_status` and
   `devices_counters` (appliance_based / d2c / cloud_archive, each split by
   SERVER/WORKSTATION) as the baseline expectation for device count.

2. **List devices**

   Call `axcient_devices_list_by_client` with the same `client_id`. For
   each device, capture `name`, `type`, `current_health_status`, and the
   three `latest_*_rp` timestamps.

3. **Flag outliers**

   Identify devices where:
   - `current_health_status.status` is not the healthy value
   - Any `latest_*_rp` looks stale relative to the device's configured
     thresholds (`thresholds.*_rp_threshold` on the device detail — call
     `axcient_devices_get` on flagged devices for the full threshold object)
   - The device count from step 2 doesn't match the sum of
     `devices_counters` buckets from step 1 (worth a note, not necessarily
     an error — buckets aren't mutually exclusive)

4. **Report**

   Present a table: device name, type, health status, most-stale
   recovery-point tier and its age. Lead with anything unhealthy or stale;
   don't bury outliers in a full device list. For any flagged device,
   suggest `/backup-health-check` for the deeper AutoVerify + job-history
   dive.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|--------------|
| client_id | integer | Yes | The Axcient client to overview |

## Examples

```
/client-backup-overview --client_id 26
```

## Error Handling

- **Client Not Found:** Verify against `axcient_clients_list`.
- **Empty Device List:** A client with zero devices under it is a valid
  (if unusual) state — confirm the client is active (`active: true`)
  before treating this as an error.

## Related Commands

- `/backup-health-check` - Deep single-device check (AutoVerify + job history)
