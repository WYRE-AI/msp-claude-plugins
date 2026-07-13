---
description: Search for Autotask configuration items/assets by name, serial number, or company
argument-hint: "<query> [company_id] [type] [active] [limit]"
arguments: [query, company_id, type, active, limit]
---

# Lookup Autotask Asset

Search for configuration items/assets in Autotask by name, serial number, or company association for troubleshooting and ticket context.

## Prerequisites

- Valid Autotask API credentials configured
- User must have configuration item read permissions

## Steps

1. **Build search filter**
   - Search reference title (asset name) with contains match
   - Search serial number if query appears to be a serial
   - Apply company filter if provided
   - Apply type filter if provided
   - Apply active status filter (default: active only)

2. **Execute search**
   - Use `autotask-mcp/autotask_search_configuration_items` with filters
   - Limit results as specified

3. **Display results**
   - Show asset details including name, type, serial
   - Include company association
   - Show warranty and contract information

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Asset name, serial number, or reference |
| company_id | integer | No | - | Filter by company |
| type | string | No | - | Asset type filter |
| active | boolean | No | true | Active assets only |
| limit | integer | No | 10 | Max results |

## Examples

### Search by Name

```
/lookup-asset "ACME-WS-001"
```

### Search by Serial Number

```
/lookup-asset "SN12345678"
```

### Search by Manufacturer

```
/lookup-asset "Dell"
```

### Filter by Company

```
/lookup-asset "Dell" --company_id 12345
```

### Filter by Type

```
/lookup-asset "Server" --type "Server"
```

### Search Workstations

```
/lookup-asset "Workstation" --company_id 12345 --type "Workstation"
```

### Include Inactive/Retired

```
/lookup-asset "Old Server" --active false
```

## Output

```
Asset Search Results (4 found)

+--------+------------------+-------------+--------------+---------------+----------------+
| ID     | Name             | Type        | Serial       | Company       | Status         |
+--------+------------------+-------------+--------------+---------------+----------------+
| 98765  | ACME-WS-001      | Workstation | DELL-ABC123  | Acme Corp     | Active         |
| 98766  | ACME-WS-002      | Workstation | DELL-ABC124  | Acme Corp     | Active         |
| 98767  | ACME-SRV-001     | Server      | HP-XYZ789    | Acme Corp     | Active         |
| 98768  | ACME-FW-001      | Firewall    | CISCO-123456 | Acme Corp     | Active         |
+--------+------------------+-------------+--------------+---------------+----------------+

Quick Actions:
  Create ticket: /create-ticket <company_id> "Issue with <asset>"
  View company: /lookup-company <company_id>
```

### Single Result (Detailed View)

```
Asset Found

Name: ACME-WS-001
ID: 98765
Type: Workstation
Status: Active

Company: Acme Corporation (ID: 12345)
Location: Main Office - Floor 2

Hardware Details:
  Manufacturer: Dell
  Model: OptiPlex 7090
  Serial Number: DELL-ABC123
  Product ID: 7090-MT

  Processor: Intel Core i7-11700
  Memory: 32 GB
  Storage: 512 GB SSD

Network:
  IP Address: 192.168.1.101
  MAC Address: 00:14:22:01:23:45

Warranty:
  Status: Active
  Expiration: 2027-03-15
  Type: ProSupport Plus

Installed Software:
  OS: Windows 11 Pro (22H2)
  Office: Microsoft 365 Business

Contract: Managed Services Agreement
Last Updated: 2026-01-15

Assigned User: John Smith (john.smith@acme.com)

Recent Tickets: 2 related tickets this year

Quick Actions:
  Create ticket: /create-ticket 12345 "Issue with ACME-WS-001"
  View contact: /lookup-contact "john.smith@acme.com"
  View company: /lookup-company 12345
```

### Serial Number Search

```
Asset Found by Serial Number

Serial: DELL-ABC123

Name: ACME-WS-001
ID: 98765
Type: Workstation

Company: Acme Corporation (ID: 12345)
Manufacturer: Dell
Model: OptiPlex 7090

Warranty Status: Active (expires 2027-03-15)
Assigned User: John Smith

Quick Actions:
  Create ticket: /create-ticket 12345 "Issue with ACME-WS-001"
```

### Server Asset Details

```
Asset Found

Name: ACME-SRV-001
ID: 98767
Type: Server
Status: Active

Company: Acme Corporation (ID: 12345)
Location: Data Center - Rack 12

Hardware Details:
  Manufacturer: HP
  Model: ProLiant DL380 Gen10
  Serial Number: HP-XYZ789

  Processors: 2x Intel Xeon Gold 6248
  Memory: 256 GB
  Storage: 8x 1.2TB SAS (RAID 6)

Network:
  Primary IP: 192.168.10.10
  iLO IP: 192.168.10.110
  FQDN: srv001.acmecorp.local

Role: Domain Controller, File Server

Warranty:
  Status: Active
  Expiration: 2028-06-20
  Type: Foundation Care 24x7

Contract: Managed Services Agreement

Recent Tickets: 0 open, 5 total this year
```

## Error Handling

### No Results

```
No Assets Found

No assets match: "ACME-WS-999"

Suggestions:
  - Check asset naming convention
  - Try partial name: /lookup-asset "ACME-WS"
  - Search by serial number
  - Include retired: /lookup-asset "ACME-WS-999" --active false
```

### Invalid Company ID

```
Error: Company not found: ID 99999

Verify the company ID and try again.
Use /lookup-company to find the correct ID.
```

### Invalid Asset Type

```
Error: Invalid asset type: "Computer"

Common asset types:
- Workstation
- Server
- Network Device
- Firewall
- Printer
- Mobile Device
- Software License
- Virtual Machine

Use /lookup-asset "query" without type filter to see available types.
```

### Too Many Results

```
Asset Search Results (50+ found)

Showing first 10 results. Refine your search.

+--------+------------------+-------------+--------------+---------------+
| ID     | Name             | Type        | Serial       | Company       |
+--------+------------------+-------------+--------------+---------------+
| ...    | ...              | ...         | ...          | ...           |
+--------+------------------+-------------+--------------+---------------+

Tips:
  - Add company filter: --company_id 12345
  - Add type filter: --type Workstation
  - Use more specific name/serial
```

## Asset Type Reference

| Type | Description |
|------|-------------|
| Workstation | Desktop computers, laptops |
| Server | Physical or virtual servers |
| Network Device | Switches, routers, access points |
| Firewall | Network security appliances |
| Printer | Printers, copiers, MFPs |
| Mobile Device | Phones, tablets |
| Software License | Licensed software |
| Virtual Machine | VMs (tracked separately) |

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_search_configuration_items` - Search assets with filters
- `autotask_search_companies` - Get company context

## Related Commands

- `/lookup-company` - Find company information
- `/lookup-contact` - Find contact associated with asset
- `/create-ticket` - Create ticket for asset issue
- `/check-contract` - Verify warranty/support coverage
