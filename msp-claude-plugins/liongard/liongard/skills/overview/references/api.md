# Liongard API Endpoint Catalog

Liongard provides two API versions with different entity coverage. Base URLs
are instance-scoped: `https://{instance}.app.liongard.com/api/v1` and
`.../api/v2`.

## v1 Endpoints

Most entities are accessed through v1:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/environments` | GET, POST, PUT, DELETE | Environment management |
| `/api/v1/environments/count` | GET | Environment count |
| `/api/v1/agents` | GET, DELETE | Agent management |
| `/api/v1/inspectors` | GET | Inspector templates |
| `/api/v1/launchpoints` | GET, POST, PUT, DELETE | Configured inspections |
| `/api/v1/launchpoints/{id}/run` | POST | Trigger inspection |
| `/api/v1/systems` | GET | Discovered systems |
| `/api/v1/systems/{id}/detail` | GET | System detail data |
| `/api/v1/detections` | POST | Query detections |
| `/api/v1/alerts` | GET, POST, PUT, DELETE | Alert rules |
| `/api/v1/alerts/triggered` | GET | Triggered alerts |
| `/api/v1/metrics` | GET, POST, PUT, DELETE | Custom metrics |
| `/api/v1/timeline` | GET | Timeline events |
| `/api/v1/users` | GET | User management |
| `/api/v1/groups` | GET | Group management |
| `/api/v1/accesskeys` | GET, POST, DELETE | API key management |

## v2 Endpoints

Newer and enhanced endpoints are available through v2:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v2/environments` | GET, POST, PUT, DELETE | Enhanced environment management |
| `/api/v2/environment-groups` | GET, POST, PUT, DELETE | Environment grouping |
| `/api/v2/agents` | GET, DELETE | Enhanced agent management |
| `/api/v2/agents/installer` | POST | Dynamic installer generation |
| `/api/v2/detections` | POST | Enhanced detection queries |
| `/api/v2/metrics` | GET, POST, PUT, DELETE | Enhanced metrics |
| `/api/v2/metrics/evaluate` | POST | Metric evaluation |
| `/api/v2/metrics/evaluate-systems` | POST | Per-system metric evaluation |
| `/api/v2/timelines-query` | POST | Enhanced timeline queries |
| `/api/v2/inventory/identities` | GET | Identity profiles |
| `/api/v2/inventory/devices` | GET | Device profiles |
| `/api/v2/dataprints-evaluate-systemdetailid` | POST | JMESPath data extraction |
| `/api/v2/webhooks` | GET, POST, PUT, DELETE | Webhook management |

## Pagination

### GET Request Pagination

For GET requests, use `page` and `pageSize` query parameters:

```http
GET /api/v1/environments?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### POST Request Pagination

For POST-based queries (detections, timelines), include a `Pagination` object in the request body:

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": []
}
```

### Pagination Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` / `Page` | int | 1 | - | Page number (1-indexed) |
| `pageSize` / `PageSize` | int | 50 | 2000 | Items per page |

### Pagination Response

```json
{
  "Data": [...],
  "TotalRows": 1500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 15,
  "PageSize": 100
}
```

## Filtering

### Condition-Based Filtering

For POST-based endpoints, Liongard supports JSON condition filters:

```json
{
  "conditions": [
    {
      "path": "Status",
      "op": "eq",
      "value": "Active"
    },
    {
      "path": "Tier",
      "op": "eq",
      "value": "Premium"
    }
  ]
}
```

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{"op": "eq", "value": "Active"}` |
| `ne` | Not equals | `{"op": "ne", "value": "Inactive"}` |
| `gt` | Greater than | `{"op": "gt", "value": 100}` |
| `lt` | Less than | `{"op": "lt", "value": 50}` |
| `gte` | Greater than or equal | `{"op": "gte", "value": 10}` |
| `lte` | Less than or equal | `{"op": "lte", "value": 100}` |
| `contains` | String contains | `{"op": "contains", "value": "Acme"}` |
| `in` | Value in list | `{"op": "in", "value": [1, 2, 3]}` |

### Field Selection

Use `fields[]` to limit returned fields:

```json
{
  "fields": ["ID", "Name", "Status"],
  "conditions": []
}
```

### Sorting

Use `orderBy[]` to control result ordering:

```json
{
  "orderBy": [
    {
      "path": "Name",
      "direction": "asc"
    }
  ]
}
```

## Environment Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique environment identifier |
| `Name` | string | Environment display name |
| `Description` | string | Optional description |
| `Status` | string | Active or Inactive |
| `Visible` | boolean | Visibility in UI |
| `Tier` | string | Service tier classification |
| `CreatedOn` | datetime | Creation timestamp |
| `UpdatedOn` | datetime | Last update timestamp |
