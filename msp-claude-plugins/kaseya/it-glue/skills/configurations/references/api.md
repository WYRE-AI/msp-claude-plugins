# IT Glue Configurations — API Reference

## List Configurations

```http
GET /configurations
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**By Organization:**
```http
GET /organizations/123/relationships/configurations
```

**With Filters:**
```http
GET /configurations?filter[organization-id]=123&filter[configuration-type-id]=456&filter[configuration-status-id]=1
```

**With Pagination:**
```http
GET /configurations?page[size]=100&page[number]=1&sort=name
```

## Get Single Configuration

```http
GET /configurations/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /configurations/789?include=organization,configuration-interfaces,related-items
```

## Create Configuration

```http
POST /configurations
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

**Server Example:**
```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "organization-id": 123456,
      "name": "DC-01",
      "hostname": "dc-01.acme.local",
      "configuration-type-id": 12,
      "configuration-status-id": 1,
      "primary-ip": "192.168.1.10",
      "serial-number": "ABC123456789",
      "notes": "<p>Primary domain controller for Acme Corporation</p>"
    }
  }
}
```

**Workstation Example:**
```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "organization-id": 123456,
      "name": "WS-JSMITH",
      "hostname": "ws-jsmith.acme.local",
      "configuration-type-id": 15,
      "configuration-status-id": 1,
      "primary-ip": "192.168.1.150",
      "asset-tag": "ACME-WS-0042",
      "notes": "<p>User: John Smith (Sales)</p>"
    }
  }
}
```

## Update Configuration

```http
PATCH /configurations/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "configurations",
    "attributes": {
      "primary-ip": "192.168.1.20",
      "notes": "<p>Updated IP after network migration</p>"
    }
  }
}
```

## Delete Configuration

```http
DELETE /configurations/789
x-api-key: YOUR_API_KEY
```

## Search by Various Fields

**By Hostname:**
```http
GET /configurations?filter[hostname]=dc-01
```

**By Serial Number:**
```http
GET /configurations?filter[serial-number]=ABC123
```

**By IP Address:**
```http
GET /configurations?filter[primary-ip]=192.168.1.10
```

**By PSA ID:**
```http
GET /configurations?filter[psa-id]=54321
```

## Configuration Interfaces

### List Interfaces

```http
GET /configurations/789/relationships/configuration-interfaces
```

### Create Interface

```http
POST /configuration-interfaces
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "configuration-interfaces",
    "attributes": {
      "configuration-id": 789,
      "name": "Ethernet0",
      "ip-address": "192.168.1.10",
      "mac-address": "AA:BB:CC:DD:EE:FF",
      "primary": true,
      "notes": "Primary LAN interface"
    }
  }
}
```

## Related Items

### List Related Items

```http
GET /configurations/789/relationships/related-items
```

### Create Relationship

```http
POST /related-items
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "related-items",
    "attributes": {
      "resource-id": 789,
      "resource-type": "Configuration",
      "destination-id": 456,
      "destination-type": "Configuration",
      "notes": "VM hosted on this hypervisor"
    }
  }
}
```
