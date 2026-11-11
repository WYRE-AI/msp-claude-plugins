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
  `itglue-configurations` an asset is a documented configuration item
  with no agent behind it. SuperOps assets are live RMM endpoints.
- **Endpoints under a different RMM** — `atera-agents`, `syncro-assets`,
  `ncentral-devices`, `immybot-endpoint-management`,
  `ninjaone-devices`, and `datto-rmm-devices` each see only their
  own fleet. Patch and software inventory counts are not comparable
  across them.
- **Hardware refresh and warranty programmes** — asset lifecycle
  planning is `scalepad-lifecycle-manager`.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `superops_assets_list` | read | List assets |
| `superops_assets_get` | read | One asset |
| `superops_assets_software` | read | Installed software on an asset |
| `superops_assets_patches` | read | Patch status for an asset |

Anything without a typed tool goes through `superops_custom_query` (admin tier; send query documents only, since the tool does not stop a mutation) or `superops_custom_mutation` (arbitrary GraphQL mutation); both are `admin` tier and need human approval. The GraphQL examples in this skill show what those passthrough calls send.

## Asset Status Values

`status` is a plain `String`. The values observed live are `ONLINE` and
`OFFLINE`, and filters match them without regard to case.

| Status | Description |
|--------|-------------|
| **ONLINE** | Agent connected and reporting |
| **OFFLINE** | Agent not responding |

## Asset Platform Types

| Platform | Description |
|----------|-------------|
| **Windows** | Windows workstations and servers |
| **macOS** | Apple Mac computers |
| **Linux** | Linux distributions |

## Key Asset Fields

In the published schema an `Asset` carries `assetId`, `name`, `status`,
`platform`, `platformVersion`, `agentVersion`, `lastCommunicatedTime`,
`hostName`, `publicIp`, `primaryMac`, `manufacturer`, `model`,
`serialNumber`, `loggedInUser` and `patchStatus` (a `String`). `client`, `site`,
`assetClass` and `requester` are `JSON` scalars, and `customFields(fields: [...])`
returns `JSON`: select them by name only, with no nested field selection. Disk
and patch detail come from `getAssetDiskDetails` and `getAssetPatchDetails`.

See [references/fields.md](references/fields.md) for the complete field reference.

## GraphQL Operations

| Operation | Type | Purpose |
|-----------|------|---------|
| `getAssetList` | query | List/filter assets; includes a `patchStatus` rollup per asset |
| `getAsset` | query | Full detail for one asset (hardware, OS, network, associations) |
| `getAssetSoftwareList` | query | Installed software. `superops_assets_software` filters it on `software.name` |
| `getAssetSummary` | query | CPU, memory, disk totals and interfaces for one asset |
| `getAssetDiskDetails` | query | Per-volume `size`, `freeSize` and `driveUsage` (all `JSON`) |
| `getAssetPatchDetails` | query | Per-patch detail, approval and installation status |
| `getAssetActivity` | query | Activity recorded against the asset |
| `runScriptOnAsset` | mutation | Run a script on one asset (`input: RunScriptInput!`) |

There is no bulk script mutation, so run `runScriptOnAsset` once per asset. List
queries take `input: ListInfoInput!` (`page`, `pageSize`, `condition`, `sort`) and
return `listInfo` (`page`, `pageSize`, `hasMore`, `totalCount`). `hasMore` is
`null`, not `false`, on the last page.

See [references/api.md](references/api.md) for the documents and variables.
Every example there validates against the schema.

## Common Workflows

### Asset Health Check

No list query filters on disk space. List the client's online assets with
`superops_assets_list` (`status: "ONLINE"`, `clientId`). Then read each one's
`getAssetDiskDetails` or `getAssetSummary` through `superops_custom_query`, and
compare the free-space figures yourself.

### Patch Compliance Report

Read the per-asset `patchStatus` string from `superops_assets_list`. Then call
`superops_assets_patches` (`installationStatus: "NewOrMissing"`) for the assets
that need detail. `patchStatus` is a plain string, not a rollup object.

### Software Audit

`software` is not an asset-list attribute. List the client's assets, then call
`superops_assets_software` with `search` set to the application name for each
asset. This is useful for license reconciliation and for removing unsanctioned
remote-access tools.

See [references/api.md](references/api.md) for all three workflows.

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
dropped agent. Also check `lastCommunicatedTime` freshness before dispatching a remote action, and refuse when it is missing or unparseable:

```javascript
// Check if asset is available for remote actions
function canRunRemoteAction(asset) {
  if (typeof asset.status !== 'string' || asset.status.toLowerCase() !== 'online') {
    return {
      canRun: false,
      reason: `Asset is ${asset.status}. Last communicated: ${asset.lastCommunicatedTime}`
    };
  }

  const last = Date.parse(asset.lastCommunicatedTime ?? '');
  if (Number.isNaN(last)) {
    return { canRun: false, reason: 'No valid lastCommunicatedTime on the asset' };
  }
  const lastSeenMinutes = (Date.now() - last) / 60000;
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
3. **Use pagination** - Page large asset lists with `page` and `pageSize` in `ListInfoInput`, and keep going while `listInfo.hasMore` is true
4. **Cache static data** - Cache client/site associations locally
5. **Monitor execution** - Track script execution results
6. **Set appropriate timeouts** - Long-running scripts need adequate timeouts

## Related Skills

- [SuperOps.ai Tickets](../tickets/SKILL.md) - Create tickets for asset issues
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Asset-related alerts
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Automated scripts
- [SuperOps.ai Clients](../clients/SKILL.md) - Client associations
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
