# IT Glue Contacts — Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `first-name` | string | No | First name |
| `last-name` | string | No | Last name |
| `name` | string | System | Full name (auto-generated) |
| `title` | string | No | Job title |
| `contact-type-id` | integer | No | Type classification |

## Communication Fields

| Field | Type | Description |
|-------|------|-------------|
| `contact-emails` | array | Email addresses |
| `contact-phones` | array | Phone numbers |

## Location Fields

| Field | Type | Description |
|-------|------|-------------|
| `location-id` | integer | Associated location |

## Documentation Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Contact notes (HTML) |
| `important` | boolean | VIP/important flag |

## PSA Integration Fields

| Field | Type | Description |
|-------|------|-------------|
| `psa-id` | string | PSA contact ID |
| `psa-integration-type` | string | PSA platform type |

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |
