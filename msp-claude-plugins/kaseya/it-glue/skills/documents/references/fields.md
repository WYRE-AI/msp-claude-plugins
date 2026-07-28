# Documents Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `name` | string | Yes | Document title |
| `content` | string | No | Rich HTML content |
| `document-folder-id` | integer | No | Folder location |

## Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `resource-id` | integer | Related resource ID |
| `resource-type` | string | Related resource type |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |
