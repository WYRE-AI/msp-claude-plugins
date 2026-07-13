---
name: "HaloPSA Assets"
description: >
  Use this skill when working with HaloPSA assets - tracking devices, managing
  configuration items, hardware lifecycle, and asset relationships. Covers
  asset fields, types, statuses, links to clients/sites, and RMM integration.
  Essential for MSP asset management and CMDB operations.
when_to_use: >-
  When tracking devices, managing configuration items, hardware lifecycle, and asset
  relationships. Use when: halopsa asset, halo asset, configuration item halopsa, ci halopsa,
  device management halo, hardware tracking halopsa, halopsa cmdb, asset lifecycle, halo
  inventory, or halopsa device.
---

# HaloPSA Asset Management

## Overview

Assets (also called Configuration Items or CIs) in HaloPSA represent managed devices, software, and other trackable items. Effective asset management is crucial for MSPs to track what's deployed at client sites, manage hardware lifecycle, and link service tickets to affected equipment.

## Key Concepts

### Asset

The primary entity representing a managed device or configuration item.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `inventory_number` | string | No | Internal asset tag |
| `client_id` | int | Yes | Associated client |
| `site_id` | int | No | Physical location |
| `user_id` | int | No | Assigned user |
| `devicetype_id` | int | No | Asset type category |
| `status_id` | int | No | Asset status |

### Asset Identification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `devicename` | string(255) | Yes | Device hostname/name |
| `serialnumber` | string | No | Manufacturer serial |
| `assettag` | string | No | Company asset tag |
| `barcode` | string | No | Barcode identifier |
| `macaddress` | string | No | Network MAC address |

### Asset Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manufacturer` | string | No | Device manufacturer |
| `model` | string | No | Device model |
| `operatingsystem` | string | No | OS name/version |
| `operatingsystemversion` | string | No | OS detailed version |
| `ipaddress` | string | No | IP address |

### Asset Lifecycle Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `purchasedate` | date | No | Date acquired |
| `purchaseprice` | decimal | No | Purchase cost |
| `warrantyexpires` | date | No | Warranty end date |
| `lastauditdate` | datetime | No | Last RMM sync |
| `inactive` | bool | No | Active status |

