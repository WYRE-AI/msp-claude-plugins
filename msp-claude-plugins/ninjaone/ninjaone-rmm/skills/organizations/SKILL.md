---
name: "NinjaOne Organizations"
description: >
  Use this skill when working with NinjaOne organizations - creating, listing,
  managing locations, and configuring policies. Organizations are the top-level
  container for all devices and represent MSP clients.
when_to_use: >-
  When creating, listing, managing locations, and configuring policies. Organizations are the
  top-level container for all devices and represent MSP clients. Use when: ninjaone organization,
  ninjarmm org, ninja client, ninja organization list, create organization ninja, ninja location,
  or ninja policy mapping.
---

# NinjaOne Organization Management

## Overview

Organizations in NinjaOne represent your MSP clients. Each organization contains devices, locations, and has policy mappings that determine how devices are monitored and managed.

## API Endpoints

### List Organizations

```http
GET /api/v2/organizations
Authorization: Bearer {token}
```

Query parameters:
- `pageSize` - Results per page (default: 50)
- `after` - Cursor for pagination

Response:
```json
{
  "organizations": [
    {
      "id": 1,
      "name": "Acme Corporation",
      "description": "Main client account",
      "nodeApprovalMode": "AUTOMATIC",
      "tags": ["premium", "24x7"],
      "fields": {
        "customField1": "value"
      }
    }
  ],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "abc123"
  }
}
```

### Create Organization

```http
POST /api/v2/organizations
Content-Type: application/json
```

```json
{
  "name": "New Client Inc",
  "description": "Description of the organization",
  "nodeApprovalMode": "AUTOMATIC",
  "tags": ["standard"],
  "fields": {
    "primaryContact": "John Smith",
    "contractType": "Managed"
  },
  "locations": [
    {
      "name": "Headquarters",
      "address": "123 Main St",
      "description": "Main office location"
    }
  ],
  "policies": {
    "nodeRoleId": 1,
    "policyId": 100
  }
}
```

## Node Approval Modes

| Mode | Description |
|------|-------------|
| `AUTOMATIC` | New devices auto-approved |
| `MANUAL` | Devices require manual approval |
| `REJECT` | New devices rejected by default |

## Locations

Locations represent physical sites within an organization.

### Location Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Location identifier |
| `name` | string | Location name |
| `address` | string | Physical address |
| `description` | string | Additional details |

## Policy Mappings

Policies define monitoring and management behavior for devices.

### Policy Mapping Structure

```json
{
  "policies": [
    {
      "nodeRoleId": 1,
      "policyId": 100
    },
    {
      "nodeRoleId": 2,
      "policyId": 101
    }
  ]
}
```

### Node Role IDs

| ID | Role |
|----|------|
| 1 | Windows Workstation |
| 2 | Windows Server |
| 3 | Mac |
| 4 | Linux Workstation |
| 5 | Linux Server |

## Custom Fields

Organizations can have custom fields for tracking business data:

```json
{
  "fields": {
    "contractStart": "2024-01-01",
    "contractEnd": "2024-12-31",
    "primaryContact": "Jane Doe",
    "billingCode": "ACME-001"
  }
}
```

## Tags

Tags help categorize and filter organizations:

```json
{
  "tags": ["premium", "healthcare", "24x7-support"]
}
```

Common tag patterns:
- Service tier: `premium`, `standard`, `basic`
- Industry: `healthcare`, `finance`, `education`
- Support level: `24x7`, `business-hours`
- Contract type: `managed`, `break-fix`, `project`

## Common Workflows

### Onboard New Client

1. Create organization with basic info
2. Add locations for each site
3. Configure policy mappings
4. Set custom fields for contract info
5. Deploy agents to devices

### Organization Audit

1. List all organizations
2. Review custom field data
3. Check policy mappings are current
4. Verify location accuracy

### Bulk Tag Update

1. List organizations by filter
2. Update tags programmatically
3. Verify changes applied

## Pagination

NinjaOne uses cursor-based pagination:

```http
GET /api/v2/organizations?pageSize=50
GET /api/v2/organizations?pageSize=50&after=cursor123
```

Continue fetching while `pageInfo.hasNextPage` is true.

## Error Handling

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Invalid request | Check required fields |
| 409 | Name conflict | Organization name must be unique |
| 403 | Access denied | Check API permissions |

## Related Skills

- [Devices](../devices/SKILL.md) - Device management
- [API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
