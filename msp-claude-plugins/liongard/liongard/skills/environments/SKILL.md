---
name: "Liongard Environments"
description: >
  Use this skill when working with Liongard environments (customer organizations),
  environment groups, or related entities. Covers environment CRUD operations,
  counting, grouping, related entities, and common MSP workflows for managing
  customer organizations in Liongard.
when_to_use: >-
  When working with Liongard environments (customer organizations), environment groups, or related
  entities. Use when: liongard environment, liongard customer, environment group, liongard site,
  liongard org, liongard environment management, create environment liongard, or liongard client.
---

# Liongard Environment Management

## Overview

Environments in Liongard represent customer organizations or sites being monitored. Each environment serves as the top-level container for all inspection activity, discovered systems, detections, and metrics associated with a particular client. Proper environment management is essential for organized MSP service delivery.

## Environment Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ID` | int | System | Auto-generated unique identifier |
| `Name` | string | Yes | Environment display name |
| `Description` | string | No | Optional description text |
| `Status` | string | No | Active or Inactive (default: Active) |
| `Visible` | boolean | No | Visibility in UI (default: true) |
| `Tier` | string | No | Service tier classification |
| `CreatedOn` | datetime | System | Creation timestamp |
| `UpdatedOn` | datetime | System | Last update timestamp |

### Extended Fields

| Field | Type | Description |
|-------|------|-------------|
| `AgentCount` | int | Number of agents associated |
| `LaunchpointCount` | int | Number of configured inspections |
| `SystemCount` | int | Number of discovered systems |
| `DetectionCount` | int | Number of active detections |

## API Patterns

### List All Environments (v1)

```http
GET /api/v1/environments?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 1234,
      "Name": "Acme Corporation",
      "Description": "Primary client environment",
      "Status": "Active",
      "Visible": true,
      "Tier": "Premium",
      "CreatedOn": "2023-01-15T10:00:00Z",
      "UpdatedOn": "2024-02-01T14:30:00Z"
    }
  ],
  "TotalRows": 150,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 2,
  "PageSize": 100
}
```

### List Environments (v2)

The v2 endpoint supports POST-based filtering with conditions:

```http
POST /api/v2/environments
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": [
    {
      "path": "Status",
      "op": "eq",
      "value": "Active"
    }
  ],
  "fields": ["ID", "Name", "Status", "Tier"],
  "orderBy": [
    {
      "path": "Name",
      "direction": "asc"
    }
  ]
}
```

### Get Environment by ID

```http
GET /api/v1/environments/{environmentId}
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "ID": 1234,
  "Name": "Acme Corporation",
  "Description": "Primary client environment",
  "Status": "Active",
  "Visible": true,
  "Tier": "Premium",
  "CreatedOn": "2023-01-15T10:00:00Z",
  "UpdatedOn": "2024-02-01T14:30:00Z",
  "AgentCount": 2,
  "LaunchpointCount": 15,
  "SystemCount": 47,
  "DetectionCount": 3
}
```

### Get Environment Count

```http
GET /api/v1/environments/count
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Count": 150
}
```

This is a lightweight endpoint useful for health checks and dashboard summaries.

### Create Environment

```http
POST /api/v1/environments
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Name": "New Company Inc",
  "Description": "Managed services client",
  "Status": "Active",
  "Visible": true,
  "Tier": "Standard"
}
```

**Response:**
```json
{
  "ID": 5678,
  "Name": "New Company Inc",
  "Description": "Managed services client",
  "Status": "Active",
  "Visible": true,
  "Tier": "Standard",
  "CreatedOn": "2024-02-15T09:00:00Z",
  "UpdatedOn": "2024-02-15T09:00:00Z"
}
```

### Update Environment

```http
PUT /api/v1/environments/{environmentId}
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Name": "New Company Inc - Updated",
  "Description": "Premium managed services client",
  "Tier": "Premium"
}
```

### Delete Environment

```http
DELETE /api/v1/environments/{environmentId}
X-ROAR-API-KEY: {api_key}
```

**Warning:** Deleting an environment removes all associated launchpoints, systems, detections, and historical inspection data. This action cannot be undone.

## Environment Groups

### Overview

Environment Groups (v2) provide logical grouping of environments for organizational purposes. Groups help MSPs manage large numbers of clients by category, region, or service level.

### List Environment Groups

```http
GET /api/v2/environment-groups
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 10,
      "Name": "Tier 1 - Premium",
      "Description": "Premium service level clients",
      "EnvironmentCount": 25
    },
    {
      "ID": 11,
      "Name": "Tier 2 - Standard",
      "Description": "Standard service level clients",
      "EnvironmentCount": 75
    }
  ]
}
```

### Create Environment Group

```http
POST /api/v2/environment-groups
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Name": "East Coast Clients",
  "Description": "Clients in the eastern US region"
}
```

