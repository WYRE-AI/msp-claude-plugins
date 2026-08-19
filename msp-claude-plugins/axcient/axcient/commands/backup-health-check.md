---
description: Check backup health for one Axcient-protected device
argument-hint: "<device_id>"
arguments: [device_id]
---

# Backup Health Check

Full health check for one Axcient x360Recover device: current status,
recovery-point freshness across all storage tiers, AutoVerify boot-test
result, and recent job run history.

## Prerequisites

- Axcient MCP server connected with a valid API key
- MCP tools `axcient_devices_get`, `axcient_devices_get_autoverify`, and
  `axcient_jobs_get_history` available
- The device's `device_id` (from `axcient_devices_list` or
  `axcient_devices_list_by_client` if not already known)

## Steps

1. **Pull device detail**

   Call `axcient_devices_get` with `device_id`. Extract `current_health_status`,
   `previous_health_status`, `type`, `product`, `d2c`, and all three
   `latest_local_rp` / `latest_vault_rp` / `latest_cloud_rp` timestamps.
   Note the device's `client_id` and `jobs` array from the response — you'll
   need both for the next steps.

2. **Check AutoVerify**

   Call `axcient_devices_get_autoverify` with `device_id`. This is the
   strongest recoverability signal available — a job can report success
   while producing an image that doesn't actually boot. Note `is_healthy`
   and the timestamp of the last verification.

3. **Check recent job history**

   For each job ID in the device's `jobs` array, call
   `axcient_jobs_get_history` with the device's `client_id`, `device_id`,
   and the `job_id`, using a `starttime_begin` a few days back. Look for a
   pattern of failures rather than a single missed run.

4. **Synthesize**

   Report:
   - Overall status (healthy / degraded / stale / unknown)
   - Which of the three recovery-point tiers (local/vault/cloud) are
     current vs. stale, with actual timestamps
   - Whether AutoVerify confirms the latest recovery point boots
   - Any job showing a recent failure pattern, with the job name/ID

   Do not report "backed up" as a single yes/no — state each tier's
   freshness explicitly, since a device can be current locally while its
   cloud or vault replication has silently stalled.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|--------------|
| device_id | integer | Yes | The Axcient device to check |

## Examples

```
/backup-health-check --device_id 12345
```

## Error Handling

- **Device Not Found:** Verify the ID against `axcient_devices_list`. A
  non-numeric ID surfaces as a 401, identically to a bad API key — see the
  `api-patterns` skill before assuming a credential problem.
- **AutoVerify Empty:** Not every device type supports AutoVerify; an empty
  result isn't necessarily a failure signal — say so rather than reporting
  it as missing data.
- **Job History Unreliable:** This endpoint has known upstream flakiness;
  corroborate a suspicious empty result against `axcient_devices_get_restore_points`
  before concluding a job has never run.

## Related Commands

- `/client-backup-overview` - Health rollup across every device for a client
