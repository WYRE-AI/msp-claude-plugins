---
description: Search for customer assets in Syncro
argument-hint: "[query] [customer_id] [asset_type] [status] [limit]"
arguments: [query, customer_id, asset_type, status, limit]
---

# Search Syncro Assets

Search for customer assets by name, serial number, type, or customer association.

## Prerequisites

- Valid Syncro API key configured
- User must have asset read permissions

## Steps

1. **Build search query**
   - Parse query for name/serial search
   - Apply customer_id filter if provided
   - Apply asset_type filter if provided
   - Apply status filter if provided

2. **Execute search**
   ```bash
   # Search by query
   curl -s -X GET \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/assets?api_key=${SYNCRO_API_KEY}&query=${query}&per_page=${limit}"

   # Or by customer
   curl -s -X GET \
     "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/customers/${customer_id}/assets?api_key=${SYNCRO_API_KEY}&per_page=${limit}"
   ```

3. **Filter and format results**
   - Apply additional filters as needed
   - Format asset list with key details
   - Include quick action links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No* | - | Search by asset name or serial |
| customer_id | integer | No | - | Filter by customer ID |
| asset_type | string | No | - | Desktop, Laptop, Server, Printer, etc. |
| status | string | No | - | Active, Inactive |
| limit | integer | No | 25 | Maximum results (1-100) |

*Required if customer_id not provided

## API Endpoints Used

```
GET /api/v1/assets?query={query}
GET /api/v1/customers/{id}/assets
```

## Examples

### Search by Name

```
/search-assets "ACME-WS"
```

### Search by Serial Number

```
/search-assets "ABC123456"
```

### Customer Assets

```
/search-assets --customer_id 12345
```

### Filter by Type

```
/search-assets --customer_id 12345 --asset_type Server
```

### Active Assets Only

```
/search-assets "Dell" --status Active
```

### Combined Filters

```
/search-assets --customer_id 12345 --asset_type Laptop --status Active --limit 10
```

## Output

### Search Results

```
Found 8 assets matching "ACME"

| Name | Type | Customer | Serial | Status |
|------|------|----------|--------|--------|
| ACME-DC01 | Server | Acme Corp | ABC123 | Active |
| ACME-DC02 | Server | Acme Corp | ABC124 | Active |
| ACME-WS001 | Desktop | Acme Corp | DEF456 | Active |
| ACME-WS002 | Desktop | Acme Corp | DEF457 | Active |
| ACME-WS003 | Desktop | Acme Corp | DEF458 | Inactive |
| ACME-LT001 | Laptop | Acme Corp | GHI789 | Active |
| ACME-LT002 | Laptop | Acme Corp | GHI790 | Active |
| ACME-PRN01 | Printer | Acme Corp | JKL012 | Active |

Quick Actions:
- View asset: Click asset name in Syncro
- View alerts: /list-alerts --asset_id <id>
- View customer: /get-customer <customer_id>
```

### Customer Assets

```
Assets for Acme Corporation (12 total)

Servers (2):
| Name | Serial | OS | IP | Status |
|------|--------|----|----|--------|
| ACME-DC01 | ABC123 | Windows Server 2022 | 192.168.1.10 | Active |
| ACME-DC02 | ABC124 | Windows Server 2022 | 192.168.1.11 | Active |

Desktops (5):
| Name | Serial | OS | Last Seen | Status |
|------|--------|----|-----------| --------|
| ACME-WS001 | DEF456 | Windows 11 | 2h ago | Active |
| ACME-WS002 | DEF457 | Windows 11 | 3h ago | Active |
| ACME-WS003 | DEF458 | Windows 10 | 30d ago | Inactive |
| ACME-WS004 | DEF459 | Windows 11 | 1h ago | Active |
| ACME-WS005 | DEF460 | Windows 11 | 4h ago | Active |

Laptops (3):
| Name | Serial | OS | Last Seen | Status |
|------|--------|----|-----------| --------|
| ACME-LT001 | GHI789 | Windows 11 | 1h ago | Active |
| ACME-LT002 | GHI790 | Windows 11 | 5h ago | Active |
| ACME-LT003 | GHI791 | macOS 14 | 2h ago | Active |

Other (2):
| Name | Type | Serial | Status |
|------|------|--------|--------|
| ACME-PRN01 | Printer | JKL012 | Active |
| ACME-FW01 | Firewall | MNO345 | Active |
```

### Detailed Asset View

```
/search-assets "ACME-DC01" --detailed
```

```
Asset Details: ACME-DC01

General Information:
  Name: ACME-DC01
  Type: Server
  Customer: Acme Corporation
  Status: Active
  Serial: ABC123456
  Asset Tag: ACME-SRV-001

Hardware:
  Manufacturer: Dell
  Model: PowerEdge R740
  CPU: Intel Xeon Silver 4214R (24 cores)
  RAM: 64 GB
  Storage: 2TB RAID 1

Software:
  OS: Windows Server 2022 Standard
  OS Version: 21H2
  Last Update: 2026-02-01

Network:
  IP Address: 192.168.1.10
  MAC Address: AA:BB:CC:DD:EE:FF
  Hostname: ACME-DC01.acmecorp.local

Monitoring:
  RMM Status: Online
  Last Seen: 5 minutes ago
  Uptime: 45 days

Active Alerts: 1
  [!] CRIT: Disk Space < 5% (2h ago)

URL: https://acme.syncromsp.com/assets/67890
```

## Error Handling

### No Results

```
No assets found matching criteria

Search: "XYZ"
Filters: None

Suggestions:
- Check spelling
- Try a partial name
- Remove filters to broaden search
- Use /get-customer to find customer ID first
```

### Invalid Customer ID

```
Error: Customer not found

Customer ID 99999 does not exist or you do not have access.

Suggestions:
- Verify the customer ID is correct
- Use /get-customer --query "name" to find the ID
```

### Invalid Asset Type

```
Error: Invalid asset type

"Computer" is not a valid asset type.

Valid types:
- Desktop
- Laptop
- Server
- Printer
- Network Device
- Mobile Device
- Other
```

### Missing Required Parameter

```
Error: query or customer_id required

Please provide either:
- Search query: /search-assets "asset name"
- Customer ID: /search-assets --customer_id 12345
```

### Permission Denied

```
Error: Permission denied (403)

You do not have permission to view assets.

Contact your Syncro administrator if you need access.
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

## Asset Type Reference

| Type | Description |
|------|-------------|
| Desktop | Desktop workstations |
| Laptop | Portable computers |
| Server | Physical or virtual servers |
| Printer | Printers and MFPs |
| Network Device | Routers, switches, firewalls |
| Mobile Device | Phones and tablets |
| Other | Miscellaneous assets |

## Tips

### Finding Assets for Support

Before starting remote support:

```
/search-assets --customer_id 12345 --asset_type Desktop
```

### Locating Specific Hardware

Search by serial number for warranty lookups:

```
/search-assets "ABC123456"
```

### Inactive Asset Review

Find assets that may need attention:

```
/search-assets --customer_id 12345 --status Inactive
```

### Pre-Deployment Check

Verify new assets are registered:

```
/search-assets "NEW-" --status Active
```

## Related Commands

- `/get-customer` - Get customer details with asset summary
- `/list-alerts` - View alerts for an asset
- `/create-ticket` - Create a ticket for an asset issue
- `/resolve-alert` - Resolve an asset alert
