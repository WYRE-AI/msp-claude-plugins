# Flexible Assets API Reference

## List Flexible Asset Types

```http
GET /flexible-asset-types
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

## Get Flexible Asset Type Details

```http
GET /flexible-asset-types/123
x-api-key: YOUR_API_KEY
```

**With Field Definitions:**
```http
GET /flexible-asset-types/123?include=flexible-asset-fields
```

## List Flexible Assets

```http
GET /flexible-assets
x-api-key: YOUR_API_KEY
```

**By Organization:**
```http
GET /organizations/456/relationships/flexible-assets
```

**By Type:**
```http
GET /flexible-assets?filter[flexible-asset-type-id]=123
```

**By Organization and Type:**
```http
GET /flexible-assets?filter[organization-id]=456&filter[flexible-asset-type-id]=123
```

## Get Single Flexible Asset

```http
GET /flexible-assets/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /flexible-assets/789?include=organization,flexible-asset-type
```

## Create Flexible Asset

```http
POST /flexible-assets
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "flexible-assets",
    "attributes": {
      "organization-id": 456,
      "flexible-asset-type-id": 123,
      "traits": {
        "name": "Acme Corp Network Overview",
        "primary-isp": "Comcast Business",
        "backup-isp": "Verizon FiOS",
        "public-ip-addresses": "203.0.113.10\n203.0.113.11",
        "dns-provider": "Cloudflare"
      }
    }
  }
}
```

## Create with Tag Fields

```json
{
  "data": {
    "type": "flexible-assets",
    "attributes": {
      "organization-id": 456,
      "flexible-asset-type-id": 123,
      "traits": {
        "name": "Main Office Network",
        "firewall": [12345],
        "core-switch": [67890],
        "network-admin": [11111]
      }
    }
  }
}
```

## Update Flexible Asset

```http
PATCH /flexible-assets/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "flexible-assets",
    "attributes": {
      "traits": {
        "backup-isp": "AT&T Business",
        "last-reviewed": "2024-02-15"
      }
    }
  }
}
```

## Delete Flexible Asset

```http
DELETE /flexible-assets/789
x-api-key: YOUR_API_KEY
```
