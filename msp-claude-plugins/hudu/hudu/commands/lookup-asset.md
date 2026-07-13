---
description: Find an asset in Hudu by name, hostname, serial number, or IP address
argument-hint: "<query> [company] [layout]"
arguments: [query, company, layout]
---

# Lookup Hudu Asset

Find an asset in Hudu by various identifiers.

## Prerequisites

- Valid Hudu API key configured (`HUDU_API_KEY`)
- Hudu base URL configured (`HUDU_BASE_URL`)
- User must have asset read permissions

## Steps

1. **Parse search query**
   - Determine if query is name, hostname, serial number, or IP
   - Resolve company name to ID if provided
   - Map layout filter to asset layout ID

2. **Execute search**
   - Search assets by name and custom fields
   - Apply company and layout filters
   - Fetch related data (company, layout details)

3. **Format and return results**
   - Display asset details with key information
   - Include quick actions for further operations

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search term (name, hostname, serial, IP) |
| company | string | No | - | Company name filter |
| layout | string | No | - | Asset layout name filter (server/workstation/network) |

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

### Filter by Company

```
/lookup-asset "DC-01" --company "Acme Corp"
```

### Filter by Layout

```
/lookup-asset "firewall" --layout "Network Device"
```

### Combined Filters

```
/lookup-asset "01" --company "Acme" --layout "Server"
```

## Output

### Single Match

```
Found 1 asset matching "DC-01"

Asset: DC-01
------------------------------------------------------------
Company:       Acme Corporation
Layout:        Server
Serial:        ABC123456789
Model:         Dell PowerEdge R740

Custom Fields:
  Hostname:          dc-01.acme.local
  IP Address:        192.168.1.10
  Operating System:  Windows Server 2022
  RAM (GB):          32
  Warranty Expiry:   2027-01-15 (730 days remaining)

Last Updated:  2025-12-01

Quick Actions:
  - View in Hudu: [link]
  - Related passwords: /get-password --company "Acme Corp" "DC-01"
  - View articles: /search-articles "DC-01" --company "Acme Corp"
------------------------------------------------------------
```

### Multiple Matches

```
Found 3 assets matching "DC"

+------------------+------------------+----------+----------------+-------------+
| Name             | Company          | Layout   | Serial         | Updated     |
+------------------+------------------+----------+----------------+-------------+
| DC-01            | Acme Corp        | Server   | ABC123456789   | 2025-12-01  |
| DC-02            | Acme Corp        | Server   | DEF987654321   | 2025-11-15  |
| NYC-DC-01        | Acme East        | Server   | GHI456789012   | 2025-10-20  |
+------------------+------------------+----------+----------------+-------------+

Refine search:
  - Add company: /lookup-asset "DC" --company "Acme Corp"
  - Add layout: /lookup-asset "DC" --layout "Server"
```

### No Results

```
No assets found matching "XYZ-SERVER"

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

### Common Layout Names

| Layout | Description |
|--------|-------------|
| Server | Physical or virtual servers |
| Workstation | End-user devices |
| Network Device | Routers, switches, firewalls |
| Printer | Print devices |
| Application | Software/services |
| Microsoft 365 | M365 tenant details |
| Backup | Backup configurations |

Note: Asset layout names are custom per Hudu instance. Use `/api/v1/asset_layouts` to see available layouts.

## Error Handling

### No Results

```
No assets found matching "invalid-search"

Suggestions:
  - Verify the search term is correct
  - Try searching by a different identifier
  - Check if the asset exists in Hudu
```

### Invalid Company

```
Company not found: "Acm"

Did you mean?
  - Acme Corporation
  - Acme East Division
  - Acme Industries

Try: /lookup-asset "DC-01" --company "Acme Corporation"
```

### API Error

```
Error connecting to Hudu API

Possible causes:
  - Invalid API key (check HUDU_API_KEY)
  - Wrong base URL (check HUDU_BASE_URL)
  - Network connectivity issue

Retry or check configuration.
```

### Rate Limited

```
Rate limited by Hudu API (300 requests/minute)

Waiting 60 seconds before retry...
```

## Related Commands

- `/search-articles` - Search knowledge base articles
- `/get-password` - Get credentials for an asset
- `/find-company` - Find company details
