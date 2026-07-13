---
name: "Datto RMM Devices"
description: >
  Use this skill when working with Datto RMM devices - listing, searching,
  managing, and monitoring endpoints. Covers device identifiers (UID, hostname, MAC),
  device types (workstation, server, ESXi, network), statuses, user-defined fields (UDF1-30),
  warranty information, and device operations.
when_to_use: >-
  When listing, searching, managing, and monitoring endpoints. Use when: datto device, rmm device,
  device status, device lookup, managed device, device hostname, device online, device offline,
  endpoint management, or device udf.
---

# Datto RMM Device Management

## Overview

Devices are the core managed entities in Datto RMM. Each device represents an endpoint with the Datto agent installed - workstations, servers, ESXi hosts, or network devices. This skill covers device identification, status monitoring, user-defined fields, and common device operations.

## Key Concepts

### Device Identifiers

Every device has multiple identifiers:

| Identifier | Type | Description | Example |
|------------|------|-------------|---------|
| `deviceUid` | string | Globally unique identifier | `d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a` |
| `deviceId` | integer | Legacy numeric ID | `123456` |
| `hostname` | string | Computer name | `ACME-DC01` |
| `intIpAddress` | string | Internal IP address | `192.168.1.100` |
| `extIpAddress` | string | External/public IP | `203.0.113.50` |
| `macAddresses` | array | Network interface MACs | `["00:1A:2B:3C:4D:5E"]` |

### Device Types

| Type | Description | Typical Use |
|------|-------------|-------------|
| `Desktop` | Workstation/PC | End-user computers |
| `Laptop` | Portable workstation | Mobile workers |
| `Server` | Windows/Linux server | Infrastructure |
| `ESXi Host` | VMware hypervisor | Virtualization |
| `Network Device` | Router/switch/firewall | SNMP-monitored |
| `Printer` | Network printer | Print infrastructure |

### Device Status

| Status | Description | Business Impact |
|--------|-------------|-----------------|
| `online` | Agent checking in | Normal operation |
| `offline` | No agent communication | May require attention |
| `rebooting` | Restart in progress | Temporary state |
| `unknown` | Status undetermined | Check connectivity |

## Field Reference

### Core Device Fields

```typescript
interface Device {
  // Identifiers
  uid: string;                    // Unique device ID
  deviceId: number;               // Legacy numeric ID
  hostname: string;               // Computer name
  description: string;            // Custom description

  // Site Association
  siteUid: string;                // Parent site UID
  siteName: string;               // Site display name

  // Type and Status
  deviceType: DeviceType;         // Desktop, Laptop, Server, etc.
  deviceClass: string;            // device, esxihost, printer, etc.
  status: DeviceStatus;           // online, offline, rebooting

  // Network
  intIpAddress: string;           // Internal IP
  extIpAddress: string;           // External IP
  macAddresses: string[];         // MAC addresses

  // Operating System
  operatingSystem: string;        // "Windows 11 Pro"
  osType: string;                 // "Windows", "macOS", "Linux"
  osVersion: string;              // "10.0.22631"
  osSerialNumber: string;         // Windows product key

  // Hardware
  manufacturer: string;           // "Dell Inc."
  model: string;                  // "OptiPlex 7090"
  serialNumber: string;           // Hardware serial

  // Agent Info
  agentVersion: string;           // "2.5.0.1234"
  agentPlatform: string;          // Platform agent was installed from

  // Timestamps (Unix milliseconds)
  lastSeen: number;               // Last agent check-in
  lastReboot: number;             // Last system restart
  createdAt: number;              // When device was added
  warrantyExpiry: number;         // Warranty end date

  // User-Defined Fields
  udf1: string;                   // Custom field 1
  udf2: string;                   // Custom field 2
  // ... up to udf30

  // Counts
  openAlertCount: number;         // Active alerts
  patchStatus: PatchStatus;       // Patch compliance
}

type DeviceType = 'Desktop' | 'Laptop' | 'Server' | 'ESXi Host' | 'Network Device' | 'Printer';
type DeviceStatus = 'online' | 'offline' | 'rebooting' | 'unknown';
```

### User-Defined Fields (UDF)

Datto RMM provides 30 custom fields per device:

| Field | Type | Max Length | Description |
|-------|------|------------|-------------|
| `udf1` - `udf30` | string | 255 chars | Custom data fields |

**Common UDF Uses:**
- `udf1`: Asset tag
- `udf2`: Department
- `udf3`: Primary user
- `udf4`: Location/floor
- `udf5`: Purchase date
- `udf6`: Lease expiration

