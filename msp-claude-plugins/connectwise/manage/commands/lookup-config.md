---
description: Search for configuration items (assets) in ConnectWise PSA
argument-hint: "[query] [company_id] [type] [status] [limit]"
arguments: [query, company_id, type, status, limit]
---

# Look Up ConnectWise PSA Configuration Items

Search for configuration items (assets) by name, serial number, tag number, or company.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have configuration item read permissions

## Steps

1. **Build search conditions**

   If query provided, search multiple fields:
   ```
   conditions=name contains '{query}' or serialNumber='{query}' or tagNumber='{query}'
   ```

   If company_id provided:
   ```
   conditions=company/id={company_id}
   ```

2. **Resolve type filter (if provided)**
   ```http
   GET /company/configurations/types?conditions=name='{type}'
   ```

3. **Resolve status filter (if provided)**
   ```http
   GET /company/configurations/statuses?conditions=name='{status}'
   ```

4. **Execute search**
   ```http
   GET /company/configurations?conditions=<conditions>&page=1&pageSize=<limit>&orderBy=name asc
   ```

5. **Format and return results**
   - Display configuration list with key details
   - Include quick actions for each item

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No* | - | Search term (name, serial, tag) |
| company_id | integer | No | - | Filter by company ID |
| type | string | No | - | Configuration type filter |
| status | string | No | - | Configuration status filter |
| limit | integer | No | 25 | Max results (1-100) |

*Required if company_id not provided

## Examples

### Search by Name

```
/lookup-config "ACME-WS-001"
```

### Search by Serial Number

```
/lookup-config "SN123456789"
```

### Search by Tag Number

```
/lookup-config "TAG-001"
```

### Filter by Company

```
/lookup-config --company_id 12345
```

### Filter by Type

```
/lookup-config --company_id 12345 --type "Server"
```

### Active Configurations Only

```
/lookup-config --company_id 12345 --status "Active"
```

### Combined Search

```
/lookup-config "Dell" --type "Workstation" --status "Active" --limit 50
```

### Company Servers

```
/lookup-config --company_id 12345 --type "Server" --status "Active"
```

## Output

### Search Results

```
Found 5 configuration items matching "ACME"

+--------+------------------+--------------+-----------+--------+------------------+
| ID     | Name             | Type         | Company   | Status | Serial Number    |
+--------+------------------+--------------+-----------+--------+------------------+
| 10001  | ACME-WS-001      | Workstation  | Acme Corp | Active | SN123456789     |
| 10002  | ACME-WS-002      | Workstation  | Acme Corp | Active | SN123456790     |
| 10003  | ACME-SRV-01      | Server       | Acme Corp | Active | SN987654321     |
| 10004  | ACME-SRV-02      | Server       | Acme Corp | Active | SN987654322     |
| 10005  | ACME-FW-01       | Firewall     | Acme Corp | Active | SN555555555     |
+--------+------------------+--------------+-----------+--------+------------------+

Quick Actions:
- View details: /lookup-config <name>
- Link to ticket: /update-ticket <ticket_id> --config <config_id>
```

### Detailed View (Single Result)

```
================================================================================
Configuration Item: ACME-SRV-01
================================================================================

Basic Information:
  ID:             10003
  Name:           ACME-SRV-01
  Type:           Server - Windows
  Status:         Active

Company:
  Name:           Acme Corporation
  ID:             12345

Hardware Details:
  Manufacturer:   Dell
  Model:          PowerEdge R740
  Serial Number:  SN987654321
  Tag Number:     TAG-SRV-01

Network:
  IP Address:     192.168.1.10
  MAC Address:    00:1A:2B:3C:4D:5E
  Default Gateway: 192.168.1.1

Location:
  Site:           Main Office
  Address:        123 Main St, Anytown, USA

Warranty:
  Vendor:         Dell
  Expiration:     2027-06-15
  Type:           ProSupport Plus

Notes:
  Primary domain controller and file server.
  Critical system - 4 hour response SLA.

Installed Software:
  - Windows Server 2022 Datacenter
  - SQL Server 2019 Standard
  - Veeam Agent

Related Tickets (last 30 days):
  #54321 - Server slow response (Closed)
  #54100 - Disk space warning (Closed)

Created:        2024-01-15 by Admin
Last Updated:   2026-02-01

================================================================================
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Search by name
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/company/configurations?conditions=name%20contains%20'ACME'&pageSize=25" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"

# Search by serial number
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/company/configurations?conditions=serialNumber='SN123456789'" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"

# Filter by company and type
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/company/configurations?conditions=company/id=12345%20and%20type/id=5" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"
```

## Error Handling

### No Results

```
No configuration items found matching "XYZ123"

Suggestions:
- Check spelling
- Try partial name match
- Search by serial number or tag
- Broaden type/status filters

Example searches:
  /lookup-config "partial-name"
  /lookup-config --company_id 12345
```

### Missing Search Criteria

```
Error: Search criteria required

Please provide a query or company_id:
  /lookup-config "search term"
  /lookup-config --company_id 12345

You can also filter by type and status:
  /lookup-config --company_id 12345 --type "Server" --status "Active"
```

### Invalid Configuration Type

```
Error: Configuration type not found: "InvalidType"

Available types:
- Workstation
- Server
- Server - Windows
- Server - Linux
- Firewall
- Switch
- Router
- Printer
- Mobile Device
- Virtual Machine

Example: /lookup-config --type "Server"
```

### Invalid Configuration Status

```
Error: Configuration status not found: "Disabled"

Available statuses:
- Active
- Inactive
- Retired
- In Stock
- Pending

Example: /lookup-config --status "Active"
```

### Company Not Found

```
Error: Company ID 99999 not found

Use /search-company to find the correct company ID.
```

### Too Many Results

```
Found 247 configuration items (showing first 25)

Narrow your search:
- Add a more specific query
- Filter by type: --type "Server"
- Filter by status: --status "Active"
- Specify company: --company_id 12345

Use --limit to increase results (max 100).
```

### Rate Limited

```
Rate limited by ConnectWise API

Retrying in 5 seconds...
Successfully retrieved configurations.
```

### Permission Denied

```
Error: Permission denied

You do not have permission to view configuration items.
Contact your ConnectWise administrator.
```

## Filter Reference

### Common Configuration Types

| Type | Description |
|------|-------------|
| Workstation | Desktop/laptop computers |
| Server | Physical servers |
| Server - Windows | Windows servers |
| Server - Linux | Linux servers |
| Virtual Machine | VM instances |
| Firewall | Network firewalls |
| Switch | Network switches |
| Router | Network routers |
| Printer | Printers/MFPs |
| Mobile Device | Phones/tablets |
| UPS | Backup power |
| Storage | NAS/SAN devices |

### Configuration Statuses

| Status | Description |
|--------|-------------|
| Active | Currently in use |
| Inactive | Not currently in use |
| Retired | Decommissioned |
| In Stock | Available for deployment |
| Pending | Awaiting setup |

## Related Commands

- `/get-ticket` - View ticket with linked configurations
- `/create-ticket` - Create ticket and link configuration
- `/check-agreement` - View agreement for configuration coverage
- `/search-tickets` - Find tickets by configuration
