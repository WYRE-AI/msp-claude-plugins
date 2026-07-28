# SuperOps.ai Asset GraphQL Operations

## List Assets

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

## Get Asset Details

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

## Get Asset Software List

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

## Get Asset Disk Details

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

## Get Asset Patch Details

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

## Get Asset Activity

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

## Run Script on Asset

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

## Bulk Script Execution

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

## Workflow Examples

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
