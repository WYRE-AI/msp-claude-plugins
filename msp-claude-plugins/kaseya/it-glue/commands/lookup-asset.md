---
description: Find a configuration item (asset) in IT Glue by name, hostname, serial number, or IP address
argument-hint: "<query> [organization] [type]"
arguments: [query, organization, type]
---

# Lookup IT Glue Asset

Find a configuration item (asset) in IT Glue by various identifiers.

## Prerequisites

- Valid IT Glue API key configured (`IT_GLUE_API_KEY`)
- IT Glue region configured (`IT_GLUE_REGION`)
- User must have configuration read permissions

## Steps

1. **Parse search query**
   - Determine if query is name, hostname, serial number, or IP
   - Resolve organization name to ID if provided
   - Map type filter to configuration type ID

2. **Execute search**
   - Search configurations by multiple fields
   - Apply organization and type filters
   - Fetch related data (organization, interfaces)

3. **Format and return results**
   - Display asset details with key information
   - Include quick actions for further operations

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search term (name, hostname, serial, IP) |
| organization | string | No | - | Organization name filter |
| type | string | No | - | Type filter (server/workstation/network) |

## Examples

### Search by Name

```
/lookup-asset "DC-01"
```

### Search by Hostname

```
/lookup-asset "dc-01.acme.local"
```

### Search by Serial Number

```
/lookup-asset "ABC123456789"
```

### Search by IP Address

```
/lookup-asset "192.168.1.10"
```

### Filter by Organization

```
/lookup-asset "DC-01" --organization "Acme Corp"
```

### Filter by Type

```
/lookup-asset "firewall" --type "network"
```

### Combined Filters

```
/lookup-asset "01" --organization "Acme" --type "server"
```

## Output

### Single Match

```
Found 1 configuration matching "DC-01"

Configuration: DC-01
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organization:  Acme Corporation
Type:          Server
Status:        Active
Hostname:      dc-01.acme.local
Primary IP:    192.168.1.10
Serial:        ABC123456789
Asset Tag:     ACME-SRV-001

Network Interfaces:
  - Ethernet0: 192.168.1.10 (AA:BB:CC:DD:EE:01)
  - iLO: 192.168.100.10 (AA:BB:CC:DD:EE:02)

Warranty:      Expires 2027-01-15 (1095 days remaining)
Purchased:     2024-01-15

Quick Actions:
  - View in IT Glue: [link]
  - Related passwords: /get-password --organization "Acme Corp" --search "DC-01"
  - View documentation: /search-docs "DC-01" --organization "Acme Corp"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Multiple Matches

```
Found 3 configurations matching "DC"

┌─────────────────┬──────────────────┬────────────┬────────────────┬───────────────────┐
│ Name            │ Organization     │ Type       │ Primary IP     │ Status            │
├─────────────────┼──────────────────┼────────────┼────────────────┼───────────────────┤
│ DC-01           │ Acme Corp        │ Server     │ 192.168.1.10   │ Active            │
│ DC-02           │ Acme Corp        │ Server     │ 192.168.1.11   │ Active            │
│ NYC-DC-01       │ Acme East        │ Server     │ 10.10.1.10     │ Active            │
└─────────────────┴──────────────────┴────────────┴────────────────┴───────────────────┘

Refine search:
  - Add organization: /lookup-asset "DC" --organization "Acme Corp"
  - Add type: /lookup-asset "DC" --type "server"
```

### No Results

```
No configurations found matching "XYZ-SERVER"

Suggestions:
  - Check spelling of the search term
  - Try a partial name match
  - Remove filters to broaden search
  - Search by IP or serial number instead

Example searches:
  /lookup-asset "XYZ"
  /lookup-asset "192.168"
```

## Filter Reference

### Type Values

| Value | Matches |
|-------|---------|
| server | Server configurations |
| workstation | Workstation configurations |
| network | Network devices (routers, switches, firewalls) |
| printer | Printer devices |
| mobile | Mobile devices |
| domain | Domain names |
| ssl | SSL certificates |
| cloud | Cloud services |

### Status Values

By default, only Active configurations are returned. All statuses are searched.

| Status | Description |
|--------|-------------|
| Active | Currently in use |
| Inactive | Not currently active |
| Decommissioned | End of life |

## Error Handling

### No Results

```
No configurations found matching "invalid-search"

Suggestions:
  - Verify the search term is correct
  - Try searching by a different identifier
  - Check if the asset exists in IT Glue
```

### Invalid Organization

```
Organization not found: "Acm"

Did you mean?
  - Acme Corporation
  - Acme East Division
  - Acme Industries

Try: /lookup-asset "DC-01" --organization "Acme Corporation"
```

### API Error

```
Error connecting to IT Glue API

Possible causes:
  - Invalid API key (check IT_GLUE_API_KEY)
  - Wrong region (check IT_GLUE_REGION)
  - Network connectivity issue

Retry or check configuration.
```

### Rate Limited

```
Rate limited by IT Glue API

Waiting 60 seconds before retry...
```

## Related Commands

- `/search-docs` - Search documentation
- `/get-password` - Get credentials for an asset
- `/find-organization` - Find organization details
