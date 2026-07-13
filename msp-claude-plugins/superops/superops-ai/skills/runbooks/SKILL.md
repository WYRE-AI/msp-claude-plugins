---
name: "SuperOps Runbooks"
description: >
  Use this skill when working with SuperOps.ai runbooks and scripts - listing,
  executing, monitoring, and managing automated scripts on assets. Covers script
  types, execution parameters, scheduling, and result handling.
  Essential for MSP automation through SuperOps.ai RMM.
when_to_use: >-
  When listing, executing, monitoring, and managing automated scripts on assets. Use when:
  superops runbook, superops script, run script superops, execute script, automation superops,
  script execution, runbook execution, script status, bulk script, or scheduled script.
---

# SuperOps.ai Runbook & Script Management

## Overview

SuperOps.ai provides powerful automation through scripts (runbooks) that can be executed on managed assets. Scripts can perform maintenance tasks, remediation actions, data collection, and custom automation. This skill covers script discovery, execution, scheduling, and result monitoring.

## Script Types

| Type | Description | Use Case |
|------|-------------|----------|
| **PowerShell** | Windows PowerShell scripts | Windows automation |
| **Batch** | Windows batch scripts | Simple Windows tasks |
| **Bash** | Unix shell scripts | macOS/Linux automation |
| **Python** | Python scripts | Cross-platform automation |

## Run As Options

| Option | Description | When to Use |
|--------|-------------|-------------|
| **System** | Run as SYSTEM account | Admin tasks, service management |
| **Logged-in User** | Current user context | User-specific tasks |
| **Specific User** | Custom credentials | Specific permission needs |

## Execution Priority

| Priority | Description |
|----------|-------------|
| **Immediate** | Execute as soon as possible |
| **Normal** | Standard queue priority |
| **Low** | Execute during low activity |

## Key Script Fields

### Script Definition Fields

| Field | Type | Description |
|-------|------|-------------|
| `scriptId` | ID | Unique identifier |
| `name` | String | Script name |
| `description` | String | What the script does |
| `type` | Enum | PowerShell, Batch, Bash, Python |
| `content` | String | Script source code |
| `parameters` | [Parameter] | Input parameters |
| `timeout` | Int | Execution timeout (seconds) |
| `osType` | Enum | Windows, macOS, Linux |

### Execution Fields

| Field | Type | Description |
|-------|------|-------------|
| `actionConfigId` | ID | Execution instance ID |
| `status` | Enum | Pending, Running, Success, Failed |
| `startTime` | DateTime | Execution start |
| `endTime` | DateTime | Execution end |
| `exitCode` | Int | Script exit code |
| `output` | String | Script output |
| `error` | String | Error messages |

## GraphQL Operations

### List Available Scripts

