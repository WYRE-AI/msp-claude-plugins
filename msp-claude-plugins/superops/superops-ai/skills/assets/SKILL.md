---
name: "SuperOps Assets"
description: >
  Use this skill when working with SuperOps.ai assets - querying inventory,
  viewing asset details, running scripts, monitoring patches, and managing
  client/site associations. Covers asset fields, statuses, software inventory,
  disk usage, and activity tracking through the RMM integration.
  Essential for MSP technicians managing endpoints through SuperOps.ai.
when_to_use: >-
  When querying inventory, viewing asset details, running scripts, monitoring patches, and
  managing client/site associations. Use when: superops asset, asset inventory, list assets
  superops, asset status, asset details, run script asset, patch status, software inventory, disk
  usage, asset activity, rmm superops, or endpoint management.
---

# SuperOps.ai Asset Management

## Overview

SuperOps.ai RMM provides comprehensive asset management capabilities. Assets represent managed endpoints (workstations, servers, network devices) with rich telemetry including hardware specs, software inventory, patch status, and activity history. This skill covers querying, managing, and automating actions on assets.

## Asset Status Values

| Status | Description | Indicator |
|--------|-------------|-----------|
| **Online** | Agent connected and reporting | Green |
| **Offline** | Agent not responding | Red |
| **Maintenance** | In maintenance mode | Yellow |

## Asset Platform Types

| Platform | Description |
|----------|-------------|
| **Windows** | Windows workstations and servers |
| **macOS** | Apple Mac computers |
| **Linux** | Linux distributions |

## Key Asset Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `assetId` | ID | Unique identifier |
| `name` | String | Computer/device name |
| `status` | Enum | Online, Offline, Maintenance |
| `platform` | Enum | Windows, macOS, Linux |
| `lastSeen` | DateTime | Last check-in time |
| `agentVersion` | String | RMM agent version |

### Network Fields

| Field | Type | Description |
|-------|------|-------------|
| `ipAddress` | String | Primary IP address |
| `macAddress` | String | MAC address |
| `publicIp` | String | External IP |
| `hostname` | String | Network hostname |

