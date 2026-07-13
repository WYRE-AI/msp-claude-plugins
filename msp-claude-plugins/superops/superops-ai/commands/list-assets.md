---
description: List and filter assets in SuperOps.ai
argument-hint: "[client] [status] [platform] [limit] [search]"
arguments: [client, status, platform, limit, search]
---

# List SuperOps.ai Assets

List and filter assets managed by SuperOps.ai RMM.

## Prerequisites

- Valid SuperOps.ai API token configured
- User must have asset viewing permissions

## Steps

1. **Build filter criteria**
   - Resolve client ID if client name provided
   - Map status string to API enum
   - Map platform string to API enum

2. **Query assets**
   ```graphql
   query getAssetList($input: ListInfoInput!) {
     getAssetList(input: $input) {
       assets {
         assetId
         name
         status
         platform
         lastSeen
         client {
           accountId
           name
         }
         site {
           id
           name
         }
         ipAddress
         macAddress
         osVersion
         patchStatus
       }
       listInfo {
         totalCount
         hasNextPage
         endCursor
       }
     }
   }
   ```

3. **Apply pagination**
   - Use cursor-based pagination
   - Fetch up to specified limit
   - Continue if more results needed

4. **Format and display results**
   - Group by client if no client filter
   - Show key asset details
   - Include health indicators

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client | string/int | No | - | Filter by client name or ID |
| status | string | No | all | online, offline, all |
| platform | string | No | - | windows, macos, linux |
| limit | int | No | 50 | Max results (1-500) |
| search | string | No | - | Search by asset name |

## Examples

### List All Assets

```
/list-assets
```

### Filter by Client

```
/list-assets --client "Acme Corp"
```

### Online Windows Workstations

```
/list-assets --status online --platform windows --limit 100
```

### Search by Name

```
/list-assets --search "SERVER"
```

## Output

```
Assets (showing 3 of 156)

Acme Corporation
----------------
  ACME-DC01        Windows Server 2022    Online    192.168.1.10
  ACME-WS001       Windows 11 Pro         Online    192.168.1.101
  ACME-MBP-JOHN    macOS Sonoma           Offline   Last seen: 2h ago

Tech Solutions Inc
------------------
  TECH-FILE01      Windows Server 2019    Online    10.0.0.5
  TECH-WS-SARAH    Windows 10 Pro         Online    10.0.0.52

Total: 156 assets | Online: 142 | Offline: 14
```

### Detailed View (Single Client)

```
/list-assets --client "Acme Corp" --status online

Acme Corporation - Online Assets (12 of 15)

Name            Platform              IP Address      Last Seen    Patch Status
---------------------------------------------------------------------------
ACME-DC01       Windows Server 2022   192.168.1.10    Now          Up to date
ACME-DC02       Windows Server 2022   192.168.1.11    Now          3 pending
ACME-FILE01     Windows Server 2019   192.168.1.20    Now          Up to date
ACME-WS001      Windows 11 Pro        192.168.1.101   Now          1 pending
ACME-WS002      Windows 11 Pro        192.168.1.102   Now          Up to date
...

Page 1 of 2 | Use --offset 50 for next page
```

## Error Handling

### Client Not Found

```
Client not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
```

### No Assets Match Filter

```
No assets found matching criteria:
- Client: Acme Corporation
- Status: offline
- Platform: linux

Try broadening your search criteria.
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid client ID | Verify client exists |
| Invalid platform | Use: windows, macos, linux |
| Rate limited | Wait and retry (800 req/min limit) |
| Timeout | Reduce limit or add filters |

## Related Commands

- `/create-ticket` - Create ticket for asset issue
- `/run-script` - Execute script on asset
- `/get-asset-details` - View detailed asset information
