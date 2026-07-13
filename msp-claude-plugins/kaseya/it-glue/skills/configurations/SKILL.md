---
name: "IT Glue Configurations"
description: >
  Use this skill when working with IT Glue configurations (assets) - servers,
  workstations, network devices, and other infrastructure. Covers configuration
  types, statuses, network interfaces, related items, asset tracking, warranty
  management, and PSA integration for comprehensive asset documentation.
when_to_use: >-
  When working with servers, workstations, network devices, and other infrastructure in IT Glue
  configurations (assets). Use when: it glue configuration, it glue asset, server documentation,
  workstation lookup, network device, asset management, configuration item, it glue ci, device
  inventory, or hardware tracking.
---

# IT Glue Configurations Management

## Overview

Configurations in IT Glue represent trackable assets such as servers, workstations, network devices, printers, and more. They serve as the central repository for asset documentation, enabling technicians to quickly find device information, network details, warranty status, and related documentation.

## Key Concepts

### Configuration Types

Configuration types classify assets at the highest level:

| Type | Description | Examples |
|------|-------------|----------|
| Server | Physical or virtual servers | Domain controllers, file servers, application servers |
| Workstation | End-user devices | Desktops, laptops |
| Network Device | Network infrastructure | Routers, switches, firewalls, access points |
| Printer | Print devices | Network printers, multifunction devices |
| Mobile Device | Portable devices | Tablets, phones |
| Domain | Internet domains | Primary domains, subdomains |
| SSL Certificate | Security certificates | Web certificates, code signing |
| Cloud Service | Cloud subscriptions | Microsoft 365, AWS, Azure |
| Software | Software licenses | Application licenses |
| Other | Miscellaneous | UPS, cameras, IoT devices |

### Configuration Statuses

| Status | Description | Business Logic |
|--------|-------------|----------------|
| Active | Currently in use | Standard operational state |
| Inactive | Not currently in use | Spare or standby equipment |
| Decommissioned | End of life | Historical record only |
| Missing | Cannot locate | Requires investigation |

### Configuration Interfaces

Network interfaces associated with a configuration:

```
Configuration: DC-01 (Server)
├── Interface: Ethernet0 (192.168.1.10, AA:BB:CC:DD:EE:01)
├── Interface: Ethernet1 (10.0.0.10, AA:BB:CC:DD:EE:02)
└── Interface: iLO (192.168.100.10, AA:BB:CC:DD:EE:03)
```

## Field Reference

### Core Identification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `name` | string | Yes | Display name |
| `hostname` | string | No | Network hostname |
| `configuration-type-id` | integer | No | Type classification |
| `configuration-status-id` | integer | No | Status classification |

### Hardware Fields

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer-id` | integer | Manufacturer reference |
| `model-id` | integer | Model reference |
| `serial-number` | string | Serial number |
| `asset-tag` | string | Internal asset tag |

### Network Fields

| Field | Type | Description |
|-------|------|-------------|
| `primary-ip` | string | Primary IP address |
| `mac-address` | string | Primary MAC address |
| `default-gateway` | string | Default gateway |
| `installed-by` | string | Installer name |

### Lifecycle Fields

| Field | Type | Description |
|-------|------|-------------|
| `purchased-at` | date | Purchase date |
| `installed-at` | date | Installation date |
| `warranty-expires-at` | date | Warranty expiration |

### Documentation Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Detailed notes (HTML) |
| `operating-system-notes` | string | OS-specific notes |

### PSA Integration Fields

| Field | Type | Description |
|-------|------|-------------|
| `psa-id` | string | PSA configuration item ID |
| `psa-integration-type` | string | PSA platform type |
| `rmm-id` | string | RMM agent/device ID |
| `rmm-integration-type` | string | RMM platform type |

## API Patterns

### List Configurations

```http
GET /configurations
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**By Organization:**
```http
GET /organizations/123/relationships/configurations
```