### Hardware Fields

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer` | String | Hardware manufacturer |
| `model` | String | Device model |
| `serialNumber` | String | Serial number |
| `processorName` | String | CPU model |
| `processorCores` | Int | CPU core count |
| `totalMemory` | Long | RAM in bytes |
| `totalDiskSpace` | Long | Total disk space |
| `freeDiskSpace` | Long | Available disk space |

### Operating System Fields

| Field | Type | Description |
|-------|------|-------------|
| `osName` | String | Operating system name |
| `osVersion` | String | OS version |
| `osBuild` | String | OS build number |
| `architecture` | String | 32-bit or 64-bit |

### Association Fields

| Field | Type | Description |
|-------|------|-------------|
| `client` | Client | Associated client |
| `site` | Site | Associated site |
| `tags` | [String] | Asset tags |
| `customFields` | [CustomField] | Custom field values |

## GraphQL Operations

### List Assets

```graphql
query getAssetList($input: ListInfoInput!) {
  getAssetList(input: $input) {
    assets {
      assetId
      name
      status
      platform
      lastSeen
      ipAddress
      osName
      osVersion
      client {
        accountId
        name
      }
      site {
        id
        name
      }
      patchStatus {
        pendingCount
        installedCount
        failedCount
      }
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

**Variables - All Online Assets:**
```json
{
  "input": {
    "first": 100,
    "filter": {
      "status": "Online"
    },
    "orderBy": {
      "field": "name",
      "direction": "ASC"
    }
  }
}
```

**Variables - Filter by Client and Platform:**
```json
{
  "input": {
    "first": 50,
    "filter": {
      "client": {
        "accountId": "client-uuid"
      },
      "platform": "Windows",
      "status": "Online"
    }
  }
}
```

### Get Asset Details

```graphql
query getAsset($input: AssetIdentifierInput!) {
  getAsset(input: $input) {
    assetId
    name
    status
    platform
    lastSeen

    # Network
    ipAddress
    macAddress
    publicIp
    hostname

    # Hardware
    manufacturer
    model
    serialNumber
    processorName
    processorCores
    totalMemory

    # OS
    osName
    osVersion
    osBuild
    architecture

    # Disk
    totalDiskSpace
    freeDiskSpace

    # Associations
    client {
      accountId
      name
    }
    site {
      id
      name
      address
    }
    tags
    customFields {
      name
      value
    }

    # Agent
    agentVersion
    agentInstallDate
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetId": "asset-uuid-here"
  }
}
```

### Get Asset Software List

```graphql
query getAssetSoftwareList($input: AssetSoftwareListInput!) {
  getAssetSoftwareList(input: $input) {
    software {
      name
      version
      publisher
      installDate
      size
    }
    listInfo {
      totalCount
      hasNextPage
      endCursor
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetId": "asset-uuid",
    "first": 100,
    "filter": {
      "name": "Microsoft"
    }
  }
}
```

### Get Asset Disk Details

```graphql
query getAssetDiskDetails($input: AssetIdentifierInput!) {
  getAssetDiskDetails(input: $input) {
    disks {
      driveLetter
      volumeName
      fileSystem
      totalSpace
      freeSpace
      usedPercentage
    }
  }
}
```

### Get Asset Patch Details

```graphql
query getAssetPatchDetails($input: AssetPatchInput!) {
  getAssetPatchDetails(input: $input) {
    patches {
      patchId
      title
      severity
      status
      releaseDate
      kbNumber
      category
    }
    summary {
      pendingCount
      installedCount
      failedCount
      lastScanDate
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetId": "asset-uuid",
    "filter": {
      "status": "Pending",
      "severity": ["Critical", "Important"]
    }
  }
}
```

### Get Asset Activity

```graphql
query getAssetActivity($input: AssetActivityInput!) {
  getAssetActivity(input: $input) {
    activities {
      activityId
      type
      description
      timestamp
      performedBy {
        id
        name
      }
      result
    }
    listInfo {
      totalCount
      hasNextPage
    }
  }
}
```

### Run Script on Asset

```graphql
mutation runScriptOnAsset($input: RunScriptInput!) {
  runScriptOnAsset(input: $input) {
    actionConfigId
    script {
      scriptId
      name
    }
    arguments {
      name
      value
    }
    status
    scheduledTime
  }
}
```

**Variables:**
```json
{
  "input": {
    "assetId": "asset-uuid",
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

### Bulk Script Execution

```graphql
mutation runScriptOnAssets($input: RunScriptOnAssetsInput!) {
  runScriptOnAssets(input: $input) {
    batchId
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
    "runAs": "System"
  }
}
```

## Common Workflows

### Asset Health Check

```graphql
# Query assets with low disk space
query getLowDiskAssets($input: ListInfoInput!) {
  getAssetList(input: $input) {
    assets {
      assetId
      name
      freeDiskSpace
      totalDiskSpace
      client { name }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "filter": {
      "status": "Online",
      "diskSpacePercentFree": {
        "lt": 10
      }
    }
  }
}
```

### Patch Compliance Report

```graphql
query getPatchCompliance($input: ListInfoInput!) {
  getAssetList(input: $input) {
    assets {
      assetId
      name
      client { name }
      patchStatus {
        pendingCount
        installedCount
        failedCount
        lastScanDate
      }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "filter": {
      "patchStatus": {
        "hasPending": true,
        "severity": ["Critical"]
      }
    }
  }
}
```

### Software Audit

```graphql
# Find assets with specific software
query findAssetsWithSoftware($input: ListInfoInput!) {
  getAssetList(input: $input) {
    assets {
      assetId
      name
      client { name }
    }
  }
}
```

Variables:
```json
{
  "input": {
    "filter": {
      "software": {
        "name": "TeamViewer"
      }
    }
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Asset not found | Invalid asset ID | Verify asset exists |
| Asset offline | Agent not responding | Check network connectivity |
| Script failed | Execution error | Check script logs |
| Permission denied | Insufficient access | Check user permissions |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Asset Status Checks

```javascript
// Check if asset is available for remote actions
function canRunRemoteAction(asset) {
  if (asset.status !== 'Online') {
    return {
      canRun: false,
      reason: `Asset is ${asset.status}. Last seen: ${asset.lastSeen}`
    };
  }

  const lastSeenMinutes = (Date.now() - new Date(asset.lastSeen)) / 60000;
  if (lastSeenMinutes > 5) {
    return {
      canRun: false,
      reason: `Asset hasn't checked in for ${Math.round(lastSeenMinutes)} minutes`
    };
  }

  return { canRun: true };
}
```

## Best Practices

1. **Filter queries** - Always use filters to limit result sets
2. **Check status first** - Verify asset is online before running scripts
3. **Use pagination** - Handle large asset lists with cursor pagination
4. **Cache static data** - Cache client/site associations locally
5. **Monitor execution** - Track script execution results
6. **Set appropriate timeouts** - Long-running scripts need adequate timeouts
7. **Log activities** - Document remote actions for audit trails

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Create tickets for asset issues
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Asset-related alerts
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Automated scripts
- [SuperOps.ai Clients](../clients/SKILL.md) - Client associations
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