## API Patterns

### List All Devices

```http
GET /api/v2/devices?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "devices": [
    {
      "uid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
      "hostname": "ACME-DC01",
      "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "siteName": "Acme Corporation",
      "deviceType": "Server",
      "status": "online",
      "intIpAddress": "192.168.1.10",
      "operatingSystem": "Windows Server 2022 Standard",
      "lastSeen": 1707991200000,
      "openAlertCount": 2
    }
  ],
  "pageDetails": {
    "count": 250,
    "nextPageUrl": "/api/v2/devices?max=250&page=abc123"
  }
}
```

### Get Single Device

```http
GET /api/v2/device/{deviceUid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "uid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "hostname": "ACME-DC01",
  "description": "Primary Domain Controller",
  "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "siteName": "Acme Corporation",
  "deviceType": "Server",
  "deviceClass": "device",
  "status": "online",
  "intIpAddress": "192.168.1.10",
  "extIpAddress": "203.0.113.50",
  "macAddresses": ["00:1A:2B:3C:4D:5E"],
  "operatingSystem": "Windows Server 2022 Standard",
  "osVersion": "10.0.20348",
  "manufacturer": "Dell Inc.",
  "model": "PowerEdge R640",
  "serialNumber": "ABC1234567",
  "agentVersion": "2.5.0.1234",
  "lastSeen": 1707991200000,
  "lastReboot": 1707800000000,
  "createdAt": 1680000000000,
  "warrantyExpiry": 1750000000000,
  "udf1": "ASSET-00123",
  "udf2": "IT Infrastructure",
  "udf3": "John Admin",
  "openAlertCount": 2,
  "patchStatus": {
    "patchesApproved": 5,
    "patchesPending": 2,
    "patchesFailed": 0
  }
}
```

### Get Devices by Site

```http
GET /api/v2/site/{siteUid}/devices?max=250
Authorization: Bearer {token}
```

### Update Device

```http
POST /api/v2/device/{deviceUid}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "udf1": "NEW-ASSET-TAG",
  "udf2": "Finance Department"
}
```

### Delete Device

```http
DELETE /api/v2/device/{deviceUid}
Authorization: Bearer {token}
```

**Note:** Deleting a device removes it from Datto RMM but does not uninstall the agent.

## Workflows

### Device Lookup by Hostname

```javascript
async function findDeviceByHostname(client, hostname) {
  // Fetch all devices (with pagination)
  const allDevices = [];
  let url = '/api/v2/devices?max=250';

  while (url) {
    const response = await client.request(url);
    allDevices.push(...response.devices);
    url = response.pageDetails?.nextPageUrl;
  }

  // Search case-insensitive
  const matches = allDevices.filter(d =>
    d.hostname.toLowerCase().includes(hostname.toLowerCase())
  );

  if (matches.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (matches.length === 1) {
    return { found: true, device: matches[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: matches.map(d => ({
      hostname: d.hostname,
      uid: d.uid,
      site: d.siteName
    }))
  };
}
```

### Device Lookup by IP Address

```javascript
async function findDeviceByIP(client, ipAddress) {
  const allDevices = await fetchAllDevices(client);

  const device = allDevices.find(d =>
    d.intIpAddress === ipAddress || d.extIpAddress === ipAddress
  );

  return device || null;
}
```

### Device Lookup by MAC Address

```javascript
async function findDeviceByMAC(client, macAddress) {
  const normalizedMAC = macAddress.toUpperCase().replace(/[:-]/g, ':');
  const allDevices = await fetchAllDevices(client);

  const device = allDevices.find(d =>
    d.macAddresses?.some(mac =>
      mac.toUpperCase().replace(/[:-]/g, ':') === normalizedMAC
    )
  );

  return device || null;
}
```

### Offline Device Report

```javascript
async function getOfflineDevices(client, options = {}) {
  const {
    siteUid,
    offlineThresholdMinutes = 30
  } = options;

  const url = siteUid
    ? `/api/v2/site/${siteUid}/devices?max=250`
    : '/api/v2/devices?max=250';

  const allDevices = await fetchAllPaginated(client, url);
  const now = Date.now();
  const threshold = offlineThresholdMinutes * 60 * 1000;

  return allDevices.filter(device => {
    if (device.status === 'offline') return true;
    if (!device.lastSeen) return true;

    // Check if last seen exceeds threshold
    return (now - device.lastSeen) > threshold;
  }).map(device => ({
    hostname: device.hostname,
    uid: device.uid,
    site: device.siteName,
    lastSeen: new Date(device.lastSeen).toISOString(),
    offlineMinutes: Math.floor((now - device.lastSeen) / 60000)
  }));
}
```

