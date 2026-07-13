---
description: Get detailed asset information including hardware, software, and alerts
argument-hint: "[asset_id] [query] [client_id] [include_software] [include_alerts]"
arguments: [asset_id, query, client_id, include_software, include_alerts]
---

# Get SuperOps.ai Asset Details

Retrieve detailed asset information including hardware specs, installed software, and recent activity.

## Prerequisites

- Valid SuperOps.ai API token configured
- Asset must exist in SuperOps.ai
- User must have asset viewing permissions
- RMM module enabled in SuperOps.ai

## Steps

1. **Resolve asset**
   - If asset_id provided, query directly
   - If query provided, search by name or serial
   - If client_id provided, filter search results

2. **Query asset details**
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

       # Agent
       agentVersion
       agentInstallDate
     }
   }
   ```

3. **Optionally fetch software list**
   ```graphql
   query getAssetSoftwareList($input: AssetSoftwareListInput!) {
     getAssetSoftwareList(input: $input) {
       software {
         name
         version
         publisher
         installDate
       }
     }
   }
   ```

4. **Optionally fetch recent alerts**
   ```graphql
   query getAlertsForAsset($input: AssetDetailsListInput!) {
     getAlertsForAsset(input: $input) {
       alerts {
         alertId
         message
         severity
         status
         createdTime
       }
     }
   }
   ```

5. **Format and display results**
   - Show asset overview
   - Display hardware specs
   - List software if requested
   - Show alerts if requested

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| asset_id | string | No* | - | Asset ID to look up |
| query | string | No* | - | Search by asset name or serial |
| client_id | string | No | - | Filter by client ID |
| include_software | boolean | No | false | Include installed software |
| include_alerts | boolean | No | false | Include recent alerts |

*Either `asset_id` or `query` is required

## Examples

### Get Asset by ID

```
/get-asset asset_12345
```

### Search by Name

```
/get-asset --query "ACME-WS-001"
```

### Search with Client Filter

```
/get-asset --query "Dell" --client_id client_789
```

### Include Software List

```
/get-asset asset_12345 --include_software true
```

### Include Alerts

```
/get-asset asset_12345 --include_alerts true
```

### Full Details

```
/get-asset asset_12345 --include_software true --include_alerts true
```

## Output

### Basic Asset Details

```
Asset Details: ACME-DC01

Status: Online
Last Seen: Just now

Client: Acme Corporation
Site: Main Office - 123 Business St, Suite 100

Hardware:
  Manufacturer: Dell Inc.
  Model: PowerEdge R740
  Serial Number: ABC1234567
  Processor: Intel Xeon Gold 6230 @ 2.10GHz (20 cores)
  Memory: 64 GB
  Architecture: 64-bit

Operating System:
  OS: Windows Server 2022 Datacenter
  Version: 21H2
  Build: 20348.2322

Storage:
  C: Drive: 931 GB total, 186 GB free (20%)
  D: Drive: 1.8 TB total, 1.2 TB free (67%)

Network:
  IP Address: 192.168.1.10
  MAC Address: 00:1A:2B:3C:4D:5E
  Public IP: 203.0.113.50
  Hostname: ACME-DC01.acme.local

RMM Agent:
  Version: 3.5.2
  Installed: 2024-06-15

Tags: production, server, domain-controller

Asset ID: asset_12345
```

### With Software List

```
Asset Details: ACME-WS001
[... basic details ...]

Installed Software (showing 10 of 156):

Name                              Version         Publisher
----------------------------------------------------------------
Microsoft 365 Apps Enterprise     16.0.17328.20162 Microsoft
Microsoft Visual Studio 2022      17.8.34408.163   Microsoft
Google Chrome                     121.0.6167.140   Google LLC
Adobe Acrobat Pro DC              23.008.20555     Adobe Inc.
Zoom                              5.17.5           Zoom Video
Slack                             4.36.140         Slack Technologies
Visual Studio Code                1.86.1           Microsoft
Git                               2.43.0           Git Project
Node.js                           20.11.0          Node.js Foundation
Python 3.12.1                     3.12.1           Python Software

Use --include_software true to see complete list
Total installed: 156 applications
```

### With Alerts

```
Asset Details: ACME-DC01
[... basic details ...]

Recent Alerts (5):

Severity    Status          Created         Message
----------------------------------------------------------------
Critical    Active          2h ago          Disk Space: C: at 20%
High        Acknowledged    6h ago          Memory: 90% usage
Medium      Resolved        1d ago          Pending reboot: 7 days
Low         Auto-Resolved   2d ago          Service restart: Spooler
Low         Resolved        3d ago          CPU spike: 85% (5 min)

Active Alerts: 1 Critical, 1 High
Use /list-alerts --asset_id asset_12345 for full alert history
```

## curl Example

```bash
curl -X POST 'https://yourcompany.superops.ai/graphql' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "query getAsset($input: AssetIdentifierInput!) { getAsset(input: $input) { assetId name status platform lastSeen ipAddress macAddress manufacturer model serialNumber processorName processorCores totalMemory osName osVersion totalDiskSpace freeDiskSpace client { accountId name } site { id name } agentVersion } }",
    "variables": {
      "input": {
        "assetId": "asset-uuid-here"
      }
    }
  }'
```

## Error Handling

### Asset Not Found (by ID)

```
Asset not found: "asset_99999"

Please verify the asset ID is correct.
Use /list-assets to find available assets.
```

### No Assets Match Query

```
No assets found matching: "XYZ-SERVER"

Try a different search term or verify the asset name.

Search tips:
- Use partial names: "XYZ" instead of "XYZ-SERVER-01"
- Try serial number if known
- Filter by client: --client_id client_123
```

### Multiple Assets Found

```
Multiple assets found matching: "ACME-WS"

Please be more specific or use the asset ID:

Asset Name      Client              Status    Asset ID
----------------------------------------------------------------
ACME-WS001      Acme Corporation    Online    asset_123
ACME-WS002      Acme Corporation    Online    asset_456
ACME-WS003      Acme Corporation    Offline   asset_789
ACME-WS-BACKUP  Acme Corporation    Online    asset_101

Use: /get-asset asset_123
```

### Client Not Found

```
Client not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: client_123)
- Acme Industries (ID: client_456)
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid asset ID | Verify asset exists using /list-assets |
| Invalid client ID | Verify client exists |
| Permission denied | Check user permissions for asset viewing |
| Rate limited | Wait and retry (800 req/min limit) |

## Use Cases

1. **Troubleshooting** - Check hardware specs before remote support
2. **Inventory audit** - Verify software compliance
3. **Alert investigation** - Understand asset context
4. **Capacity planning** - Review disk and memory usage
5. **Client reporting** - Generate asset documentation

## Best Practices

1. **Use asset_id when known** - Faster and more accurate
2. **Include software sparingly** - Large result sets for full software list
3. **Check status first** - Verify online before running scripts
4. **Review alerts** - Understand current issues before changes
5. **Document findings** - Add notes to related tickets

## Related Commands

- `/list-assets` - List and filter assets
- `/list-alerts` - View alerts for asset
- `/run-script` - Execute script on asset
- `/create-ticket` - Create ticket for asset issue
- `/acknowledge-alert` - Acknowledge asset alert
