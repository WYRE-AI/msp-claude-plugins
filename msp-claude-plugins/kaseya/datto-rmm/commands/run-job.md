---
description: Run a quick job on a device in Datto RMM
argument-hint: "<device> <component> [variables] [wait]"
arguments: [device, component, variables, wait]
---

# Run Job

Run a quick job (component script) on a device in Datto RMM.

## Prerequisites

- Valid Datto RMM API credentials configured
- `DATTO_API_KEY` and `DATTO_API_SECRET` environment variables set
- `DATTO_PLATFORM` configured (pinotage, merlot, concord, vidal, zinfandel, syrah)
- Device must be online for quick jobs
- Component must exist and be accessible

## Steps

1. **Resolve device identifier**
   - If UUID format, use as device UID directly
   - Otherwise, search by hostname using device lookup

2. **Verify device is online**
   - Check device status
   - If offline, return error with last seen time

3. **Resolve component**
   - If UUID format, use as component UID directly
   - Otherwise, search components by name

4. **Validate component variables**
   - Get component definition to check required variables
   - Verify all required variables are provided

5. **Create quick job**
   ```http
   POST /api/v2/device/{deviceUid}/quickjob
   Content-Type: application/json

   {
     "componentUid": "{componentUid}",
     "variables": {
       "key1": "value1",
       "key2": "value2"
     }
   }
   ```

6. **Handle result**
   - If `--wait` flag, poll for completion
   - Return job status and output

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| device | string | Yes | - | Device hostname or UID |
| component | string | Yes | - | Component name or UID |
| variables | string | No | - | Variables as `key=value,key2=value2` |
| wait | flag | No | false | Wait for job completion |

## Examples

### Basic Job Execution

```
/run-job "ACME-DC01" "Clear Temp Files"
```

### With Variables

```
/run-job "ACME-DC01" "Clear Temp Files" --variables "days=30,path=C:\\Temp"
```

### Wait for Completion

```
/run-job "ACME-DC01" "Clear Temp Files" --wait
```

### Using Component UID

```
/run-job "ACME-DC01" "c1d2e3f4-a5b6-7890-cdef-123456789abc" --wait
```

### Full Example

```
/run-job "ACME-DC01" "Disk Cleanup" --variables "drives=C,days=7,logs=true" --wait
```

## Output

### Job Queued (No Wait)

```
Job Queued Successfully

Job UID:      j1k2l3m4-n5o6-7890-pqrs-123456789def
Device:       ACME-DC01
Component:    Clear Temp Files
Status:       Queued

Variables:
  days: 30
  path: C:\Temp

Job will run when the device checks in (typically within 5 minutes).

To check status: /job-status j1k2l3m4-n5o6-7890-pqrs-123456789def
```

### Job Running (With Wait)

```
Running job on ACME-DC01...

Component:    Clear Temp Files
Started At:   2024-02-15 10:45:00 UTC
Status:       Running

[=========>          ] 50% - Executing...
```

### Job Completed Successfully

```
Job Completed Successfully

Job UID:      j1k2l3m4-n5o6-7890-pqrs-123456789def
Device:       ACME-DC01
Component:    Clear Temp Files
Duration:     45 seconds
Exit Code:    0

Output:
----------------------------------------------------------------------
Scanning temporary directories...
Found 156 files older than 30 days
Deleting files...
Successfully deleted 156 files (2.3 GB freed)
----------------------------------------------------------------------

Errors: None
```

### Job Failed

```
Job Failed

Job UID:      j1k2l3m4-n5o6-7890-pqrs-123456789def
Device:       ACME-DC01
Component:    Clear Temp Files
Duration:     12 seconds
Exit Code:    1

Output:
----------------------------------------------------------------------
Scanning temporary directories...
Error: Access denied to C:\Temp\locked.file
----------------------------------------------------------------------

Errors:
----------------------------------------------------------------------
ERROR: Could not delete locked file
Process exited with code 1
----------------------------------------------------------------------

Suggestions:
- Check if file is in use by another process
- Verify script has appropriate permissions
- Run job again after resolving file lock
```

### Job Timeout

```
Job Timed Out

Job UID:      j1k2l3m4-n5o6-7890-pqrs-123456789def
Device:       ACME-DC01
Component:    Long Running Script
Duration:     300 seconds (timeout)
Status:       Timeout

The job exceeded the maximum execution time.

Partial Output:
----------------------------------------------------------------------
Step 1 complete...
Step 2 complete...
Step 3 in progress...
----------------------------------------------------------------------

The job may still be running on the device.
Check device logs or run a shorter test job.
```

## Error Handling

### Device Offline

```
Cannot run job - Device is offline

Device:     ACME-DC01
Status:     Offline
Last Seen:  2024-02-15 08:30:00 UTC (2 hours ago)

Quick jobs require the device to be online.

Options:
1. Wait for device to come online
2. Schedule a job instead (run when device connects)
3. Contact on-site personnel to check device
```

### Component Not Found

```
Component not found: "Clear Temp Filess"

Did you mean one of these?
- Clear Temp Files (UID: c1d2e3f4-...)
- Clear Browser Cache (UID: c2d3e4f5-...)
- Disk Cleanup (UID: c3d4e5f6-...)

Use the exact component name or UID.
```

### Missing Required Variable

```
Missing required variable

Component:  Backup Script
Missing:    BACKUP_PATH, RETENTION_DAYS

Required variables for this component:
  - BACKUP_PATH (required): Destination path for backups
  - RETENTION_DAYS (required): Number of days to retain
  - COMPRESSION (optional, default: true): Enable compression

Usage: /run-job "ACME-DC01" "Backup Script" --variables "BACKUP_PATH=D:\\Backup,RETENTION_DAYS=30"
```

### Device Not Found

```
Device not found: "UNKNOWN-PC"

No device matching "UNKNOWN-PC" was found.

Use /device-lookup to search for the device.
```

### Multiple Devices Match

```
Multiple devices match "DC01":

  # | Hostname      | Site               | Status
----+---------------+--------------------+---------
  1 | ACME-DC01     | Acme Corporation   | Online
  2 | ACME-DC02     | Acme Corporation   | Online
  3 | TECHSTART-DC01| TechStart Inc      | Online

Please specify a more precise hostname or use the device UID.
```

### Permission Denied

```
Permission denied

Unable to run job on this device.

Possible causes:
- API key does not have job execution permissions
- API key does not have access to this site
- Component is restricted

Contact your Datto RMM administrator.
```

## Component Variable Format

Variables are passed as comma-separated `key=value` pairs:

```
--variables "key1=value1,key2=value2,key3=value3"
```

**Special Characters:**
- Use double quotes around the entire value
- Escape commas within values: `path=C:\Program Files\App`
- Boolean values: `true`, `false`
- Numbers: `30`, `100`

**Examples:**
```
--variables "days=30"
--variables "path=D:\\Backups,retention=7"
--variables "enabled=true,threshold=90,email=admin@company.com"
```

## Related Commands

- `/device-lookup` - Find devices
- `/resolve-alert` - Resolve alerts after remediation
- `/site-devices` - Find devices to run jobs on

## Related Skills

- [Jobs Skill](../skills/jobs/SKILL.md) - Job management patterns
- [Devices Skill](../skills/devices/SKILL.md) - Device lookup
- [Variables Skill](../skills/variables/SKILL.md) - Using variables
