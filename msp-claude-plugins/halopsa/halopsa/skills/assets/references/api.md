# HaloPSA Asset API Reference

## Creating an Asset

```http
POST /api/Asset
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "devicename": "ACME-WS-001",
    "client_id": 123,
    "site_id": 456,
    "user_id": 789,
    "devicetype_id": 1,
    "status_id": 1,
    "manufacturer": "Dell",
    "model": "OptiPlex 7090",
    "serialnumber": "ABC123XYZ",
    "assettag": "ACME-001",
    "operatingsystem": "Windows 11 Pro",
    "operatingsystemversion": "22H2",
    "ipaddress": "192.168.1.100",
    "macaddress": "00:1A:2B:3C:4D:5E",
    "purchasedate": "2024-01-15",
    "purchaseprice": 1299.99,
    "warrantyexpires": "2027-01-15"
  }
]
```

### Response

```json
{
  "assets": [
    {
      "id": 5001,
      "devicename": "ACME-WS-001",
      "client_id": 123,
      "client_name": "Acme Corporation",
      "site_name": "Acme HQ",
      "status_id": 1,
      "status_name": "Active"
    }
  ]
}
```

## Searching Assets

**By client:**
```http
GET /api/Asset?client_id=123
```

**By site:**
```http
GET /api/Asset?site_id=456
```

**By type:**
```http
GET /api/Asset?devicetype_id=1
```

**Active assets only:**
```http
GET /api/Asset?inactive=false
```

**Search by name:**
```http
GET /api/Asset?search=ACME-WS
```

**Warranty expiring soon:**
```http
GET /api/Asset?warrantyexpires_before=2024-03-31
```

**Warranty window:**
```http
GET /api/Asset?warrantyexpires_before=2024-06-30&warrantyexpires_after=2024-01-01
```

**Aging assets:**
```http
GET /api/Asset?purchasedate_before=2020-01-01&inactive=false
```

## Getting a Single Asset

```http
GET /api/Asset/5001
```

**With related data:**
```http
GET /api/Asset/5001?includedetails=true
```

## Updating an Asset

```http
POST /api/Asset
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "id": 5001,
    "status_id": 3,
    "notes": "Sent to vendor for motherboard repair"
  }
]
```

## Bulk Asset Update

```json
[
  { "id": 5001, "status_id": 1 },
  { "id": 5002, "status_id": 1 },
  { "id": 5003, "status_id": 4, "inactive": true }
]
```

## Asset Relationships

### Linking Asset to Ticket

When creating or updating a ticket, reference the asset:

```json
[
  {
    "summary": "Workstation not booting",
    "client_id": 123,
    "asset_id": 5001,
    "tickettype_id": 1,
    "status_id": 1
  }
]
```

### Linking Assets Together

Parent-child relationships (e.g., server and its VMs):

```json
[
  {
    "id": 5010,
    "parent_id": 5009,
    "notes": "VM hosted on ACME-SRV-001"
  }
]
```

### Asset History

Track changes via the audit log or custom fields.

### Creating an Asset as "On Order"

```json
[{ "devicename": "New Laptop", "status_id": 5, "client_id": 123 }]
```

## Asset Reports

### Assets by Type
```http
GET /api/Asset?groupby=devicetype_id&count=true
```

### Assets by Client
```http
GET /api/Asset?groupby=client_id&count=true
```
