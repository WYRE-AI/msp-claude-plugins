---
description: Execute a script on a remote asset via SuperOps RMM
argument-hint: "<asset_id> <script_id> [parameters] [run_as] [timeout]"
arguments: [asset_id, script_id, parameters, run_as, timeout]
---

# Run Script on SuperOps.ai Asset

Execute a script on a remote asset via SuperOps.ai RMM for automation and remediation.

## Prerequisites

- Valid SuperOps.ai API token configured
- Asset must be online and reporting
- Script must exist in script library
- User must have script execution permissions
- RMM module enabled in SuperOps.ai

## Steps

1. **Validate asset exists and is online**
   - Query asset by ID
   - Return error if asset not found
   - Warn if asset is offline

2. **Validate script exists**
   - Query script by ID
   - Show script details and required parameters
   - Validate provided parameters match schema

3. **Prepare execution request**
   - Parse parameters JSON
   - Set execution context (system/user)
   - Set timeout value

4. **Execute the script**
   ```graphql
   mutation runScriptOnAsset($input: RunScriptInput!) {
     runScriptOnAsset(input: $input) {
       actionConfigId
       script {
         scriptId
         name
       }
       asset {
         assetId
         name
       }
       arguments {
         name
         value
       }
       status
       scheduledTime
       runAs
     }
   }
   ```

   Variables:
   ```json
   {
     "input": {
       "assetId": "<asset_id>",
       "scriptId": "<script_id>",
       "arguments": [
         { "name": "param1", "value": "value1" }
       ],
       "runAs": "System",
       "timeout": 300
     }
   }
   ```

5. **Return execution status**
   - Display execution ID for tracking
   - Show how to check execution results

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| asset_id | string | Yes | - | The asset ID to run script on |
| script_id | string | Yes | - | Script ID from library |
| parameters | string | No | - | JSON string of script parameters |
| run_as | string | No | system | Execution context: system, user |
| timeout | integer | No | 300 | Timeout in seconds (max 3600) |

## Run As Options

| Option | Description | When to Use |
|--------|-------------|-------------|
| **System** | Run as SYSTEM account | Admin tasks, service management, system-level changes |
| **User** | Run as logged-in user | User-specific tasks, profile changes |

## Examples

### Basic Script Execution

```
/run-script asset_123 script_disk_cleanup
```

### With Parameters

```
/run-script asset_123 script_clear_temp --parameters '{"days": 30}'
```

### With Multiple Parameters

```
/run-script asset_123 script_restart_service --parameters '{"ServiceName": "Spooler", "WaitSeconds": 30}'
```

### Run as User Context

```
/run-script asset_123 script_clear_user_cache --run_as user
```

### With Custom Timeout

```
/run-script asset_123 script_windows_update --timeout 1800
```

### Full Example

```
/run-script asset_123 script_disk_cleanup --parameters '{"path": "C:\\Temp", "days": 30, "recursive": true}' --run_as system --timeout 600
```

## Output

### Execution Started

```
Script Execution Started

Execution ID: exec_abc123
Status: Pending

Script Details:
  Script: Clear Temp Files
  Script ID: script_disk_cleanup
  Type: PowerShell

Target Asset:
  Asset: ACME-DC01
  Client: Acme Corporation
  Status: Online

Execution Settings:
  Run As: System
  Timeout: 300 seconds
  Parameters:
    - days: 30
    - path: C:\Temp

The script has been queued for execution.
Use the execution ID to check status:

  Check status: (query getScriptExecution with exec_abc123)

Estimated completion: ~5 minutes
```

### Script Requires Parameters

```
Script requires parameters

Script: Restart Service
Script ID: script_restart_service

Required Parameters:
  - ServiceName (string, required): Name of the service to restart
  - WaitSeconds (integer, optional): Seconds to wait before restart (default: 10)

Example:
/run-script asset_123 script_restart_service --parameters '{"ServiceName": "Spooler"}'
```

## Checking Execution Status

After starting a script, you can check its status with this GraphQL query:

```graphql
query getScriptExecution($input: ScriptExecutionInput!) {
  getScriptExecution(input: $input) {
    actionConfigId
    status
    startTime
    endTime
    exitCode
    output
    error
    duration
  }
}
```

**Variables:**
```json
{
  "input": {
    "actionConfigId": "exec_abc123"
  }
}
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "mutation runScriptOnAsset($input: RunScriptInput!) { runScriptOnAsset(input: $input) { actionConfigId script { scriptId name } asset { assetId name } status scheduledTime runAs } }",
    "variables": {
      "input": {
        "assetId": "asset-uuid-here",
        "scriptId": "script-uuid-here",
        "arguments": [
          { "name": "days", "value": "30" }
        ],
        "runAs": "System",
        "timeout": 300
      }
    }
  }'
```

## Error Handling

### Asset Not Found

```
Asset not found: "asset_99999"

Please verify the asset ID is correct.
Use /list-assets to find available assets.
```

### Asset Offline

```
Cannot run script: Asset is offline

Asset: ACME-DC01
Status: Offline
Last Seen: 2026-02-04 12:00:00 UTC (2h ago)

Options:
1. Wait for asset to come online
2. Check network connectivity
3. Verify RMM agent is running

The script will not be queued for offline assets.
```

### Script Not Found

```
Script not found: "script_unknown"

Please verify the script ID is correct.

Available scripts matching "cleanup":
- script_disk_cleanup: Clear Temp Files
- script_browser_cleanup: Clear Browser Cache
- script_log_cleanup: Archive and Clear Logs

Use the exact script ID to run.
```

### Invalid Parameters

```
Invalid parameters for script

Script: Restart Service
Error: Missing required parameter: ServiceName

Required Parameters:
  - ServiceName (string, required)

Provided Parameters:
  - (none)

Example:
/run-script asset_123 script_restart_service --parameters '{"ServiceName": "Spooler"}'
```

### Invalid JSON

```
Invalid parameters JSON

Provided: {"days": 30

Error: Unexpected end of JSON input

Please provide valid JSON:
/run-script asset_123 script_cleanup --parameters '{"days": 30}'
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid asset ID | Verify asset exists using /list-assets |
| Asset offline | Wait for asset to come online |
| Invalid script ID | Verify script exists in library |
| Invalid parameters | Check script parameter requirements |
| Permission denied | Check user permissions for script execution |
| Timeout exceeded | Increase timeout or optimize script |
| Rate limited | Wait and retry (800 req/min limit) |

## Exit Code Reference

| Exit Code | Meaning | Description |
|-----------|---------|-------------|
| 0 | Success | Script completed successfully |
| 1 | General error | Generic error occurred |
| 2 | Misuse | Invalid command or syntax |
| 126 | Permission denied | Cannot execute command |
| 127 | Command not found | Command does not exist |
| 137 | Killed (timeout) | Script exceeded timeout |
| 255 | Exit out of range | Invalid exit status |

## Best Practices

1. **Test on single asset first** - Before bulk execution
2. **Check asset status** - Verify online before running
3. **Use appropriate timeouts** - Long scripts need longer timeouts
4. **Handle errors in scripts** - Return meaningful exit codes
5. **Log output** - Capture script output for troubleshooting
6. **Use System context** - Unless user-specific changes needed
7. **Parameterize scripts** - Make them reusable
8. **Document scripts** - Clear descriptions and parameter docs

## Related Commands

- `/list-assets` - Find assets to run scripts on
- `/get-asset` - View asset details before running
- `/list-alerts` - Find alerts that may need remediation
- `/resolve-alert` - Resolve alerts after running scripts
- `/create-ticket` - Document script execution work
