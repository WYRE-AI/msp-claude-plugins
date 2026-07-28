# Hudu Article Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `company_id` | integer | No | Parent company (null for global articles) |
| `name` | string | Yes | Article title |
| `content` | string | No | Rich HTML content |
| `folder_id` | integer | No | Folder location |
| `draft` | boolean | No | Whether article is a draft |
| `slug` | string | System | URL-friendly identifier |

## Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `company_name` | string | Parent company name (read-only) |
| `folder_name` | string | Folder name (read-only) |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `url` | string | Full URL to article in Hudu |
| `object_type` | string | Always "Article" |
