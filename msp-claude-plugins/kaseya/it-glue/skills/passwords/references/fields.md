# Passwords Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `name` | string | Yes | Password display name |
| `username` | string | No | Account username |
| `password` | string | No | The actual password (encrypted) |
| `url` | string | No | Related URL/login page |
| `password-category-id` | integer | No | Category classification |
| `password-folder-id` | integer | No | Folder location |

## Documentation Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Additional notes (HTML) |
| `otp-secret` | string | TOTP/2FA secret |

## Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `resource-id` | integer | Related resource ID |
| `resource-type` | string | Related resource type |

## Access Control Fields

| Field | Type | Description |
|-------|------|-------------|
| `restricted` | boolean | Restricted access flag |
| `autofill-selectors` | string | Browser autofill selectors |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |
| `password-updated-at` | datetime | Password last changed |
