# SuperOps.ai Asset Field Reference

These tables list the fields on the `Asset` type in `schema/superops.graphql`
([superops-mcp](https://github.com/WYRE-AI/superops-mcp)). Every value-bearing
field is a `String`, not an enum.

## Identity and status

| Field | Type | Description |
|-------|------|-------------|
| `assetId` | ID | Asset ID |
| `name` | String | Device name |
| `hostName` | String | Network host name |
| `status` | String | Observed values are `ONLINE` and `OFFLINE` |
| `lastCommunicatedTime` | String | Last agent check-in |
| `lastReportedTime` | String | Last inventory report |
| `agentVersion` | String | RMM agent version |
| `lifecycleState` | String | Lifecycle state |
| `createdTime` / `updatedTime` | String | Record timestamps |

## Platform

| Field | Type | Description |
|-------|------|-------------|
| `platform` | String | Full OS name, such as `Microsoft Windows 10 Pro` |
| `platformFamily` | String | OS family |
| `platformCategory` | String | Workstation, server and similar |
| `platformVersion` | String | OS version |
| `patchStatus` | String | Patch roll-up, a plain string |
| `sysUptime` | String | Uptime |

## Network and hardware

| Field | Type | Description |
|-------|------|-------------|
| `publicIp` | String | External IP |
| `primaryMac` | String | Primary MAC address |
| `gateway` | String | Default gateway |
| `domain` | String | Domain |
| `loggedInUser` | String | Current user |
| `manufacturer` / `model` / `serialNumber` | String | Hardware identity |
| `warrantyExpiryDate` / `purchasedDate` | String | Lifecycle dates |

## JSON fields (select by name only)

`client`, `site`, `requester`, `assetClass`, `deviceCategory` and
`customFields(fields: [String])`.

## Not on `Asset`

There is no `ipAddress`, `macAddress`, `osName`, `osVersion`, `lastSeen` or
`tags`, and no CPU, memory or disk figures. Use `publicIp`, `primaryMac`,
`platform`, `platformVersion` and `lastCommunicatedTime`. Read CPU, memory and
disk from `getAssetSummary` and `getAssetDiskDetails`.
