# SuperOps.ai Runbook & Script GraphQL Operations

Complete operation catalog for script discovery, execution, scheduling, and results.

## List Available Scripts

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

## Get Scripts by OS Type

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

## Get Script Details

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

## Run Script on Single Asset

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

## Run Script on Multiple Assets

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

## Schedule Script Execution

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

## Get Script Execution Status

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

## Get Batch Execution Results

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

## List Script Execution History

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

## Workflow Examples

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