### Bulk UDF Update

```javascript
async function bulkUpdateUDF(client, updates) {
  // updates: [{ deviceUid, udf1, udf2, ... }, ...]

  const results = [];

  for (const update of updates) {
    try {
      const { deviceUid, ...fields } = update;
      await client.request(`/api/v2/device/${deviceUid}`, {
        method: 'POST',
        body: JSON.stringify(fields)
      });
      results.push({ deviceUid, success: true });
    } catch (error) {
      results.push({ deviceUid, success: false, error: error.message });
    }

    // Respect rate limits
    await sleep(100);
  }

  return results;
}
```

## Error Handling

### Common Device API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device not found | 404 | Invalid UID | Verify device exists |
| Invalid field value | 400 | UDF too long | Max 255 characters |
| Permission denied | 403 | API key restrictions | Check API permissions |
| Device locked | 409 | Concurrent update | Retry after delay |

### Error Response Example

```json
{
  "errorCode": "DEVICE_NOT_FOUND",
  "message": "Device with UID 'd4e5f6a7-...' not found",
  "details": {
    "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"
  }
}
```

### Device Validation

```javascript
function validateDeviceUpdate(fields) {
  const errors = [];

  // Check UDF lengths
  for (let i = 1; i <= 30; i++) {
    const field = `udf${i}`;
    if (fields[field] && fields[field].length > 255) {
      errors.push(`${field} exceeds 255 character limit`);
    }
  }

  // Validate description
  if (fields.description && fields.description.length > 1000) {
    errors.push('Description exceeds 1000 character limit');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Best Practices

1. **Use UID not hostname for lookups** - UIDs are guaranteed unique
2. **Cache device lists** - Full device list changes infrequently
3. **Use site-scoped queries** - Reduce data transfer when possible
4. **Monitor offline devices** - Set up alerts for extended offline status
5. **Standardize UDF usage** - Document which UDFs are used for what
6. **Handle pagination** - Always process `nextPageUrl`
7. **Normalize MAC addresses** - Handle different formats (colons, dashes, none)
8. **Check lastSeen vs status** - Status may lag behind actual connectivity
9. **Track agent versions** - Plan upgrades based on version distribution
10. **Document warranty info** - Use UDFs for hardware lifecycle management

## Device Status Business Logic

### Determining True Online Status

```javascript
function getDeviceEffectiveStatus(device) {
  const now = Date.now();
  const lastSeenMinutesAgo = (now - device.lastSeen) / 60000;

  if (device.status === 'online' && lastSeenMinutesAgo < 15) {
    return 'online';
  }

  if (device.status === 'rebooting') {
    return 'rebooting';
  }

  if (lastSeenMinutesAgo > 60) {
    return 'offline';
  }

  if (lastSeenMinutesAgo > 30) {
    return 'stale';
  }

  return device.status;
}
```

### Device Health Summary

```javascript
function getDeviceHealthSummary(device) {
  const issues = [];

  // Check online status
  if (device.status !== 'online') {
    issues.push({ severity: 'warning', message: `Device is ${device.status}` });
  }

  // Check open alerts
  if (device.openAlertCount > 0) {
    const severity = device.openAlertCount > 5 ? 'critical' : 'warning';
    issues.push({
      severity,
      message: `${device.openAlertCount} open alert(s)`
    });
  }

  // Check patch status
  if (device.patchStatus?.patchesFailed > 0) {
    issues.push({
      severity: 'warning',
      message: `${device.patchStatus.patchesFailed} failed patch(es)`
    });
  }

  // Check warranty
  if (device.warrantyExpiry && device.warrantyExpiry < Date.now()) {
    issues.push({
      severity: 'info',
      message: 'Warranty expired'
    });
  }

  return {
    healthy: issues.length === 0,
    issues
  };
}
```

## Related Skills

- [Datto RMM Alerts](../alerts/SKILL.md) - Device alert management
- [Datto RMM Audit](../audit/SKILL.md) - Device hardware/software inventory
- [Datto RMM Jobs](../jobs/SKILL.md) - Running jobs on devices
- [Datto RMM Sites](../sites/SKILL.md) - Site-level device management
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
