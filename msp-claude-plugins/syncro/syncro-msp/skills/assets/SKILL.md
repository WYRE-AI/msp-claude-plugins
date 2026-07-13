---
name: "Syncro Assets"
description: >
  Use this skill when working with Syncro MSP assets - tracking hardware,
  software, and devices for customers. Covers asset fields, RMM integration,
  patch management, and asset-related operations. Essential for MSP inventory
  management and endpoint monitoring through Syncro.
when_to_use: >-
  When tracking hardware, software, and devices for customers. Use when: syncro asset, syncro
  device, syncro computer, asset management syncro, rmm syncro, syncro inventory, syncro endpoint,
  patch management syncro, asset search syncro, or syncro hardware.
---

# Syncro MSP Asset Management

## Overview

Syncro assets represent the hardware, software, and devices you manage for customers. Assets integrate with Syncro's built-in RMM capabilities for monitoring, patch management, and remote access. This skill covers asset tracking, RMM integration, and inventory management.

## Key Concepts

### Asset

A tracked device or piece of equipment for a customer.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Unique identifier |
| `customer_id` | integer | Yes | Associated customer |
| `asset_type` | string | Yes | Type classification |
| `name` | string | Yes | Asset name/hostname |
| `serial_number` | string | No | Serial number |
| `model` | string | No | Model name/number |
| `manufacturer` | string | No | Manufacturer/vendor |
| `purchase_date` | date | No | When purchased |
| `warranty_expires` | date | No | Warranty expiration |
| `notes` | text | No | Internal notes |
| `properties` | object | No | Custom properties |

### Asset Types

Common asset type classifications:

| Type | Description |
|------|-------------|
| Desktop | Desktop computers |
| Laptop | Portable computers |
| Server | Server systems |
| Network Device | Routers, switches, firewalls |
| Printer | Printers and MFPs |
| Mobile Device | Phones, tablets |
| Other | Miscellaneous hardware |

### RMM Properties

When RMM agent is installed, additional data is collected:

| Property | Description |
|----------|-------------|
| `os_name` | Operating system name |
| `os_version` | OS version string |
| `last_seen` | Last check-in timestamp |
| `online` | Current online status |
| `cpu` | Processor information |
| `memory` | Total RAM |
| `disk_space` | Storage capacity |
| `ip_address` | Current IP address |
| `mac_address` | Network MAC address |
| `logged_in_user` | Current logged-in user |

## API Patterns

### Creating an Asset

