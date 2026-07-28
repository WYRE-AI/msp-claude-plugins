# IT Glue Configurations — Field Reference

## Core Identification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `name` | string | Yes | Display name |
| `hostname` | string | No | Network hostname |
| `configuration-type-id` | integer | No | Type classification |
| `configuration-status-id` | integer | No | Status classification |

## Hardware Fields

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer-id` | integer | Manufacturer reference |
| `model-id` | integer | Model reference |
| `serial-number` | string | Serial number |
| `asset-tag` | string | Internal asset tag |

## Network Fields

| Field | Type | Description |
|-------|------|-------------|
| `primary-ip` | string | Primary IP address |
| `mac-address` | string | Primary MAC address |
| `default-gateway` | string | Default gateway |
| `installed-by` | string | Installer name |

## Lifecycle Fields

| Field | Type | Description |
|-------|------|-------------|
| `purchased-at` | date | Purchase date |
| `installed-at` | date | Installation date |
| `warranty-expires-at` | date | Warranty expiration |

## Documentation Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Detailed notes (HTML) |
| `operating-system-notes` | string | OS-specific notes |

## PSA Integration Fields

| Field | Type | Description |
|-------|------|-------------|
| `psa-id` | string | PSA configuration item ID |
| `psa-integration-type` | string | PSA platform type |
| `rmm-id` | string | RMM agent/device ID |
| `rmm-integration-type` | string | RMM platform type |
