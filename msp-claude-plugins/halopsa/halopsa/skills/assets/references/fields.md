# HaloPSA Asset Field Reference

## Asset

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

### RMM Identifier Fields

| Field | Description |
|-------|-------------|
| `ncentral_device_id` | N-central device ID |
| `datto_device_id` | Datto RMM device ID |
| `connectwise_device_id` | Automate device ID |

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
