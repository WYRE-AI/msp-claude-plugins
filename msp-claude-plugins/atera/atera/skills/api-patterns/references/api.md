# Atera API Endpoint Catalog

Base URL for all requests: `https://app.atera.com/api/v3`

## Core Resources

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/tickets` | GET, POST, DELETE | Service tickets |
| `/tickets/{id}/comments` | GET, POST | Ticket comments |
| `/tickets/{id}/workhours` | GET | Work hour entries |
| `/agents` | GET, DELETE | RMM agents |
| `/agents/{id}/powershell` | POST | Run PowerShell |
| `/customers` | GET, POST, DELETE | Customers |
| `/contacts` | GET, POST, DELETE | Contacts |
| `/alerts` | GET, POST, DELETE | Alerts |

## Device Monitors

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/devices/generic` | GET | All devices |
| `/devices/http` | GET, POST, DELETE | HTTP monitors |
| `/devices/snmp` | GET, POST, DELETE | SNMP v1/v2c monitors |
| `/devices/snmpv3` | GET, POST, DELETE | SNMP v3 monitors |
| `/devices/tcp` | GET, POST, DELETE | TCP monitors |

## Additional Resources

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/contracts` | GET | Service contracts |
| `/billing/invoices` | GET | Billing invoices |
| `/customvalues` | GET, POST, DELETE | Custom field values |
| `/knowledgebases` | GET | Knowledge base articles |
| `/rates` | GET, POST | Product/expense rates |

## CRUD Request Shapes

### Create (POST)

```http
POST /api/v3/tickets
X-API-KEY: {api_key}
Content-Type: application/json

{
  "TicketTitle": "New ticket",
  "Description": "Issue description",
  "EndUserID": 12345,
  "TicketPriority": "Medium"
}
```

**Response:**
```json
{
  "ActionID": 54321,
  "TicketID": 54321
}
```

### Read (GET)

**Single entity:**
```http
GET /api/v3/tickets/54321
X-API-KEY: {api_key}
```

**List with pagination:**
```http
GET /api/v3/tickets?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

### Update (POST to specific ID)

```http
POST /api/v3/tickets/54321
X-API-KEY: {api_key}
Content-Type: application/json

{
  "TicketStatus": "Resolved",
  "TicketPriority": "Low"
}
```

### Delete (DELETE)

```http
DELETE /api/v3/tickets/54321
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "ActionID": 54321,
  "Success": true
}
```
