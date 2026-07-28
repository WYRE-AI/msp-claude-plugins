# Liongard Environments API Reference

Complete endpoint catalog with request and response shapes. All requests
require the `X-ROAR-API-KEY` header.

## Environments

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
