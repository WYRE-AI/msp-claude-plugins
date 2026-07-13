---
description: Resolve an open alert in Datto RMM
argument-hint: "<alert-id> [note] [all]"
arguments: [alert-id, note, all]
---

# Resolve Alert

Resolve an open alert in Datto RMM by alert UID or by finding alerts on a device.

## Prerequisites

- Valid Datto RMM API credentials configured
- `DATTO_API_KEY` and `DATTO_API_SECRET` environment variables set
- `DATTO_PLATFORM` configured (pinotage, merlot, concord, vidal, zinfandel, syrah)

## Steps

1. **Determine identifier type**
   - If looks like a UUID (36 chars with dashes), treat as alert UID
   - Otherwise, treat as device hostname

2. **For alert UID:**
   - Directly resolve: `POST /api/v2/alert/{alertUid}/resolve`

3. **For device hostname:**
   - Find device using device lookup
   - Fetch open alerts: `GET /api/v2/device/{deviceUid}/alerts/open`
   - If single alert, resolve it
   - If multiple alerts, list them for selection (unless --all flag)

4. **Resolve alert(s)**
   ```http
   POST /api/v2/alert/{alertUid}/resolve
   Content-Type: application/json

   {
     "resolution": "Resolved by technician: <note>"
   }
   ```

5. **Confirm resolution**
   - Return success message with alert details
   - Show updated alert count for device

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert-id | string | Yes | - | Alert UID or device hostname |
| note | string | No | "Resolved via Claude" | Resolution note |
| all | flag | No | false | Resolve all alerts on device |

## Examples

### Resolve by Alert UID

```
/resolve-alert "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Resolve with Note

```
/resolve-alert "a1b2c3d4-e5f6-7890-abcd-ef1234567890" --note "Cleared disk space by removing temp files"
```

### Find and Resolve Alerts on Device

```
/resolve-alert "ACME-DC01"
```

### Resolve All Alerts on Device

```
/resolve-alert "ACME-DC01" --all --note "Scheduled maintenance completed"
```

## Output

### Single Alert Resolved

```
Alert Resolved Successfully

Alert UID:    a1b2c3d4-e5f6-7890-abcd-ef1234567890
Device:       ACME-DC01
Alert Type:   Disk Usage
Priority:     High
Message:      Disk C: is 92% full

Resolution:   Cleared disk space by removing temp files
Resolved At:  2024-02-15 10:45:00 UTC
Resolved By:  API User

Device now has 1 remaining open alert(s).
```

### Multiple Alerts on Device

```
Open alerts for ACME-DC01:

  # | Priority | Type           | Message
----+----------+----------------+----------------------------------
  1 | High     | Disk Usage     | Disk C: is 92% full
  2 | Moderate | Windows Update | Windows Update pending reboot
  3 | Low      | Software       | Chrome update available

Which alert(s) to resolve?
- Enter number(s) separated by commas (e.g., 1,2)
- Enter 'all' to resolve all
- Enter 'cancel' to abort

>
```

### All Alerts Resolved

```
Resolved 3 alert(s) on ACME-DC01

  # | Priority | Type           | Status
----+----------+----------------+---------
  1 | High     | Disk Usage     | Resolved
  2 | Moderate | Windows Update | Resolved
  3 | Low      | Software       | Resolved

Resolution note: Scheduled maintenance completed
Device now has 0 open alerts.
```

### No Open Alerts

```
No open alerts for ACME-DC01

The device has no alerts requiring resolution.
Last alert was resolved 2024-02-14 at 09:30 UTC.
```

### Partial Success (Batch)

```
Batch resolution results for ACME-DC01:

  # | Priority | Type           | Status
----+----------+----------------+------------------
  1 | High     | Disk Usage     | Resolved
  2 | Moderate | Windows Update | Resolved
  3 | Low      | Software       | Failed - Already resolved

2 of 3 alerts resolved successfully.
Device now has 0 open alerts.
```

## Error Handling

### Alert Not Found

```
Alert not found

No alert found with UID: a1b2c3d4-...

Possible reasons:
- Alert may already be resolved
- Alert UID may be incorrect
- Alert may have been auto-resolved

Use /device-lookup to find current alerts on the device.
```

### Alert Already Resolved

```
Alert already resolved

Alert UID:    a1b2c3d4-e5f6-7890-abcd-ef1234567890
Resolved At:  2024-02-15 09:30:00 UTC
Resolved By:  jane.tech@msp.com
Resolution:   Disk cleanup performed

No action taken.
```

### Device Not Found

```
Device not found: "UNKNOWN-PC"

No device matching "UNKNOWN-PC" was found.

Suggestions:
- Verify the hostname is correct
- Use /device-lookup to search for the device
- The device may not have the Datto agent installed
```

### Permission Denied

```
Permission denied

Unable to resolve alert. Your API credentials may not have
permission to resolve alerts.

Contact your Datto RMM administrator to verify:
- API key has alert resolution permissions
- API key has access to this site/device
```

### Rate Limited

```
Rate limit exceeded

The Datto RMM API rate limit has been reached.
Waiting 60 seconds before retrying...
```

## Alert Context Display

When resolving alerts, context-specific information is shown:

### Disk Usage Alert

```
Alert Details

Type:         Disk Usage (perf_disk_usage_ctx)
Priority:     High
Device:       ACME-DC01
Raised:       2024-02-15 08:00:00 UTC (2h 45m ago)

Context:
  Drive:      C:
  Usage:      92%
  Free Space: 20 GB of 250 GB
  Threshold:  90%

Recommended Actions:
1. Run Disk Cleanup utility
2. Clear temporary files
3. Check for large log files
4. Consider expanding disk

Resolve with note? [Y/n]
```

### Service Stopped Alert

```
Alert Details

Type:         Service Status (srvc_status_ctx)
Priority:     High
Device:       ACME-DC01
Raised:       2024-02-15 09:15:00 UTC (1h 30m ago)

Context:
  Service:    SQL Server (MSSQLSERVER)
  Status:     Stopped
  Expected:   Running
  Start Type: Automatic

Recommended Actions:
1. Check Event Log for service failure reason
2. Verify service account credentials
3. Run: net start "MSSQLSERVER"
4. Check dependencies

Resolve with note? [Y/n]
```

### Ransomware Alert

```
CRITICAL ALERT

Type:         Ransomware Detection (ransomware_ctx)
Priority:     Critical
Device:       ACME-WKS05
Raised:       2024-02-15 10:30:00 UTC (15m ago)

Context:
  Detection:  Behavioral
  Path:       C:\Users\John\Documents
  Action:     Blocked
  Process:    suspicious.exe
  Files:      15 files affected

IMMEDIATE ACTIONS REQUIRED:
1. DISCONNECT device from network immediately
2. Do NOT restart the device
3. Contact security team
4. Preserve evidence
5. Check for lateral movement

This alert should only be resolved after security team approval.

Resolve? This is a critical security alert. [y/N]
```

## Related Commands

- `/device-lookup` - Find devices and their alerts
- `/run-job` - Run remediation jobs
- `/site-devices` - View all devices and alert counts

## Related Skills

- [Alerts Skill](../skills/alerts/SKILL.md) - Alert context types and handling
- [Devices Skill](../skills/devices/SKILL.md) - Device management
- [API Patterns Skill](../skills/api-patterns/SKILL.md) - Authentication
