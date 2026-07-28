# HaloPSA Contract API Reference

## Creating a Contract

```http
POST /api/ClientContract
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "ref": "Acme Corp - Managed Services 2024",
    "client_id": 123,
    "type": "Recurring",
    "status": "Active",
    "startdate": "2024-01-01",
    "enddate": "2024-12-31",
    "billingfrequency": "Monthly",
    "invoiceday": 1,
    "value": 2500.00,
    "sla_id": 1,
    "includesallsites": true,
    "includesallassets": true,
    "notes": "Premium support tier, includes unlimited remote support"
  }
]
```

### Response

```json
{
  "contracts": [
    {
      "id": 5001,
      "ref": "Acme Corp - Managed Services 2024",
      "client_id": 123,
      "client_name": "Acme Corporation",
      "status": "Active",
      "startdate": "2024-01-01",
      "enddate": "2024-12-31"
    }
  ]
}
```

## Searching Contracts

**By client:**
```http
GET /api/ClientContract?client_id=123
```

**Active contracts:**
```http
GET /api/ClientContract?status=Active
```

**Expiring soon:**
```http
GET /api/ClientContract?enddate_before=2024-03-31&enddate_after=2024-01-01&status=Active
```

**By type:**
```http
GET /api/ClientContract?type=Recurring
```

## Getting a Single Contract

```http
GET /api/ClientContract/5001
```

**With recurring items:**
```http
GET /api/ClientContract/5001?includerecurringinvoiceitems=true
```

## Updating a Contract

```http
POST /api/ClientContract
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "id": 5001,
    "status": "On Hold",
    "notes": "Client requested temporary pause - resume Feb 2024"
  }
]
```

## Creating Recurring Items

```http
POST /api/RecurringInvoiceItem
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "contract_id": 5001,
    "description": "Managed Workstation Support",
    "quantity": 25,
    "unitprice": 50.00,
    "startdate": "2024-01-01"
  },
  {
    "contract_id": 5001,
    "description": "Server Management",
    "quantity": 3,
    "unitprice": 200.00,
    "startdate": "2024-01-01"
  },
  {
    "contract_id": 5001,
    "description": "M365 Business Premium Licenses",
    "quantity": 25,
    "unitprice": 25.00,
    "startdate": "2024-01-01"
  }
]
```

## Updating Recurring Items

```json
[
  {
    "id": 10001,
    "quantity": 30,
    "notes": "Added 5 workstations in March"
  }
]
```

## Creating a Prepaid Contract

```json
[
  {
    "ref": "Acme Corp - Prepaid Hours Q1 2024",
    "client_id": 123,
    "type": "Prepaid Hours",
    "status": "Active",
    "startdate": "2024-01-01",
    "enddate": "2024-03-31",
    "prepaid_hours": 40,
    "hourlyrate": 150.00,
    "value": 6000.00
  }
]
```

## Checking Hours Balance

```http
GET /api/ClientContract/5002?includehoursummary=true
```

Response includes:
```json
{
  "prepaid_hours": 40,
  "prepaid_hours_used": 12.5,
  "prepaid_hours_remaining": 27.5
}
```

## Hours Deduction

Time entries against tickets linked to prepaid contracts automatically deduct hours:

```json
{
  "ticket_id": 54321,
  "timetaken": 60,
  "contract_id": 5002
}
```

## Contract-SLA Association

Link contracts to Service Level Agreements:

```json
[
  {
    "id": 5001,
    "sla_id": 1
  }
]
```

## Renewal Requests

**Generate renewal:**
```json
[
  {
    "ref": "Acme Corp - Managed Services 2025",
    "client_id": 123,
    "type": "Recurring",
    "status": "Pending",
    "startdate": "2025-01-01",
    "enddate": "2025-12-31",
    "renewalvalue": 2750.00,
    "notes": "Renewal from contract 5001"
  }
]
```

**Expire old contract:**
```json
[{ "id": 5001, "status": "Expired" }]
```

## Contract Reports

### Contracts by Status
```http
GET /api/ClientContract?groupby=status&count=true
```