**With Filters:**
```http
GET /configurations?filter[organization-id]=123&filter[configuration-type-id]=456&filter[configuration-status-id]=1
```

**With Pagination:**
```http
GET /configurations?page[size]=100&page[number]=1&sort=name
```

### Get Single Configuration

```http
GET /configurations/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /configurations/789?include=organization,configuration-interfaces,related-items
```

### Create Configuration

```http
POST /configurations
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

**Server Example:**
```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "organization-id": 123456,
      "name": "DC-01",
      "hostname": "dc-01.acme.local",
      "configuration-type-id": 12,
      "configuration-status-id": 1,
      "primary-ip": "192.168.1.10",
      "serial-number": "ABC123456789",
      "notes": "<p>Primary domain controller for Acme Corporation</p>"
    }
  }
}
```

**Workstation Example:**
```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "organization-id": 123456,
      "name": "WS-JSMITH",
      "hostname": "ws-jsmith.acme.local",
      "configuration-type-id": 15,
      "configuration-status-id": 1,
      "primary-ip": "192.168.1.150",
      "asset-tag": "ACME-WS-0042",
      "notes": "<p>User: John Smith (Sales)</p>"
    }
  }
}
```

### Update Configuration

```http
PATCH /configurations/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "primary-ip": "192.168.1.20",
      "notes": "<p>Updated IP after network migration</p>"
    }
  }
}
```

### Delete Configuration

```http
DELETE /configurations/789
x-api-key: YOUR_API_KEY
```

### Search by Various Fields

**By Hostname:**
```http
GET /configurations?filter[hostname]=dc-01
```

**By Serial Number:**
```http
GET /configurations?filter[serial-number]=ABC123
```

**By IP Address:**
```http
GET /configurations?filter[primary-ip]=192.168.1.10
```

**By PSA ID:**
```http
GET /configurations?filter[psa-id]=54321
```

## Configuration Interfaces

### List Interfaces

```http
GET /configurations/789/relationships/configuration-interfaces
```

### Create Interface

```http
POST /configuration-interfaces
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "configuration-interfaces",
    "attributes": {
      "configuration-id": 789,
      "name": "Ethernet0",
      "ip-address": "192.168.1.10",
      "mac-address": "AA:BB:CC:DD:EE:FF",
      "primary": true,
      "notes": "Primary LAN interface"
    }
  }
}
```

## Related Items

### List Related Items

```http
GET /configurations/789/relationships/related-items
```

### Create Relationship

```http
POST /related-items
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "related-items",
    "attributes": {
      "resource-id": 789,
      "resource-type": "Configuration",
      "destination-id": 456,
      "destination-type": "Configuration",
      "notes": "VM hosted on this hypervisor"
    }
  }
}
```

## Common Workflows

### Asset Onboarding

```javascript
async function onboardAsset(orgId, assetData) {
  // Step 1: Create configuration
  const config = await createConfiguration({
    'organization-id': orgId,
    name: assetData.name,
    hostname: assetData.hostname,
    'configuration-type-id': assetData.typeId,
    'configuration-status-id': ACTIVE_STATUS,
    'primary-ip': assetData.ip,
    'serial-number': assetData.serialNumber,
    'asset-tag': assetData.assetTag,
    'purchased-at': assetData.purchaseDate,
    'warranty-expires-at': assetData.warrantyDate,
    notes: assetData.notes
  });

  // Step 2: Add network interfaces
  for (const iface of assetData.interfaces || []) {
    await createInterface({
      'configuration-id': config.id,
      name: iface.name,
      'ip-address': iface.ip,
      'mac-address': iface.mac,
      primary: iface.primary
    });
  }

  // Step 3: Create relationships if applicable
  if (assetData.hostServer) {
    await createRelatedItem({
      'resource-id': config.id,
      'resource-type': 'Configuration',
      'destination-id': assetData.hostServer,
      'destination-type': 'Configuration',
      notes: 'Hosted on this server'
    });
  }

  return config;
}
```

### Warranty Tracking

```javascript
async function getExpiringWarranties(daysAhead = 90) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const today = new Date().toISOString().split('T')[0];
  const future = futureDate.toISOString().split('T')[0];

  // Note: IT Glue doesn't support date range filters directly
  // Fetch all and filter client-side
  const configs = await fetchConfigurations({
    filter: { 'configuration-status-id': ACTIVE_STATUS }
  });

  return configs
    .filter(c => {
      const warranty = c.attributes['warranty-expires-at'];
      return warranty && warranty >= today && warranty <= future;
    })
    .map(c => ({
      name: c.attributes.name,
      organization: c.relationships.organization.data.id,
      warrantyExpires: c.attributes['warranty-expires-at'],
      daysRemaining: Math.ceil(
        (new Date(c.attributes['warranty-expires-at']) - new Date()) / (1000 * 60 * 60 * 24)
      )
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
```

### Asset Decommissioning

```javascript
async function decommissionAsset(configId, reason) {
  // Update status
  await updateConfiguration(configId, {
    'configuration-status-id': DECOMMISSIONED_STATUS,
    notes: `<p><strong>Decommissioned:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${reason}</p>`
  });

  // Add note about decommissioning
  return { status: 'decommissioned', configId, reason };
}
```

### Network Inventory Report

```javascript
async function generateNetworkInventory(orgId) {
  const configs = await fetchConfigurations({
    filter: {
      'organization-id': orgId,
      'configuration-status-id': ACTIVE_STATUS
    },
    include: 'configuration-interfaces'
  });

  return configs.map(config => ({
    name: config.attributes.name,
    hostname: config.attributes.hostname,
    type: config.relationships['configuration-type']?.data?.id,
    primaryIp: config.attributes['primary-ip'],
    interfaces: config.relationships['configuration-interfaces']?.data?.map(iface => ({
      name: iface.attributes.name,
      ip: iface.attributes['ip-address'],
      mac: iface.attributes['mac-address']
    })) || []
  }));
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide configuration name |
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Configuration not found | Verify configuration ID |
| 422 | Invalid type ID | Query valid type IDs first |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Organization required | No org ID | Include organization-id |
| Invalid type | Bad type ID | Query /configuration-types |
| Invalid status | Bad status ID | Query /configuration-statuses |
| Invalid IP format | Malformed IP | Use valid IPv4/IPv6 format |

### Error Recovery Pattern

```javascript
async function safeCreateConfiguration(data) {
  try {
    return await createConfiguration(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle missing type
      if (errors.some(e => e.detail?.includes('configuration-type'))) {
        const types = await getConfigurationTypes();
        console.log('Valid configuration types:', types);
      }

      // Handle duplicate
      if (errors.some(e => e.detail?.includes('already been taken'))) {
        return await findConfigurationByName(data['organization-id'], data.name);
      }
    }

    throw error;
  }
}
```

## Best Practices

1. **Standardize naming** - Use consistent format (e.g., SITE-TYPE-NUM: NYC-DC-01)
2. **Always set organization** - All configurations must belong to an organization
3. **Track serial numbers** - Enable warranty lookups and asset verification
4. **Document network info** - Include IP, MAC, hostname for troubleshooting
5. **Use interfaces** - Document all network interfaces, not just primary
6. **Create relationships** - Link VMs to hosts, apps to servers
7. **Set warranty dates** - Enable proactive renewal planning
8. **Include notes** - Document purpose, users, special configurations
9. **Link to PSA** - Set psa-id for cross-platform lookups
10. **Regular audits** - Verify configuration accuracy quarterly

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Parent organization management
- [IT Glue Passwords](../passwords/SKILL.md) - Device credentials
- [IT Glue Documents](../documents/SKILL.md) - Device documentation
- [IT Glue Flexible Assets](../flexible-assets/SKILL.md) - Custom documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
