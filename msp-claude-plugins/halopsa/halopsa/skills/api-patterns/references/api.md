# HaloPSA Endpoint and Query Reference

## Common Endpoints

| Resource | Endpoint | Methods |
|----------|----------|---------|
| Tickets | `/api/Tickets` | GET, POST |
| Clients | `/api/Client` | GET, POST |
| Assets | `/api/Asset` | GET, POST |
| Contracts | `/api/ClientContract` | GET, POST |
| Users | `/api/Users` | GET, POST |
| Actions | `/api/Actions` | GET, POST |
| Sites | `/api/Site` | GET, POST |

## Query Parameters

HaloPSA uses query parameters for filtering:

```http
GET /api/Tickets?client_id=123&status_id=1&tickettype_id=5
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `client_id` | int | Filter by client |
| `status_id` | int | Filter by status |
| `tickettype_id` | int | Filter by ticket type |
| `agent_id` | int | Filter by assigned agent |
| `search` | string | Text search |
| `order` | string | Sort field |
| `orderdesc` | bool | Sort descending |

### Date Filtering

```http
GET /api/Tickets?dateoccurred_start=2024-01-01&dateoccurred_end=2024-01-31
```

## CRUD Operations

### Create (POST)

```http
POST /api/Tickets
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "summary": "New ticket summary",
    "details": "Detailed description",
    "client_id": 123,
    "tickettype_id": 1,
    "status_id": 1,
    "priority_id": 2
  }
]
```

**Note:** HaloPSA expects an array for POST operations, even for single items.

### Read (GET)

**Single entity:**
```http
GET /api/Tickets/54321
```

**List with filters:**
```http
GET /api/Tickets?client_id=123&status_id=1
```

### Update (POST with ID)

```http
POST /api/Tickets
Authorization: Bearer {token}
Content-Type: application/json

[
  {
    "id": 54321,
    "summary": "Updated summary",
    "status_id": 2
  }
]
```

**Note:** Include the `id` field to update an existing record.

### Delete (DELETE)

```http
DELETE /api/Tickets/54321
```

**Note:** Not all entities support deletion. Check entity documentation.

## Error Response Format

```json
{
  "error": "validation_error",
  "message": "Invalid field value",
  "details": [
    {
      "field": "status_id",
      "message": "Status ID 999 does not exist"
    }
  ]
}
```

## Rate Limit Response

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please retry after 60 seconds.",
  "retry_after": 60
}
```
