---
description: Find a device in Datto RMM by hostname, IP address, or MAC address
argument-hint: "<identifier> [site]"
arguments: [identifier, site]
---

# Device Lookup

Find a device in Datto RMM by hostname, IP address, or MAC address.

## Prerequisites

- Valid Datto RMM API credentials configured
- `DATTO_API_KEY` and `DATTO_API_SECRET` environment variables set
- `DATTO_PLATFORM` configured (pinotage, merlot, concord, vidal, zinfandel, syrah)

## Steps

1. **Determine identifier type**
   - If matches IP format (e.g., `192.168.1.100`), search by IP
   - If matches MAC format (e.g., `00:1A:2B:3C:4D:5E`), search by MAC
   - Otherwise, search by hostname

2. **Fetch device list**
   - If site specified, use `/api/v2/site/{siteUid}/devices`
   - Otherwise, use `/api/v2/devices` with pagination

3. **Search devices**
   ```javascript
   // For hostname
   devices.filter(d =>
     d.hostname.toLowerCase().includes(identifier.toLowerCase())
   )

   // For IP address
   devices.filter(d =>
     d.intIpAddress === identifier || d.extIpAddress === identifier
   )

   // For MAC address
   devices.filter(d =>
     d.macAddresses?.some(mac => normalizeMAC(mac) === normalizeMAC(identifier))
   )
   ```

4. **Handle multiple matches**
   - If exact match found, return full details
   - If multiple partial matches, list them for user selection

5. **Fetch additional details for matched device**
   - Get device alerts: `GET /api/v2/device/{deviceUid}/alerts/open`
   - Get device audit (optional): `GET /api/v2/device/{deviceUid}/audit`

6. **Return device information**
   - Basic device details
   - Online/offline status
   - Open alert count
   - Site information
   - Last seen timestamp

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| identifier | string | Yes | - | Hostname, IP address, or MAC address |
| site | string | No | - | Filter by site name (partial match) |

## Examples

### Lookup by Hostname

```
/device-lookup "ACME-DC01"
```

### Lookup by Partial Hostname

```
/device-lookup "DC01"
```

### Lookup by IP Address

```
/device-lookup "192.168.1.100"
```

### Lookup by MAC Address

```
/device-lookup "00:1A:2B:3C:4D:5E"
```

```
/device-lookup "00-1A-2B-3C-4D-5E"
```

### Lookup with Site Filter

```
/device-lookup "DC01" --site "Acme Corp"
```

## Output

### Single Device Found

```
Device Found

Hostname:     ACME-DC01
Device UID:   d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a
Site:         Acme Corporation
Status:       Online
Last Seen:    2024-02-15 10:30:00 UTC (5 minutes ago)

Device Type:  Server
OS:           Windows Server 2022 Standard
IP (Internal): 192.168.1.10
IP (External): 203.0.113.50
MAC:          00:1A:2B:3C:4D:5E

Hardware:
  Manufacturer: Dell Inc.
  Model:        PowerEdge R640
  Serial:       ABC1234567

Alerts:       2 open alerts
  - [High] Disk C: is 92% full
  - [Moderate] Windows Update pending reboot

Agent:        v2.5.0.1234
Last Reboot:  2024-02-10 03:00:00 UTC (5 days ago)
```

### Multiple Matches Found

```
Multiple devices found matching "DC01":

  # | Hostname      | Site               | Status  | IP Address
----+---------------+--------------------+---------+---------------
  1 | ACME-DC01     | Acme Corporation   | Online  | 192.168.1.10
  2 | ACME-DC02     | Acme Corporation   | Online  | 192.168.1.11
  3 | TECHSTART-DC01| TechStart Inc      | Offline | 10.0.0.5

Specify a more precise identifier or use --site to filter.
```

### No Device Found

```
No device found matching "UNKNOWN-PC"

Suggestions:
- Verify the hostname/IP/MAC is correct
- Check if the device has the Datto agent installed
- Device may be in a different site - try without --site filter
```

## Error Handling

### Invalid API Credentials

```
Authentication failed

Unable to authenticate with Datto RMM API.
Please verify your credentials:
- DATTO_API_KEY
- DATTO_API_SECRET
- DATTO_PLATFORM

Documentation: https://rmm.datto.com/help/en/Content/2SETUP/APIv2.htm
```

### Site Not Found

```
Site not found: "Acme"

Did you mean one of these?
- Acme Corporation
- Acme Corp - Remote
- Acme Industries

Use the full site name or remove --site to search all sites.
```

### Rate Limited

```
Rate limit exceeded

The Datto RMM API rate limit has been reached.
Waiting 60 seconds before retrying...

[Progress bar or countdown]
```

### Device Offline Warning

```
Device Found (Offline Warning)

Hostname:     ACME-WKS01
Status:       OFFLINE
Last Seen:    2024-02-14 15:45:00 UTC (18 hours ago)

Note: This device has been offline for an extended period.
Consider:
- Checking physical connectivity
- Verifying the device is powered on
- Contacting on-site personnel
```

## Related Commands

- `/site-devices` - List all devices at a site
- `/resolve-alert` - Resolve alerts on a device
- `/run-job` - Run a job on the device

## Related Skills

- [Devices Skill](../skills/devices/SKILL.md) - Device management patterns
- [API Patterns Skill](../skills/api-patterns/SKILL.md) - Authentication and pagination
