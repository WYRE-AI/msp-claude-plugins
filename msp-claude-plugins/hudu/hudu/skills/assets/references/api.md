# Hudu Assets API Reference

## List Assets

```http
GET /api/v1/assets
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**By Company:**
```http
GET /api/v1/assets?company_id=123
```

**By Asset Layout:**
```http
GET /api/v1/assets?asset_layout_id=5
```

**Combined Filters:**
```http
GET /api/v1/assets?company_id=123&asset_layout_id=5
GET /api/v1/assets?company_id=123&name=DC-01
GET /api/v1/assets?company_id=123&archived=false
GET /api/v1/assets?primary_serial=ABC123456789
```

**With Pagination:**
```http
GET /api/v1/assets?company_id=123&page=1
GET /api/v1/assets?company_id=123&page=2
```

## Get Single Asset

```http
GET /api/v1/assets/789
x-api-key: YOUR_API_KEY
```

## Create Asset

```http
POST /api/v1/assets
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

**Server Example:**
```json
{
  "asset": {
    "name": "DC-01",
    "asset_layout_id": 5,
    "company_id": 123,
    "primary_serial": "ABC123456789",
    "primary_model": "Dell PowerEdge R740",
    "custom_fields": [
      { "hostname": "dc-01.acme.local" },
      { "ip_address": "192.168.1.10" },
      { "operating_system": "Windows Server 2022" },
      { "ram_gb": 32 },
      { "cpu": "Intel Xeon Gold 6248" },
      { "warranty_expiry": "2027-01-15" },
      { "notes": "Primary domain controller for Acme Corporation" }
    ]
  }
}
```

**Workstation Example:**
```json
{
  "asset": {
    "name": "WS-JSMITH",
    "asset_layout_id": 7,
    "company_id": 123,
    "primary_serial": "XYZ987654321",
    "primary_model": "Dell OptiPlex 7090",
    "custom_fields": [
      { "hostname": "ws-jsmith.acme.local" },
      { "assigned_user": "John Smith" },
      { "department": "Sales" },
      { "ip_address": "192.168.1.150" },
      { "operating_system": "Windows 11 Pro" },
      { "warranty_expiry": "2026-06-30" }
    ]
  }
}
```

## Update Asset

```http
PUT /api/v1/assets/789
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset": {
    "name": "DC-01",
    "custom_fields": [
      { "ip_address": "192.168.1.20" },
      { "notes": "IP updated after network migration on 2026-02-15" }
    ]
  }
}
```

## Delete Asset

```http
DELETE /api/v1/assets/789
x-api-key: YOUR_API_KEY
```

## Archive / Unarchive Asset

```http
PUT /api/v1/assets/789/archive
x-api-key: YOUR_API_KEY
```

```http
PUT /api/v1/assets/789/unarchive
x-api-key: YOUR_API_KEY
```

## List Asset Layouts

```http
GET /api/v1/asset_layouts
x-api-key: YOUR_API_KEY
```

**By Name:**
```http
GET /api/v1/asset_layouts?name=Server
```

## Get Single Asset Layout

```http
GET /api/v1/asset_layouts/5
x-api-key: YOUR_API_KEY
```

**Response:**
```json
{
  "asset_layout": {
    "id": 5,
    "name": "Server",
    "icon": "fas fa-server",
    "color": "#2196F3",
    "active": true,
    "fields": [
      { "label": "Hostname", "field_type": "Text", "required": true, "position": 1 },
      { "label": "IP Address", "field_type": "Text", "required": false, "position": 2 },
      { "label": "Operating System", "field_type": "Dropdown", "required": false, "position": 3 },
      { "label": "RAM (GB)", "field_type": "Number", "required": false, "position": 4 },
      { "label": "Warranty Expiry", "field_type": "Date", "required": false, "position": 5 },
      { "label": "Notes", "field_type": "RichText", "required": false, "position": 6 }
    ]
  }
}
```

## Create Asset Layout

```http
POST /api/v1/asset_layouts
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset_layout": {
    "name": "Network Switch",
    "icon": "fas fa-network-wired",
    "color": "#4CAF50",
    "active": true,
    "fields": [
      { "label": "IP Address", "field_type": "Text", "required": true, "position": 1 },
      { "label": "Model", "field_type": "Text", "required": false, "position": 2 },
      { "label": "Firmware Version", "field_type": "Text", "required": false, "position": 3 },
      { "label": "Port Count", "field_type": "Number", "required": false, "position": 4 },
      { "label": "Location", "field_type": "Text", "required": false, "position": 5 },
      { "label": "Managed", "field_type": "CheckBox", "required": false, "position": 6 }
    ]
  }
}
```