### Contract & Billing

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contract_id` | int | No | Associated contract |
| `supplier_id` | int | No | Vendor/supplier |
| `notes` | text | No | Asset notes |

## Asset Types

Common asset types in HaloPSA:

| Type ID | Name | Examples |
|---------|------|----------|
| 1 | Workstation | Desktop, laptop |
| 2 | Server | Physical/virtual server |
| 3 | Network Device | Router, switch, firewall |
| 4 | Printer | Network/local printer |
| 5 | Mobile Device | Phone, tablet |
| 6 | Software | License, subscription |
| 7 | Other | Miscellaneous |

**Note:** Asset types are configurable per instance. Query `/api/AssetType` for your values.

## Asset Status

| Status ID | Name | Description |
|-----------|------|-------------|
| 1 | Active | In production use |
| 2 | Spare | Available backup |
| 3 | In Repair | Under maintenance |
| 4 | Retired | End of life |
| 5 | On Order | Pending delivery |
| 6 | Lost/Stolen | Missing |

**Note:** Status IDs are configurable per instance. Query `/api/AssetStatus` for your values.

## API Patterns

### Creating an Asset

```http
POST /api/Asset
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "devicename": "ACME-WS-001",
    "client_id": 123,
    "site_id": 456,
    "user_id": 789,
    "devicetype_id": 1,
    "status_id": 1,
    "manufacturer": "Dell",
    "model": "OptiPlex 7090",
    "serialnumber": "ABC123XYZ",
    "assettag": "ACME-001",
    "operatingsystem": "Windows 11 Pro",
    "operatingsystemversion": "22H2",
    "ipaddress": "192.168.1.100",
    "macaddress": "00:1A:2B:3C:4D:5E",
    "purchasedate": "2024-01-15",
    "purchaseprice": 1299.99,
    "warrantyexpires": "2027-01-15"
  }
]
```

### Response

```json
{
  "assets": [
    {
      "id": 5001,
      "devicename": "ACME-WS-001",
      "client_id": 123,
      "client_name": "Acme Corporation",
      "site_name": "Acme HQ",
      "status_id": 1,
      "status_name": "Active"
    }
  ]
}
```

### Searching Assets

**By client:**
```http
GET /api/Asset?client_id=123
```

**By site:**
```http
GET /api/Asset?site_id=456
```

**By type:**
```http
GET /api/Asset?devicetype_id=1
```

**Active assets only:**
```http
GET /api/Asset?inactive=false
```

**Search by name:**
```http
GET /api/Asset?search=ACME-WS
```

**Warranty expiring soon:**
```http
GET /api/Asset?warrantyexpires_before=2024-03-31
```

### Getting a Single Asset

```http
GET /api/Asset/5001
```

**With related data:**
```http
GET /api/Asset/5001?includedetails=true
```

### Updating an Asset

```http
POST /api/Asset
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "id": 5001,
    "status_id": 3,
    "notes": "Sent to vendor for motherboard repair"
  }
]
```

### Bulk Asset Update

```json
[
  { "id": 5001, "status_id": 1 },
  { "id": 5002, "status_id": 1 },
  { "id": 5003, "status_id": 4, "inactive": true }
]
```

## Asset Relationships

### Linking Asset to Ticket

When creating or updating a ticket, reference the asset:

```json
[
  {
    "summary": "Workstation not booting",
    "client_id": 123,
    "asset_id": 5001,
    "tickettype_id": 1,
    "status_id": 1
  }
]
```

### Linking Assets Together

Parent-child relationships (e.g., server and its VMs):

```json
[
  {
    "id": 5010,
    "parent_id": 5009,
    "notes": "VM hosted on ACME-SRV-001"
  }
]
```

### Asset History

Track changes via the audit log or custom fields.

## RMM Integration

HaloPSA integrates with RMM tools to auto-sync assets.

### Auto-Sync Fields

When integrated with an RMM, these fields typically auto-populate:

- `devicename`
- `operatingsystem`
- `operatingsystemversion`
- `ipaddress`
- `macaddress`
- `lastauditdate`

### RMM Identifier

| Field | Description |
|-------|-------------|
| `ncentral_device_id` | N-central device ID |
| `datto_device_id` | Datto RMM device ID |
| `connectwise_device_id` | Automate device ID |

### Matching Assets

```javascript
async function matchOrCreateAsset(rmmDevice) {
  // 1. Try to match by RMM ID
  let asset = await findAssetByRmmId(rmmDevice.id);

  if (!asset) {
    // 2. Try to match by serial number
    asset = await findAssetBySerial(rmmDevice.serialNumber);
  }

  if (!asset) {
    // 3. Try to match by hostname + client
    asset = await findAssetByHostname(
      rmmDevice.hostname,
      rmmDevice.clientId
    );
  }

  if (asset) {
    // Update existing
    return updateAsset(asset.id, rmmDevice);
  } else {
    // Create new
    return createAsset(rmmDevice);
  }
}
```

## Common Workflows

### Hardware Procurement

1. **Create asset as "On Order"**
   ```json
   [{ "devicename": "New Laptop", "status_id": 5, "client_id": 123 }]
   ```

2. **Receive and configure**
   - Update with serial, asset tag
   - Install software
   - Update status to "Spare"

3. **Deploy to user**
   - Assign `user_id` and `site_id`
   - Update status to "Active"
   - Create deployment ticket

### Hardware Refresh

1. **Identify aging assets**
   ```http
   GET /api/Asset?purchasedate_before=2020-01-01&inactive=false
   ```

2. **Generate refresh report**
   - List assets over X years old
   - Calculate replacement cost

3. **Plan replacement**
   - Order new equipment
   - Schedule deployment tickets
   - Update old assets to "Retired"

### Warranty Management

1. **Find expiring warranties**
   ```http
   GET /api/Asset?warrantyexpires_before=2024-06-30&warrantyexpires_after=2024-01-01
   ```

2. **Generate renewal quotes**
3. **Update warranty dates after renewal**

### Asset Audit

```javascript
async function auditClientAssets(clientId) {
  const assets = await getClientAssets(clientId);
  const report = {
    total: assets.length,
    active: 0,
    noWarranty: [],
    missingSerial: [],
    oldOS: []
  };

  assets.forEach(asset => {
    if (!asset.inactive) report.active++;

    if (!asset.warrantyexpires || new Date(asset.warrantyexpires) < new Date()) {
      report.noWarranty.push(asset);
    }

    if (!asset.serialnumber) {
      report.missingSerial.push(asset);
    }

    if (asset.operatingsystem?.includes('Windows 10') &&
        new Date(asset.purchasedate) < new Date('2020-01-01')) {
      report.oldOS.push(asset);
    }
  });

  return report;
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | devicename required | Asset must have a name |
| 400 | client_id required | Asset must be linked to client |
| 400 | Invalid devicetype_id | Query `/api/AssetType` for valid IDs |
| 404 | Asset not found | Verify asset ID exists |
| 409 | Duplicate serial number | Serial already in use |

### Validation Patterns

```javascript
function validateAsset(asset) {
  const errors = [];

  if (!asset.devicename || asset.devicename.trim() === '') {
    errors.push('Device name is required');
  }

  if (!asset.client_id) {
    errors.push('Client ID is required');
  }

  if (asset.macaddress && !isValidMac(asset.macaddress)) {
    errors.push('Invalid MAC address format');
  }

  if (asset.ipaddress && !isValidIP(asset.ipaddress)) {
    errors.push('Invalid IP address format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Best Practices

1. **Use consistent naming** - Establish hostname conventions (CLIENT-TYPE-###)
2. **Track serials** - Essential for warranty and vendor support
3. **Link to clients** - Every asset should have a client_id
4. **Update status promptly** - Keeps inventory accurate
5. **Document lifecycle** - Purchase date, warranty, refresh date
6. **Sync with RMM** - Automated updates reduce manual effort
7. **Regular audits** - Compare RMM data vs PSA records
8. **Track costs** - Purchase price and depreciation

## Asset Reports

### Assets by Type
```http
GET /api/Asset?groupby=devicetype_id&count=true
```

### Assets by Client
```http
GET /api/Asset?groupby=client_id&count=true
```

### Asset Value by Client
```javascript
async function getAssetValueByClient() {
  const clients = await fetchAllClients();
  const results = [];

  for (const client of clients) {
    const assets = await getClientAssets(client.id);
    const totalValue = assets.reduce(
      (sum, a) => sum + (a.purchaseprice || 0), 0
    );
    results.push({
      client_id: client.id,
      client_name: client.name,
      asset_count: assets.length,
      total_value: totalValue
    });
  }

  return results.sort((a, b) => b.total_value - a.total_value);
}
```

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Link assets to tickets
- [HaloPSA Clients](../clients/SKILL.md) - Client and site management
- [HaloPSA Contracts](../contracts/SKILL.md) - Asset billing and coverage
- [HaloPSA API Patterns](../api-patterns/SKILL.md) - Authentication and queries