### Update Environment Group

```http
PUT /api/v2/environment-groups/{groupId}
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Name": "East Coast Clients - Updated",
  "Description": "All eastern US and Canada clients"
}
```

### Delete Environment Group

```http
DELETE /api/v2/environment-groups/{groupId}
X-ROAR-API-KEY: {api_key}
```

**Note:** Deleting a group does not delete the environments within it. They are simply ungrouped.

## Related Entities

### Get Launchpoints for Environment

```http
GET /api/v1/launchpoints?environmentId={environmentId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Get Systems for Environment

```http
GET /api/v1/systems?environmentId={environmentId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Get Agents for Environment

```http
GET /api/v1/agents?environmentId={environmentId}
X-ROAR-API-KEY: {api_key}
```

### Get Detections for Environment

```http
POST /api/v1/detections
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": [
    {
      "path": "EnvironmentID",
      "op": "eq",
      "value": 1234
    }
  ]
}
```

### Integration Mappings

Environments can be mapped to external systems (PSA tools, RMM platforms) for cross-platform correlation:

```http
GET /api/v1/environments/{environmentId}/integrationmappings
X-ROAR-API-KEY: {api_key}
```

## Bulk Operations

### Bulk Status Update

To update multiple environments at once, iterate with rate limiting:

```javascript
async function bulkUpdateStatus(environmentIds, status) {
  const results = [];

  for (const id of environmentIds) {
    const result = await fetch(
      `https://${instance}.app.liongard.com/api/v1/environments/${id}`,
      {
        method: 'PUT',
        headers: {
          'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Status: status })
      }
    );

    results.push({ id, success: result.ok });

    // Respect rate limits
    await sleep(200);
  }

  return results;
}
```

### Export All Environments

```javascript
async function exportAllEnvironments() {
  const environments = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${instance}.app.liongard.com/api/v1/environments?page=${page}&pageSize=500`,
      {
        headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
      }
    );

    const data = await response.json();
    environments.push(...data.Data);
    hasMore = data.HasMoreRows;
    page++;
  }

  return environments;
}
```

## Common Workflows

### New Client Onboarding

1. **Create environment** - Add the new customer organization
2. **Assign to group** - Place in appropriate environment group
3. **Set tier** - Configure service tier for SLA tracking
4. **Deploy agent** - Install agent on client infrastructure
5. **Configure launchpoints** - Set up inspectors for relevant platforms
6. **Run initial inspections** - Trigger immediate runs to capture baseline
7. **Verify discovery** - Confirm systems are being discovered correctly

### Client Decommissioning

1. **Review active inspections** - Document current state
2. **Disable launchpoints** - Stop scheduled inspections
3. **Export data** - Archive historical inspection data if needed
4. **Set status to Inactive** - Mark environment as inactive
5. **Remove from groups** - Clean up group memberships
6. **Delete environment** - Remove when retention period expires

### Organizing by Tier

1. **Create tier groups** - e.g., Premium, Standard, Basic
2. **Assign environments** - Move each client to their tier group
3. **Configure metrics** - Set tier-appropriate compliance metrics
4. **Set up detections** - Enable tier-appropriate change monitoring
5. **Review regularly** - Audit tier assignments quarterly

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid environment data | Verify required fields |
| 401 | Unauthorized | Check API key validity |
| 403 | Forbidden | Verify API key permissions |
| 404 | Environment not found | Confirm environment ID exists |
| 409 | Duplicate name | Environment name must be unique |
| 429 | Rate limited | Wait and retry (300 req/min) |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing Name field | Add environment name |
| Name too long | Name exceeds max length | Shorten name |
| Invalid status | Unrecognized status value | Use Active or Inactive |
| Duplicate name | Environment name already exists | Use unique name |

## Best Practices

1. **Use consistent naming** - Follow a standard naming convention (e.g., "CompanyName - SiteName")
2. **Complete all fields** - Add descriptions and tiers for better reporting
3. **Organize with groups** - Use environment groups for logical categorization
4. **Set appropriate tiers** - Match tier to service agreement level
5. **Review regularly** - Audit environments quarterly for accuracy
6. **Use status correctly** - Mark inactive rather than deleting for data retention
7. **Map integrations** - Link to PSA/RMM for cross-platform correlation

## Data Relationships

```
Environment (ID)
    |
    +-- Environment Groups (GroupID)
    |
    +-- Agents (AgentID)
    |
    +-- Launchpoints (LaunchpointID)
    |       +-- Systems (SystemID)
    |
    +-- Detections (DetectionID)
    |
    +-- Metrics (MetricID)
    |
    +-- Integration Mappings
    |
    +-- Timeline Events
```

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Inspections](../inspections/SKILL.md) - Inspectors and launchpoints
- [Liongard Systems](../systems/SKILL.md) - Systems and dataprints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
