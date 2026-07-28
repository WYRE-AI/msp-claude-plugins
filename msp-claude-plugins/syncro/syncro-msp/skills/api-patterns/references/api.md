# Syncro API Endpoint Catalog and Request Shapes

Base URL: `https://{subdomain}.syncromsp.com/api/v1/`

## Request Patterns

### GET - Retrieve Data

**Single resource:**
```http
GET /api/v1/tickets/12345
Authorization: Bearer YOUR_API_KEY
```

**List with filters:**
```http
GET /api/v1/tickets?customer_id=123&status=open&page=1
Authorization: Bearer YOUR_API_KEY
```

### POST - Create Resources

```http
POST /api/v1/tickets
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "customer_id": 12345,
  "subject": "New support request",
  "status": "New",
  "priority": "Medium"
}
```

### PUT - Update Resources

```http
PUT /api/v1/tickets/12345
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "status": "Resolved",
  "priority": "Low"
}
```

### DELETE - Remove Resources

```http
DELETE /api/v1/contacts/67890
Authorization: Bearer YOUR_API_KEY
```

## Common Endpoints

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tickets` | List tickets |
| POST | `/api/v1/tickets` | Create ticket |
| GET | `/api/v1/tickets/{id}` | Get ticket |
| PUT | `/api/v1/tickets/{id}` | Update ticket |
| POST | `/api/v1/tickets/{id}/comment` | Add comment |
| POST | `/api/v1/tickets/{id}/timer` | Timer operations |

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers` | List customers |
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers/{id}` | Get customer |
| PUT | `/api/v1/customers/{id}` | Update customer |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/contacts` | List contacts |
| POST | `/api/v1/contacts` | Create contact |
| GET | `/api/v1/contacts/{id}` | Get contact |
| PUT | `/api/v1/contacts/{id}` | Update contact |
| DELETE | `/api/v1/contacts/{id}` | Delete contact |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customer_assets` | List assets |
| POST | `/api/v1/customer_assets` | Create asset |
| GET | `/api/v1/customer_assets/{id}` | Get asset |
| PUT | `/api/v1/customer_assets/{id}` | Update asset |
| DELETE | `/api/v1/customer_assets/{id}` | Delete asset |
| GET | `/api/v1/customer_assets/{id}/patches` | Get patches |

### Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice |
| GET | `/api/v1/invoices/{id}` | Get invoice |
| PUT | `/api/v1/invoices/{id}` | Update invoice |
| POST | `/api/v1/invoices/{id}/email` | Email invoice |
| POST | `/api/v1/invoices/{id}/payments` | Record payment |

## cURL Examples

```bash
# List tickets
curl -X GET "https://acme.syncromsp.com/api/v1/tickets?page=1" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"

# Create ticket
curl -X POST "https://acme.syncromsp.com/api/v1/tickets" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 12345,
    "subject": "New ticket",
    "status": "New",
    "priority": "Medium"
  }'
```
