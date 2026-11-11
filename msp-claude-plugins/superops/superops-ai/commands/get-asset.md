---
description: Get detailed asset information including hardware, software, and alerts
argument-hint: "[asset_id] [query] [client_id] [include_software] [include_alerts]"
arguments: [asset_id, query, client_id, include_software, include_alerts]
---

# Get SuperOps.ai Asset Details

Get an asset's identity, platform, network and hardware details. Optionally add
its installed software and its alerts.

## How this runs through Conduit

| Step | Tool | Tier |
|------|------|------|
| Find the asset | `superops_assets_list` | read |
| Asset record | `superops_assets_get` | read |
| Installed software | `superops_assets_software` | read |
| CPU, memory and disk | `superops_custom_query` with `getAssetSummary` | admin |
| Alerts | `superops_custom_query` with `getAlertsForAsset` | admin |

The admin-tier steps need a human approver. Skip them if the operator has no
`admin` grant on SuperOps, and say what was left out.

## Steps

1. **Resolve the asset.** With `asset_id`, go straight to step 2. With `query`,
   page through `superops_assets_list` (filtered by `clientId` if given) and match
   `name` or `hostName`. If several assets match, list them and ask which one.

2. **Read the asset.** Call `superops_assets_get` with `{ "assetId": "<asset_id>" }`.
   It returns `name`, `hostName`, `status`, `platform`, `platformVersion`,
   `manufacturer`, `model`, `serialNumber`, `publicIp`, `primaryMac`, `gateway`,
   `domain`, `loggedInUser`, `agentVersion`, `patchStatus`, `lastCommunicatedTime`
   and the `client`/`site` JSON.

3. **Hardware figures (optional).** The asset record has no CPU, memory or disk
   fields. Read them through `superops_custom_query`:

   ```graphql
   query getAssetSummary($input: AssetIdentifierInput!) {
     getAssetSummary(input: $input) {
       cpu { cpuName physicalCore logicalCore architecture }
       memory { totalMemory availableMemory }
       disk { totalSize totalFreeSpace }
     }
   }
   ```

   ```json
   { "input": { "assetId": "<asset_id>" } }
   ```

4. **Software (if `include_software`).** Call `superops_assets_software` with
   `assetId`. It returns `software` (JSON), `version`, `installedDate`,
   `bitVersion` and `installedPath`, paged.

5. **Alerts (if `include_alerts`).** Send this through `superops_custom_query`:

   ```graphql
   query getAlertsForAsset($input: AssetDetailsListInput!) {
     getAlertsForAsset(input: $input) {
       alerts { id message severity status createdTime resolvedTime }
       listInfo { page pageSize totalCount hasMore }
     }
   }
   ```

   ```json
   { "input": { "assetId": "<asset_id>", "listInfo": { "page": 1, "pageSize": 25 } } }
   ```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| asset_id | string | No* | - | Asset ID |
| query | string | No* | - | Asset name or host name to match |
| client_id | string | No | - | Narrow the name search to one client |
| include_software | boolean | No | false | Add installed software |
| include_alerts | boolean | No | false | Add alerts (admin tier) |

*Either `asset_id` or `query` is required.

## Examples

```
/get-asset 1182
/get-asset --query "ACME-WS-001" --client_id 5501
/get-asset 1182 --include_software true --include_alerts true
```

## Output

```
ACME-DC01 (asset 1182) - ONLINE, last check-in just now
  Client: Acme Corporation / Main Office
  Platform: Microsoft Windows Server 2022 Datacenter (10.0.20348)
  Hardware: Dell Inc. PowerEdge R740, serial ABC1234567
  CPU: Intel Xeon Gold 6230, 20 cores / Memory: 64 GB
  Network: public 203.0.113.50, MAC 00:1A:2B:3C:4D:5E, domain acme.local
  Agent: 3.5.2 / Patch status: Up to date
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Asset not found | Check the ID, or search with `query` |
| Several matches | Show them and ask which one |
| No `admin` grant | Return the typed-tool data, and say the hardware and alert sections were skipped |
| Rate limited | Wait and retry (800 req/min limit) |

## Related Commands

- `/list-assets` - List and filter assets
- `/list-alerts` - Alerts for this asset
- `/run-script` - Run a script on this asset
- `/create-ticket` - Create a ticket for an asset issue
