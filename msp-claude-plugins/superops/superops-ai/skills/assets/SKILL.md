---
name: "SuperOps Assets"
description: >
  SuperOps.ai RMM asset inventory: asset status and platform enums, hardware,
  network, OS and association fields, software inventory, disk usage, patch
  status, activity history, and the GraphQL queries and script-execution
  mutations behind them. Includes health-check, patch-compliance, and
  software-audit workflows plus remote-action readiness checks.
when_to_use: >-
  When querying inventory, viewing asset details, running scripts, monitoring patches, or
  managing client/site associations in SuperOps.ai. Use when: superops asset, asset inventory,
  list assets superops, asset status, asset details, run script asset, patch status, software
  inventory, disk usage, asset activity, rmm superops, or endpoint management.
---

# SuperOps.ai Asset Management

## Overview

SuperOps.ai RMM provides comprehensive asset management capabilities. Assets represent managed endpoints (workstations, servers, network devices) with rich telemetry including hardware specs, software inventory, patch status, and activity history. This skill covers querying, managing, and automating actions on assets.

## Anti-triggers

- **Running or scheduling a script on an asset** — asset records tell
  you whether a target is online and what is installed; execution,
  batching, and exit codes are `superops-runbooks`.
- **An "asset" that is a documentation record** — in `hudu-assets` and
  `it-glue-configurations` an asset is a documented configuration item
  with no agent behind it. SuperOps assets are live RMM endpoints.
- **Endpoints under a different RMM** — `atera-agents`, `syncro-assets`,
  `ncentral-devices`, `immybot-endpoint-management`,
  `ninjaone-rmm-devices`, and `datto-rmm-devices` each see only their
  own fleet. Patch and software inventory counts are not comparable
  across them.
- **Hardware refresh and warranty programmes** — asset lifecycle
  planning is `scalepad-lifecycle-manager`.

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

Identity and state: `assetId`, `name`, `status`, `platform`, `lastSeen`,
`agentVersion`. Network: `ipAddress`, `macAddress`, `publicIp`, `hostname`.
Hardware: `manufacturer`, `model`, `serialNumber`, `processorName`,
`processorCores`, `totalMemory`, `totalDiskSpace`, `freeDiskSpace`. OS:
`osName`, `osVersion`, `osBuild`, `architecture`. Associations: `client`,
`site`, `tags`, `customFields`.

Memory and disk fields are `Long` values **in bytes** — convert before
displaying or comparing against percentage thresholds.

See [references/fields.md](references/fields.md) for the complete field reference.

## GraphQL Operations

| Operation | Type | Purpose |
|-----------|------|---------|
| `getAssetList` | query | List/filter assets; includes a `patchStatus` rollup per asset |
| `getAsset` | query | Full detail for one asset (hardware, OS, network, associations) |
| `getAssetSoftwareList` | query | Installed software, filterable by `name` substring |
| `getAssetDiskDetails` | query | Per-volume space and `usedPercentage` |
| `getAssetPatchDetails` | query | Patch list plus a `summary` counts block |
| `getAssetActivity` | query | Audit history of actions performed on the asset |
| `runScriptOnAsset` | mutation | Run a script on one asset with `arguments` and `runAs` |
| `runScriptOnAssets` | mutation | Bulk run across an `assetIds` array; returns a `batchId` |

List queries return a `listInfo` block (`totalCount`, `hasNextPage`,
`endCursor`) for cursor pagination; `first` sets the page size.

Filters support nested comparison objects, not just equality — e.g.
`"diskSpacePercentFree": { "lt": 10 }` and `"patchStatus": { "hasPending": true }`.

See [references/api.md](references/api.md) for the full operation catalog with
request shapes and variable examples.

## Common Workflows

### Asset Health Check

Query `getAssetList` filtered to `status: "Online"` with
`diskSpacePercentFree: { lt: 10 }` to surface endpoints running out of disk,
returning `freeDiskSpace`/`totalDiskSpace` alongside the client name.

### Patch Compliance Report

Query `getAssetList` filtered on `patchStatus: { hasPending: true, severity: ["Critical"] }`
and read the per-asset `patchStatus` rollup (`pendingCount`, `installedCount`,
`failedCount`, `lastScanDate`).

### Software Audit

Query `getAssetList` filtered on `software: { name: "..." }` to find every asset
with a given application installed — useful for license reconciliation and
removing unsanctioned remote-access tools.

See [references/api.md](references/api.md) for all three workflow queries.

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

A `status` of `Online` alone is not sufficient — the status field can lag a
dropped agent. Also check `lastSeen` freshness before dispatching a remote action:

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

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Create tickets for asset issues
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Asset-related alerts
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Automated scripts
- [SuperOps.ai Clients](../clients/SKILL.md) - Client associations
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