```graphql
query getScriptList($input: ListInfoInput!) {
  getScriptList(input: $input) {
    scripts {
      scriptId
      name
      description
      type
      osType
      category
      parameters {
        name
        description
        type
        required
        defaultValue
      }
      createdTime
      lastModifiedTime
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

**Variables - All Scripts:**
```json
{
  "input": {
    "first": 50,
    "orderBy": {
      "field": "name",
      "direction": "ASC"
    }
  }
}
```

**Variables - Windows PowerShell Scripts:**
```json
{
  "input": {
    "filter": {
      "osType": "Windows",
      "type": "PowerShell"
    }
  }
}
```

### Get Scripts by OS Type

```graphql
query getScriptListByType($input: ScriptListByTypeInput!) {
  getScriptListByType(input: $input) {
    scripts {
      scriptId
      name
      description
      type
      parameters {
        name
        type
        required
      }
    }
    listInfo {
      totalCount
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "osType": "Windows",
    "first": 100
  }
}
```

### Get Script Details

```graphql
query getScript($input: ScriptIdentifierInput!) {
  getScript(input: $input) {
    scriptId
    name
    description
    type
    osType
    category
    content
    timeout
    parameters {
      name
      description
      type
      required
      defaultValue
      validValues
    }
    runAs
    createdBy {
      id
      name
    }
    createdTime
    lastModifiedTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "scriptId": "script-uuid"
  }
}
```

### Run Script on Single Asset

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

**Variables - Immediate Execution:**
```json
{
  "input": {
    "assetId": "asset-uuid",
    "scriptId": "script-uuid",
    "runAs": "System",
    "priority": "Immediate"
  }
}
```

**Variables - With Parameters:**
```json
{
  "input": {
    "assetId": "asset-uuid",
    "scriptId": "script-uuid",
    "arguments": [
      {
        "name": "ServiceName",
        "value": "Spooler"
      },
      {
        "name": "Action",
        "value": "Restart"
      }
    ],
    "runAs": "System",
    "priority": "Normal"
  }
}
```

### Run Script on Multiple Assets

```graphql
mutation runScriptOnAssets($input: RunScriptOnAssetsInput!) {
  runScriptOnAssets(input: $input) {
    batchId
    script {
      scriptId
      name
    }
    assetsCount
    status
    scheduledTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetIds": ["asset-1", "asset-2", "asset-3"],
    "scriptId": "script-uuid",
    "arguments": [
      {
        "name": "param1",
        "value": "value1"
      }
    ],
    "runAs": "System",
    "priority": "Normal"
  }
}
```

### Schedule Script Execution

```graphql
mutation scheduleScript($input: ScheduleScriptInput!) {
  scheduleScript(input: $input) {
    scheduleId
    script {
      scriptId
      name
    }
    assets {
      assetId
      name
    }
    scheduledTime
    recurrence {
      type
      interval
      daysOfWeek
    }
    status
  }
}
```

**Variables - One-Time Schedule:**
```json
{
  "input": {
    "assetIds": ["asset-uuid"],
    "scriptId": "script-uuid",
    "scheduledTime": "2024-02-15T22:00:00Z",
    "runAs": "System"
  }
}
```

**Variables - Recurring Schedule:**
```json
{
  "input": {
    "assetIds": ["asset-uuid"],
    "scriptId": "script-uuid",
    "scheduledTime": "2024-02-15T22:00:00Z",
    "recurrence": {
      "type": "Weekly",
      "interval": 1,
      "daysOfWeek": ["Monday", "Wednesday", "Friday"]
    },
    "runAs": "System"
  }
}
```

### Get Script Execution Status

```graphql
query getScriptExecution($input: ScriptExecutionInput!) {
  getScriptExecution(input: $input) {
    actionConfigId
    script {
      scriptId
      name
    }
    asset {
      assetId
      name
    }
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
    "actionConfigId": "execution-uuid"
  }
}
```

### Get Batch Execution Results

```graphql
query getBatchExecution($input: BatchExecutionInput!) {
  getBatchExecution(input: $input) {
    batchId
    script {
      scriptId
      name
    }
    status
    totalAssets
    completedCount
    successCount
    failedCount
    executions {
      asset {
        assetId
        name
      }
      status
      exitCode
      output
      error
    }
  }
}
```

### List Script Execution History

```graphql
query getScriptExecutionHistory($input: ScriptExecutionHistoryInput!) {
  getScriptExecutionHistory(input: $input) {
    executions {
      actionConfigId
      script {
        scriptId
        name
      }
      asset {
        assetId
        name
        client { name }
      }
      status
      startTime
      endTime
      exitCode
      triggeredBy {
        id
        name
      }
    }
    listInfo {
      totalCount
      hasNextPage
    }
  }
}
```

**Variables - Recent Executions:**
```json
{
  "input": {
    "first": 50,
    "orderBy": {
      "field": "startTime",
      "direction": "DESC"
    }
  }
}
```

**Variables - By Asset:**
```json
{
  "input": {
    "filter": {
      "assetId": "asset-uuid"
    },
    "first": 20
  }
}
```

## Common Workflows

### Remediation Workflow

```graphql
# 1. Check if asset is online
query checkAssetStatus {
  getAsset(input: { assetId: "asset-uuid" }) {
    status
    lastSeen
  }
}

# 2. Run remediation script
mutation runRemediation {
  runScriptOnAsset(input: {
    assetId: "asset-uuid",
    scriptId: "restart-service-script",
    arguments: [{ name: "ServiceName", value: "Spooler" }],
    runAs: "System",
    priority: "Immediate"
  }) {
    actionConfigId
    status
  }
}

# 3. Check execution result
query checkResult {
  getScriptExecution(input: { actionConfigId: "exec-uuid" }) {
    status
    exitCode
    output
    error
  }
}
```

### Maintenance Window Automation

```graphql
# Schedule maintenance scripts for multiple assets
mutation scheduleMaintenanceWindow {
  runScriptOnAssets(input: {
    assetIds: ["asset-1", "asset-2", "asset-3"],
    scriptId: "windows-update-script",
    scheduledTime: "2024-02-17T02:00:00Z",
    runAs: "System",
    priority: "Low"
  }) {
    batchId
    assetsCount
    scheduledTime
  }
}
```

### Data Collection Workflow

```graphql
# Run inventory collection across client assets
mutation collectInventory($clientId: ID!) {
  # First get all assets for client
  assets: getAssetList(input: {
    filter: {
      client: { accountId: $clientId },
      status: "Online"
    }
  }) {
    assets { assetId }
  }
}

# Then run collection script
mutation runCollection {
  runScriptOnAssets(input: {
    assetIds: ["asset-1", "asset-2"],
    scriptId: "software-inventory-script",
    runAs: "System"
  }) {
    batchId
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Script not found | Invalid script ID | Verify script exists |
| Asset offline | Cannot reach asset | Wait for asset to come online |
| Timeout exceeded | Script ran too long | Increase timeout or optimize script |
| Permission denied | Insufficient RunAs rights | Check execution context |
| Parameter missing | Required param not provided | Add required arguments |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Exit Code Interpretation

```javascript
// Common exit codes
const EXIT_CODES = {
  0: 'Success',
  1: 'General error',
  2: 'Misuse of command',
  126: 'Permission denied',
  127: 'Command not found',
  128: 'Invalid exit argument',
  130: 'Script terminated (Ctrl+C)',
  137: 'Script killed (timeout)',
  255: 'Exit status out of range'
};

function interpretExitCode(code) {
  return EXIT_CODES[code] || `Unknown exit code: ${code}`;
}
```

### Execution Status Handling

```javascript
// Poll for execution completion
async function waitForExecution(actionConfigId, maxWaitMs = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getScriptExecution({ actionConfigId });

    if (['Success', 'Failed', 'Timeout', 'Cancelled'].includes(result.status)) {
      return result;
    }

    await sleep(pollInterval);
  }

  throw new Error('Execution timed out waiting for completion');
}
```

## Best Practices

1. **Test scripts first** - Test on a single asset before bulk execution
2. **Use parameters** - Make scripts reusable with parameters
3. **Set appropriate timeouts** - Prevent hung scripts
4. **Handle errors in scripts** - Return meaningful exit codes
5. **Log script output** - Capture output for troubleshooting
6. **Use scheduling** - Run maintenance during off-hours
7. **Monitor batch executions** - Track success/failure rates
8. **Document scripts** - Clear descriptions and parameter docs
9. **Version control** - Track script changes
10. **Check asset status** - Verify online before running

## Related Skills

- [SuperOps.ai Assets](../assets/SKILL.md) - Asset details
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert-triggered automation
- [SuperOps.ai Tickets](../tickets/SKILL.md) - Ticket-based automation
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
