# SuperOps.ai Asset Operations

Every GraphQL document on this page validates against `schema/superops.graphql`
in [superops-mcp](https://github.com/WYRE-AI/superops-mcp) and uses only
operations listed in the published API reference at
<https://developer.superops.com/msp>.

Start with the typed tools. They send the same GraphQL as the sidecar and need no
admin approval. Use `superops_custom_query` (admin tier, human approval) only for
the reads that have no typed tool.

## Typed tools

| Tool | GraphQL it sends | Arguments |
|------|------------------|-----------|
| `superops_assets_list` | `getAssetList(input: ListInfoInput!)` | `status`, `platform`, `clientId`, `page`, `pageSize` |
| `superops_assets_get` | `getAsset(input: { assetId })` | `assetId` |
| `superops_assets_software` | `getAssetSoftwareList(input: AssetDetailsListInput!)` | `assetId`, `search`, `page`, `pageSize` |
| `superops_assets_patches` | `getAssetPatchDetails(input: AssetDetailsListInput!)` | `assetId`, `installationStatus`, `severity`, `page`, `pageSize` |

```json
{ "tool": "superops_assets_list", "arguments": { "status": "ONLINE", "platform": "Windows", "clientId": "<account id>", "pageSize": 100 } }
```

- `status` is matched whole and without case. Observed values are `ONLINE` and
  `OFFLINE`.
- `platform` is a substring match. SuperOps stores the full OS name, such as
  `Microsoft Windows 10 Pro`, so pass a fragment like `Windows` or `darwin`.
- `clientId` is the `accountId` inside an asset's `client` JSON.
- When there are several filters, an asset must match all of them.
- `listInfo.hasMore` is `true` while another page exists and `null` on the last
  page. It is never `false`.

## Fields

`Asset` has these fields: `assetId`, `name`, `hostName`, `status`, `platform`,
`platformFamily`, `platformCategory`, `platformVersion`, `manufacturer`, `model`,
`serialNumber`, `primaryMac`, `publicIp`, `gateway`, `domain`, `loggedInUser`,
`sysUptime`, `agentVersion`, `patchStatus`, `warrantyExpiryDate`, `purchasedDate`,
`lastCommunicatedTime`, `lastReportedTime`, `lifecycleState`, `createdTime` and
`updatedTime`. These fields are `JSON` scalars: `client`, `site`, `requester`,
`assetClass`, `deviceCategory` and `customFields`. Select a JSON field by name
with no sub-selection, or the API rejects the whole request.

An asset has no `ipAddress`, `macAddress`, `osVersion`, `lastSeen`, `tags`, CPU,
memory or disk field. Use `publicIp`, `primaryMac`, `platformVersion` and
`lastCommunicatedTime` instead. The two queries below return hardware figures.

## Hardware summary (custom query)

`getAssetSummary` returns CPU, memory, disk totals, network interfaces and the
last logged-in user.

```graphql
query getAssetSummary($input: AssetIdentifierInput!) {
  getAssetSummary(input: $input) {
    cpu {
      cpuName
      physicalCore
      logicalCore
      architecture
      cpuUsage
    }
    memory {
      totalMemory
      usedMemory
      availableMemory
      memoryUsage
    }
    disk {
      totalSize
      totalFreeSpace
    }
  }
}
```

```json
{ "input": { "assetId": "<asset id>" } }
```

## Disk details (custom query)

```graphql
query getAssetDiskDetails($input: AssetIdentifierInput!) {
  getAssetDiskDetails(input: $input) {
    drive
    fileSystem
    size
    freeSize
    driveUsage
  }
}
```

`size`, `freeSize` and `driveUsage` are `JSON`. Read the values from a response
before you compare them against a threshold.

## Activity log (custom query)

```graphql
query getAssetActivity($input: AssetDetailsListInput!) {
  getAssetActivity(input: $input) {
    activities {
      activityId
      module
      activityType
      activityData
      createdBy
      createdTime
    }
    listInfo {
      page
      pageSize
      totalCount
      hasMore
    }
  }
}
```

```json
{ "input": { "assetId": "<asset id>", "listInfo": { "page": 1, "pageSize": 25 } } }
```

## Alerts on an asset

See [the alerts reference](../../alerts/references/api.md) for
`getAlertsForAsset`.

## Running a script

`runScriptOnAsset` runs one script on one asset. The schema has no bulk or
scheduled variant. See [the runbooks reference](../../runbooks/references/api.md).

## Workflows

### Asset health check

1. Call `superops_assets_list` with `status: "ONLINE"` and the client's
   `clientId` to list the client's online assets.
2. For each asset, send `getAssetDiskDetails` or `getAssetSummary` through
   `superops_custom_query`.
3. Compare the free-space figures yourself. No list query filters on disk space.

### Patch compliance report

1. Call `superops_assets_list` for the client. Each row carries `patchStatus`, a
   plain string.
2. For the assets that need detail, call `superops_assets_patches`. Use
   `installationStatus: "NewOrMissing"` for the outstanding patches.

### Software audit

`software` is not an asset-list attribute. To find which assets have an
application installed:

1. Call `superops_assets_list` for the client.
2. For each asset, call `superops_assets_software` with `search` set to the
   application name. The tool filters on `software.name` with `contains`.
