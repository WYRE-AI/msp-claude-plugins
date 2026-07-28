# Hudu Asset Password Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `company_id` | integer | Yes | Parent company |
| `name` | string | Yes | Password display name |
| `username` | string | No | Account username |
| `password` | string | No | The actual password value |
| `url` | string | No | Related URL/login page |
| `description` | string | No | Additional notes |
| `password_type` | string | No | Category/type label |
| `otp_secret` | string | No | TOTP/2FA secret |

## Password Folder Fields

| Field | Type | Description |
|-------|------|-------------|
| `password_folder_id` | integer | Folder location |
| `password_folder_name` | string | Folder name (read-only) |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `slug` | string | URL-friendly identifier |
| `url` | string | Full URL in Hudu |
| `object_type` | string | Always "AssetPassword" |
