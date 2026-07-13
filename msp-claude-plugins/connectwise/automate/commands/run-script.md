---
description: Execute a script on an endpoint in ConnectWise Automate
argument-hint: "<computer> <script> [params] [wait]"
arguments: [computer, script, params, wait]
---

# Run Script

Execute a script on an endpoint in ConnectWise Automate with optional parameters.

## Prerequisites

- Valid ConnectWise Automate API credentials configured
- `CONNECTWISE_AUTOMATE_SERVER` environment variable set
- `CONNECTWISE_AUTOMATE_USERNAME` and `CONNECTWISE_AUTOMATE_PASSWORD` environment variables set
- Computer must be online for immediate script execution

## Steps

1. **Resolve computer identifier**
   - If numeric, use as Computer ID directly
   - Otherwise, search by hostname

2. **Verify computer is online**
   - Check computer status
   - If offline, return error with last contact time

3. **Resolve script**
   - If numeric, use as Script ID directly
   - Otherwise, search scripts by name

4. **Validate script parameters**
   - Get script definition to check required parameters
   - Verify all required parameters are provided
   - Parse params string into key-value pairs

5. **Execute script**
   ```http
   POST /cwa/api/v1/Computers/{computerID}/Scripts/{scriptID}/Execute
   Authorization: Bearer {token}
   Content-Type: application/json

   {
     "Parameters": {
       "key1": "value1",
       "key2": "value2"
     }
   }
   ```

6. **Handle result**
   - If `--wait` flag, poll for completion
   - Return execution status and output

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| computer | string | Yes | - | Computer hostname or ID |
| script | string | Yes | - | Script name or ID |
| params | string | No | - | Parameters as `key=value,key2=value2` |
| wait | flag | No | false | Wait for script completion |

## Examples

### Basic Script Execution

```
/run-script "ACME-DC01" "Clear Temp Files"
```

### With Parameters

```
/run-script "ACME-DC01" "Clear Temp Files" --params "days=30,path=C:\\Temp"
```

### Wait for Completion

```
/run-script "ACME-DC01" "Clear Temp Files" --wait
```

### Using Computer ID

```
/run-script 12345 "Clear Temp Files" --wait
```

### Using Script ID

```
/run-script "ACME-DC01" 1001 --wait
```

### Full Example with All Options

```
/run-script "ACME-DC01" "Disk Cleanup" --params "drives=C,days=7,logs=true" --wait
```

## Output

### Script Queued (No Wait)

```
Script Queued Successfully

Execution ID:  98765
Computer:      ACME-DC01 (ID: 12345)
Script:        Clear Temp Files (ID: 1001)
Status:        Pending

Parameters:
  days: 30
  path: C:\Temp

Script will run when the computer checks in (typically within 5 minutes).

To check status later:
  GET /cwa/api/v1/Scripts/Executions/98765
```

### Script Running (With Wait)

```
Running script on ACME-DC01...

Script:        Clear Temp Files
Started At:    2024-02-15 10:45:00 UTC
Status:        Running

[=========>          ] Executing...
```

### Script Completed Successfully

```
Script Completed Successfully

Execution ID:  98765
Computer:      ACME-DC01
Script:        Clear Temp Files
Duration:      45 seconds
Exit Code:     0

Output:
----------------------------------------------------------------------
Scanning temporary directories...
Found 156 files older than 30 days
Deleting files...
Successfully deleted 156 files (2.3 GB freed)
----------------------------------------------------------------------

Errors: None
```

### Script Failed

```
Script Failed

Execution ID:  98765
Computer:      ACME-DC01
Script:        Clear Temp Files
Duration:      12 seconds
Exit Code:     1

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
- Run script again after resolving file lock
```

### Script Timeout

```
Script Timed Out

Execution ID:  98765
Computer:      ACME-DC01
Script:        Long Running Script
Duration:      300 seconds (timeout)
Status:        Timeout

The script exceeded the maximum execution time.

Partial Output:
----------------------------------------------------------------------
Step 1 complete...
Step 2 complete...
Step 3 in progress...
----------------------------------------------------------------------

The script may still be running on the computer.
Check computer logs or run a shorter test script.
```

## Error Handling

### Computer Offline

```
Cannot run script - Computer is offline

Computer:     ACME-DC01 (ID: 12345)
Status:       Offline
Last Contact: 2024-02-15 08:30:00 UTC (2 hours ago)

Scripts require the computer to be online.

Options:
1. Wait for computer to come online
2. Schedule script for later execution
3. Contact on-site personnel to check computer
```

### Computer Not Found

```
Computer not found: "UNKNOWN-PC"

No computer matching "UNKNOWN-PC" was found.

Suggestions:
- Verify the hostname spelling
- Use /list-computers to search for computers
- Check if the computer exists in Automate
```

### Multiple Computers Match

```
Multiple computers match "DC01":

  # | Computer      | Client           | Status  | ID
----+---------------+------------------+---------+-------
  1 | ACME-DC01     | Acme Corporation | Online  | 12345
  2 | ACME-DC02     | Acme Corporation | Online  | 12346
  3 | TECH-DC01     | TechStart Inc    | Online  | 12400

Please specify a more precise hostname or use the Computer ID.
```

### Script Not Found

```
Script not found: "Clear Temp Filess"

Did you mean one of these?
  - Clear Temp Files (ID: 1001, Folder: Maintenance/Disk)
  - Clear Browser Cache (ID: 1002, Folder: Maintenance/Browser)
  - Disk Cleanup (ID: 1003, Folder: Maintenance/Disk)

Use the exact script name or Script ID.
```

### Missing Required Parameter

```
Missing required parameter

Script:   Backup Script (ID: 2001)
Missing:  BACKUP_PATH, RETENTION_DAYS

Required parameters for this script:
  - BACKUP_PATH (required): Destination path for backups
  - RETENTION_DAYS (required): Number of days to retain backups
  - COMPRESSION (optional, default: true): Enable compression

Usage:
  /run-script "ACME-DC01" "Backup Script" --params "BACKUP_PATH=D:\\Backup,RETENTION_DAYS=30"
```

### Permission Denied

```
Permission denied

Unable to run script on this computer.

Possible causes:
- API credentials don't have script execution permissions
- API credentials don't have access to this client
- Script is restricted to certain users

Contact your ConnectWise Automate administrator.
```

## Parameter Format

Parameters are passed as comma-separated `key=value` pairs:

```
--params "key1=value1,key2=value2,key3=value3"
```

### Special Characters

- Use double quotes around the entire value
- Escape backslashes in paths: `path=C:\\Temp`
- Boolean values: `true`, `false`
- Numbers: `30`, `100`

### Parameter Examples

```
--params "days=30"
--params "path=D:\\Backups,retention=7"
--params "enabled=true,threshold=90,email=admin@company.com"
--params "drives=C:;D:,excludeFolders=Windows;Program Files"
```

## Exit Code Reference

| Exit Code | Typical Meaning |
|-----------|-----------------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of command |
| 3 | File not found |
| 5 | Access denied |
| 87 | Invalid parameter |
| 1603 | Installation failed |
| -1 | Script exception |

## Related Commands

- `/list-computers` - Find computers to run scripts on

## Related Skills

- [Scripts Skill](../skills/scripts/SKILL.md) - Script management patterns
- [Computers Skill](../skills/computers/SKILL.md) - Computer lookup
- [API Patterns Skill](../skills/api-patterns/SKILL.md) - Authentication and error handling
