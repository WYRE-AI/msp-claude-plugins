---
description: Execute a PowerShell script on an Atera agent
argument-hint: "<agent_id> [script] [script_id] [run_as] [timeout]"
arguments: [agent_id, script, script_id, run_as, timeout]
---

# Run PowerShell on Atera Agent

Execute a PowerShell script on a specific Atera agent (endpoint) either inline or from the script library.

## Prerequisites

- Valid Atera API key configured
- Agent must exist and be online
- User must have script execution permissions
- Either `script` or `script_id` must be provided

## Steps

1. **Validate agent exists and is online**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/agents/{agent_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Check agent exists
   - Verify agent is online
   - Capture device info for output

2. **Get script content if using script_id**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/customscripts/{script_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Validate script exists
   - Show script name for confirmation

3. **Execute the script**
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/agents/{agent_id}/runpowershell" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "Script": "<script_content>",
       "RunAs": "<run_as>",
       "Timeout": <timeout>
     }'
   ```
   - Capture execution ID for status polling

4. **Poll for completion**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/agents/{agent_id}/powershellstatus/{execution_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Poll every 5 seconds
   - Respect timeout parameter
   - Capture output when complete

5. **Return execution results**
   - Execution status
   - Script output (stdout)
   - Error output (stderr)
   - Execution duration

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| agent_id | integer | Yes | - | The agent ID to execute on |
| script | string | No* | - | Inline PowerShell script |
| script_id | integer | No* | - | Saved script ID from library |
| run_as | string | No | System | System or LoggedOnUser |
| timeout | integer | No | 300 | Timeout in seconds |

*Either `script` or `script_id` is required

## Examples

### Simple Inline Script

```
/run-powershell 12345 --script "Get-Process | Select-Object -First 10"
```

### Script from Library

```
/run-powershell 12345 --script_id 567
```

### Run as Logged-On User

```
/run-powershell 12345 --script_id 567 --run_as LoggedOnUser
```

### Complex Script with Timeout

```
/run-powershell 12345 --script "Get-Process | Where-Object {$_.CPU -gt 100}" --timeout 60
```

### Service Management

```
/run-powershell 12345 --script "Restart-Service Spooler" --timeout 60
```

### Disk Cleanup Script

```
/run-powershell 12345 --script "Get-ChildItem 'C:\Windows\Temp' -Recurse | Remove-Item -Force -Recurse" --run_as System
```

## Output

### Successful Execution

```
PowerShell Execution Complete

Agent: DESKTOP-ABC123 (ID: 12345)
Customer: Acme Corporation
Run As: System
Duration: 3.2 seconds

Output:
-------
Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
    354      23    12456      18776       2.45   1234   1 chrome
    189      15     8234      12456       1.23   5678   1 explorer
    ...

Exit Code: 0
```

### Script with Errors

```
PowerShell Execution Complete

Agent: DESKTOP-ABC123 (ID: 12345)
Customer: Acme Corporation
Run As: System
Duration: 1.5 seconds

Output:
-------
(none)

Errors:
-------
Get-Process : Cannot find a process with the name "NonExistentProcess".
At line:1 char:1
+ Get-Process NonExistentProcess
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : ObjectNotFound

Exit Code: 1
```

### Using Script from Library

```
PowerShell Execution Initiated

Agent: DESKTOP-ABC123 (ID: 12345)
Customer: Acme Corporation
Script: Disk Cleanup Utility (ID: 567)
Run As: System
Timeout: 300 seconds

Polling for completion...
[=========>          ] 45% complete

Execution Complete!
Duration: 45.3 seconds

Output:
-------
Cleaned 2.5 GB from C:\Windows\Temp
Cleaned 1.2 GB from C:\Users\*\AppData\Local\Temp
Total freed: 3.7 GB

Exit Code: 0
```

## Error Handling

### Agent Not Found

```
Agent not found: 12345

Please verify the agent ID and try again.
Use /search-agents to find valid agent IDs.
```

### Agent Offline

```
Agent is offline: DESKTOP-ABC123 (ID: 12345)

Last seen: 2026-02-03 18:45:00 (16 hours ago)

PowerShell cannot be executed on offline agents.
Wait for the agent to come online or try a different device.
```

### Script Not Provided

```
No script specified

Please provide either:
--script "Get-Process"     (inline script)
--script_id 567            (script from library)
```

### Script Not Found

```
Script not found in library: 999

Use the Atera portal to view available scripts,
or provide an inline script with --script.
```

### Execution Timeout

```
Script execution timed out after 300 seconds

Agent: DESKTOP-ABC123 (ID: 12345)
Execution ID: abc123

The script may still be running on the agent.
Check the Atera portal for status updates.
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

### Output Truncated

```
PowerShell Execution Complete

Agent: DESKTOP-ABC123 (ID: 12345)
Duration: 12.5 seconds

Output (truncated - exceeded 100KB limit):
-------
[First 100KB of output shown]
...

Full output available in Atera portal.
Exit Code: 0
```

## API Patterns

### Get Agent Status
```http
GET /api/v3/agents/{agentId}
X-API-KEY: {api_key}
```

### Execute PowerShell
```http
POST /api/v3/agents/{agentId}/runpowershell
X-API-KEY: {api_key}
Content-Type: application/json

{
  "Script": "Get-Process | Select-Object -First 10",
  "RunAs": "System",
  "Timeout": 300
}
```

### Check Execution Status
```http
GET /api/v3/agents/{agentId}/powershellstatus/{executionId}
X-API-KEY: {api_key}
```

### List Custom Scripts
```http
GET /api/v3/customscripts
X-API-KEY: {api_key}
```

## Security Notes

- Scripts run with elevated privileges when using `System` context
- Review scripts carefully before execution
- Use script library for audited, approved scripts
- Consider logging script executions for compliance
- Maximum script output is 100KB

## Related Commands

- `/search-agents` - Search for RMM agents
- `/list-alerts` - View agent alerts
- `/create-ticket` - Document script execution
