---
description: Search for configuration items/assets by name, serial number, type, or client
argument-hint: "[query] [client_id] [asset_type] [status] [limit]"
arguments: [query, client_id, asset_type, status, limit]
---

# Search HaloPSA Assets

Search for configuration items/assets by name, serial number, type, or client association.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- User must have asset read permissions

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`
   ```bash
   # Get OAuth token
   TOKEN=$(curl -s -X POST "{base_url}/auth/token?tenant={tenant}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "scope=all" | jq -r '.access_token')
   ```

2. **Validate parameters**
   - Either query or client_id must be provided
   - Validate asset_type against available types

3. **Get asset types (for validation)**
   ```bash
   curl -s -X GET "{base_url}/api/AssetType" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Execute asset search**
   ```bash
   # Search by query
   curl -s -X GET "{base_url}/api/Asset?search={query}&page_size={limit}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"

   # Or search by client
   curl -s -X GET "{base_url}/api/Asset?client_id={client_id}&page_size={limit}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

5. **Apply additional filters**
   - Filter by asset_type if specified
   - Filter by status if specified

6. **Format and display results**
   - Asset list with key details
   - Quick action links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No* | - | Search term (name, serial, etc.) |
| client_id | integer | No* | - | Filter by client ID |
| asset_type | string | No | - | Workstation/Server/Network/etc. |
| status | string | No | - | Active/Inactive/Retired |
| limit | integer | No | 25 | Maximum results (max 100) |

*Either query or client_id is required

## Examples

### Search by Name

```
/search-assets "ACME-SRV-01"
```

### Search by Serial Number

```
/search-assets "ABC123456"
```

### Client's Assets

```
/search-assets --client_id 12345
```

### Filter by Type

```
/search-assets --client_id 12345 --asset_type Server
```

### Active Assets Only

```
/search-assets "Dell" --status Active
```

### Workstations for Client

```
/search-assets --client_id 12345 --asset_type Workstation --status Active
```

### Network Equipment

```
/search-assets "switch" --asset_type Network --limit 50
```

## Output

### Standard Results

```
Found 5 assets matching "ACME-SRV"

┌─────────┬─────────────────────┬──────────────┬─────────────┬───────────────┬──────────┐
│ ID      │ Name                │ Type         │ Client      │ Serial        │ Status   │
├─────────┼─────────────────────┼──────────────┼─────────────┼───────────────┼──────────┤
│ 1001    │ ACME-SRV-01         │ Server       │ Acme Corp   │ DEL123456     │ Active   │
│ 1002    │ ACME-SRV-02         │ Server       │ Acme Corp   │ DEL123457     │ Active   │
│ 1003    │ ACME-SRV-DC01       │ Server       │ Acme Corp   │ HPE789012     │ Active   │
│ 1004    │ ACME-SRV-BACKUP     │ Server       │ Acme Corp   │ DEL345678     │ Active   │
│ 1005    │ ACME-SRV-OLD        │ Server       │ Acme Corp   │ DEL000123     │ Retired  │
└─────────┴─────────────────────┴──────────────┴─────────────┴───────────────┴──────────┘

Quick Actions:
- View asset:     /search-assets --id <id>
- Asset tickets:  /search-tickets --asset <id>
- Client assets:  /search-assets --client_id <client_id>
```

### Detailed Asset View

```
================================================================================
Asset Details: ACME-SRV-01 (ID: 1001)
================================================================================

BASIC INFORMATION
--------------------------------------------------------------------------------
Name:             ACME-SRV-01
Asset Type:       Server
Status:           Active
Client:           Acme Corporation (ID: 123)
Site:             Main Office

HARDWARE DETAILS
--------------------------------------------------------------------------------
Manufacturer:     Dell
Model:            PowerEdge R740
Serial Number:    DEL123456
Service Tag:      ABCD123

CPU:              Intel Xeon Gold 6248 (2x)
RAM:              256 GB
Storage:          4x 1.2TB SAS (RAID 10)

NETWORK
--------------------------------------------------------------------------------
Hostname:         acme-srv-01.acme.local
IP Address:       192.168.1.10
MAC Address:      00:1A:2B:3C:4D:5E
Domain:           acme.local

SOFTWARE
--------------------------------------------------------------------------------
OS:               Windows Server 2022 Datacenter
OS Version:       21H2 (Build 20348)
Last Boot:        2024-02-10 03:45:00

WARRANTY & MAINTENANCE
--------------------------------------------------------------------------------
Warranty Status:  Active
Warranty Expires: 2026-06-15 (829 days remaining)
Support Level:    ProSupport Plus
Last Service:     2024-01-15

MONITORING
--------------------------------------------------------------------------------
Agent Status:     Online
Last Seen:        2024-02-15 15:30:00 (5 min ago)
Alerts:           0 active

LINKED TICKETS
--------------------------------------------------------------------------------
Open Tickets:     1
- #12345: Exchange performance issues (In Progress)

Total Tickets:    24 (lifetime)

================================================================================

Quick Actions:
- Create ticket:  /create-ticket 123 "Issue with ACME-SRV-01"
- Open tickets:   /search-tickets --asset 1001 --status open
- Asset URL:      https://yourcompany.halopsa.com/assets?id=1001
```

### Client Assets Summary

```
================================================================================
Assets for Acme Corporation (ID: 123)
================================================================================

SUMMARY
--------------------------------------------------------------------------------
Total Assets:     156
Active:           148
Inactive:         5
Retired:          3

BY TYPE
--------------------------------------------------------------------------------
Workstations:     120 active
Servers:          12 active
Network:          8 active
Printers:         6 active
Mobile:           2 active

SERVERS (12)
--------------------------------------------------------------------------------
┌────────────────────┬─────────────────┬───────────────┬────────────────────┐
│ Name               │ Model           │ IP Address    │ Status             │
├────────────────────┼─────────────────┼───────────────┼────────────────────┤
│ ACME-SRV-01        │ Dell R740       │ 192.168.1.10  │ ✓ Online           │
│ ACME-SRV-02        │ Dell R740       │ 192.168.1.11  │ ✓ Online           │
│ ACME-SRV-DC01      │ HPE DL380       │ 192.168.1.5   │ ✓ Online           │
│ ACME-SRV-DC02      │ HPE DL380       │ 192.168.1.6   │ ✓ Online           │
│ ACME-SRV-FILE     │ Dell R640       │ 192.168.1.20  │ ✓ Online           │
│ ACME-SRV-SQL       │ Dell R740xd     │ 192.168.1.30  │ ✓ Online           │
│ ACME-SRV-BACKUP    │ Dell R640       │ 192.168.1.40  │ ✓ Online           │
│ ACME-SRV-EXCH      │ Dell R740       │ 192.168.1.50  │ ⚠️ Alert            │
│ ...                │ ...             │ ...           │ ...                │
└────────────────────┴─────────────────┴───────────────┴────────────────────┘

NETWORK DEVICES (8)
--------------------------------------------------------------------------------
┌────────────────────┬─────────────────┬───────────────┬────────────────────┐
│ Name               │ Model           │ IP Address    │ Status             │
├────────────────────┼─────────────────┼───────────────┼────────────────────┤
│ ACME-FW-01         │ Fortinet 60F    │ 192.168.1.1   │ ✓ Online           │
│ ACME-SW-CORE       │ Cisco 3850      │ 192.168.1.2   │ ✓ Online           │
│ ACME-SW-01         │ Cisco 2960      │ 192.168.1.3   │ ✓ Online           │
│ ACME-AP-01         │ Ubiquiti UAP    │ 192.168.1.100 │ ✓ Online           │
│ ...                │ ...             │ ...           │ ...                │
└────────────────────┴─────────────────┴───────────────┴────────────────────┘

WARRANTY ALERTS
--------------------------------------------------------------------------------
⚠️  3 assets with warranty expiring in next 90 days:
- ACME-WS-045: Expires 2024-04-15
- ACME-PRINTER-02: Expires 2024-05-01
- ACME-SW-02: Expires 2024-05-10

================================================================================
```

## Error Handling

### No Query Provided

```
Error: Either query or client_id is required

Examples:
  /search-assets "server name"
  /search-assets "ABC123456"
  /search-assets --client_id 12345
  /search-assets --client_id 12345 --asset_type Server
```

### No Results

```
No assets found matching "Unknown Device"

Suggestions:
- Check spelling
- Try searching by serial number
- Search by client: /search-assets --client_id <id>
- Include retired assets: --status all
```

### Invalid Asset Type

```
Invalid asset type: "Unknown Type"

Available asset types:
- Workstation
- Laptop
- Server
- Network
- Printer
- Mobile
- Virtual Machine
- Other

Use: /search-assets "query" --asset_type Server
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'read:assets' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

## API Reference

### GET /api/Asset

Query parameters:
- `search={query}` - Search term
- `client_id={id}` - Filter by client
- `assettype_id={id}` - Filter by asset type
- `inactive={bool}` - Include inactive
- `page_size={limit}` - Results per page

**Response:**
```json
{
  "assets": [
    {
      "id": 1001,
      "inventory_number": "ACME-SRV-01",
      "client_id": 123,
      "client_name": "Acme Corporation",
      "assettype_id": 2,
      "assettype_name": "Server",
      "serial_number": "DEL123456",
      "manufacturer": "Dell",
      "model": "PowerEdge R740",
      "inactive": false
    }
  ],
  "record_count": 1
}
```

### GET /api/AssetType

Retrieves available asset types for filtering.

## Related Commands

- `/search-clients` - Find client ID
- `/search-tickets` - Find asset's tickets
- `/create-ticket` - Create ticket for asset
- `/show-ticket` - View ticket with asset
