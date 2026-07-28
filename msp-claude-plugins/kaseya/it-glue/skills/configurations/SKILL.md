---
name: "IT Glue Configurations"
description: >
  IT Glue configurations (assets) — servers, workstations, network devices,
  and other infrastructure: configuration types and statuses, network
  interfaces, related items, warranty/lifecycle fields, and PSA/RMM
  integration fields.
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

### Field Reference

Fields cover identification, hardware, network, lifecycle, documentation, and PSA/RMM integration. See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

Configurations support the standard list/get/create/update/delete verbs, plus organization-scoped listing (`/organizations/:id/relationships/configurations`), search by hostname/serial-number/primary-ip/psa-id, nested configuration-interfaces, and related-items relationships for linking assets to each other (e.g. VM to host). See [references/api.md](references/api.md) for full request/response examples of every operation.

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

IT Glue doesn't support date-range filters directly, so warranty lookups fetch active configurations and filter client-side:

```javascript
async function getExpiringWarranties(daysAhead = 90) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const today = new Date().toISOString().split('T')[0];
  const future = futureDate.toISOString().split('T')[0];

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

## Gotchas

- IT Glue has no server-side date-range filter, so warranty/expiration reporting must fetch and filter client-side (see Warranty Tracking above).
- `configuration-type-id` and `configuration-status-id` are references to org-specific lookup tables, not fixed enums — query `/configuration-types` and `/configuration-statuses` before creating, since an unrecognized ID returns a 422 rather than a clear "invalid type" message.

See [references/errors.md](references/errors.md) for the common error/validation tables and an error-recovery pattern that queries valid types on 422.

## Best Practices

1. **Standardize naming** - Use consistent format (e.g., SITE-TYPE-NUM: NYC-DC-01)
2. **Always set organization** - All configurations must belong to an organization
3. **Track serial numbers** - Enable warranty lookups and asset verification
4. **Document network info** - Include IP, MAC, hostname for troubleshooting
5. **Use interfaces** - Document all network interfaces, not just primary
6. **Create relationships** - Link VMs to hosts, apps to servers
7. **Set warranty dates** - Enable proactive renewal planning
8. **Link to PSA** - Set psa-id for cross-platform lookups

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Parent organization management
- [IT Glue Passwords](../passwords/SKILL.md) - Device credentials
- [IT Glue Documents](../documents/SKILL.md) - Device documentation
- [IT Glue Flexible Assets](../flexible-assets/SKILL.md) - Custom documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