```http
POST /api/v1/customer_assets
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

```json
{
  "customer_id": 12345,
  "asset_type": "Desktop",
  "name": "ACME-WKS-001",
  "serial_number": "ABC123456",
  "model": "OptiPlex 7090",
  "manufacturer": "Dell",
  "purchase_date": "2024-01-15",
  "warranty_expires": "2027-01-15",
  "notes": "Finance department workstation"
}
```

### Searching Assets

**All assets for a customer:**
```http
GET /api/v1/customer_assets?customer_id=12345
```

**Search by name/hostname:**
```http
GET /api/v1/customer_assets?query=ACME-WKS
```

**Filter by asset type:**
```http
GET /api/v1/customer_assets?asset_type=Server
```

**Paginated listing:**
```http
GET /api/v1/customer_assets?page=1
```

### Getting Asset Details

```http
GET /api/v1/customer_assets/{id}
```

**Response includes:**
- Asset information
- RMM properties (if agent installed)
- Recent activity
- Associated tickets

### Updating an Asset

```http
PUT /api/v1/customer_assets/{id}
Content-Type: application/json
```

```json
{
  "name": "ACME-WKS-001-NEW",
  "notes": "Renamed per naming convention update"
}
```

### Deleting an Asset

```http
DELETE /api/v1/customer_assets/{id}
```

### Getting Patch Information

```http
GET /api/v1/customer_assets/{id}/patches
```

**Response includes:**
- Available Windows updates
- Installed patches
- Patch status

## RMM Integration

### Agent Status Indicators

| Status | Description |
|--------|-------------|
| Online | Agent actively checking in |
| Offline | No recent check-in |
| Needs Attention | Alerts or issues detected |
| Updating | Agent update in progress |

### Remote Access

Syncro provides built-in remote access for managed assets:

- **Remote Desktop** - Full screen control
- **Remote Shell** - Command line access
- **File Transfer** - Upload/download files
- **Remote Tools** - Task manager, services, etc.

### Scripting

Run scripts on managed assets:

```http
POST /api/v1/customer_assets/{id}/run_script
Content-Type: application/json
```

```json
{
  "script_id": 456,
  "parameters": {
    "param1": "value1"
  }
}
```

## Common Workflows

### Asset Deployment

1. **Create asset record**
   - Enter hardware details
   - Set customer association
   - Document serial/warranty

2. **Deploy RMM agent**
   - Generate installer
   - Install on device
   - Verify check-in

3. **Configure monitoring**
   - Set up alerts
   - Configure patch policy
   - Enable remote access

4. **Document in notes**
   - Location/user
   - Special configurations
   - Important contacts

### Asset Audit

1. **Export asset list** for customer
2. **Compare to physical inventory**
3. **Update records** for discrepancies
4. **Flag for decommission** as needed
5. **Report to customer** with findings

### Warranty Tracking

1. **Set warranty expiration** dates
2. **Create reports** for expiring warranties
3. **Notify customers** before expiration
4. **Assist with renewals** or replacements

### Decommissioning

1. **Uninstall RMM agent**
2. **Document final state**
3. **Update asset status** or delete
4. **Close any open tickets**
5. **Archive documentation**

## Response Examples

### Asset Object

```json
{
  "asset": {
    "id": 98765,
    "customer_id": 12345,
    "asset_type": "Desktop",
    "name": "ACME-WKS-001",
    "serial_number": "ABC123456",
    "model": "OptiPlex 7090",
    "manufacturer": "Dell",
    "purchase_date": "2024-01-15",
    "warranty_expires": "2027-01-15",
    "notes": "Finance department workstation",
    "created_at": "2024-01-20T10:00:00Z",
    "updated_at": "2024-02-15T14:30:00Z",
    "properties": {
      "os_name": "Windows 11 Pro",
      "os_version": "22H2",
      "cpu": "Intel Core i7-11700",
      "memory": "16 GB",
      "disk_space": "512 GB SSD",
      "ip_address": "192.168.1.100",
      "last_seen": "2024-02-15T14:25:00Z",
      "online": true
    }
  }
}
```

### Patch Information

```json
{
  "patches": {
    "available": [
      {
        "kb": "KB5034441",
        "title": "2024-02 Cumulative Update",
        "severity": "Critical",
        "release_date": "2024-02-13"
      }
    ],
    "installed": [
      {
        "kb": "KB5034123",
        "title": "2024-01 Cumulative Update",
        "installed_date": "2024-01-15"
      }
    ],
    "last_scan": "2024-02-15T06:00:00Z"
  }
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid parameters | Check field values |
| 401 | Unauthorized | Verify API key |
| 404 | Asset not found | Confirm asset ID |
| 422 | Validation failed | Check required fields |
| 429 | Rate limited | Wait and retry |

### Validation Errors

**"customer_id is required"** - Asset must belong to a customer

**"name is required"** - Asset must have a name

**"Invalid asset_type"** - Use valid asset type string

## Best Practices

1. **Consistent naming** - Use standardized hostname conventions
2. **Complete records** - Include serial, model, warranty info
3. **Deploy RMM** - Get visibility into managed assets
4. **Track warranties** - Proactive replacement planning
5. **Regular audits** - Verify asset lists periodically
6. **Use notes** - Document location, user, special configs
7. **Set up alerts** - Monitor critical assets
8. **Patch regularly** - Keep systems updated and secure

## Related Skills

- [Syncro Customers](../customers/SKILL.md) - Customer management
- [Syncro Tickets](../tickets/SKILL.md) - Asset-related tickets
- [Syncro Invoices](../invoices/SKILL.md) - Asset billing
- [Syncro API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
