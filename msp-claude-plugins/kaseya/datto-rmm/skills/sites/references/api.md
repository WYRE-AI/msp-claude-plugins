# Datto RMM Site API Reference

## List All Sites

```http
GET /api/v2/sites?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "sites": [
    {
      "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Acme Corporation",
      "description": "Main office",
      "devicesCount": 45,
      "openAlertsCount": 3,
      "onDemand": false
    }
  ],
  "pageDetails": {
    "count": 1,
    "nextPageUrl": null
  }
}
```

## Get Single Site

```http
GET /api/v2/site/{siteUid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "siteId": 12345,
  "name": "Acme Corporation",
  "description": "Main office - Downtown",
  "devicesCount": 45,
  "openAlertsCount": 3,
  "onDemand": false,
  "splapiEnabled": true,
  "createdAt": 1680000000000,
  "modifiedAt": 1707991200000,
  "proxySettings": {
    "enabled": false
  },
  "settings": {
    "autoPatchApproval": false,
    "timezone": "America/New_York"
  }
}
```

## Get Devices for Site

```http
GET /api/v2/site/{siteUid}/devices?max=250
Authorization: Bearer {token}
```

## Get Alerts for Site

```http
GET /api/v2/site/{siteUid}/alerts/open
Authorization: Bearer {token}
```

## Get Resolved Alerts for Site

```http
GET /api/v2/site/{siteUid}/alerts/resolved?max=250
Authorization: Bearer {token}
```

## Create Site

```http
POST /api/v2/sites
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Client Site",
  "description": "Client headquarters",
  "onDemand": false
}
```

## Update Site

```http
POST /api/v2/site/{siteUid}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Site Name",
  "description": "Updated description"
}
```

## Delete Site

```http
DELETE /api/v2/site/{siteUid}
Authorization: Bearer {token}
```

Deleting a site does not delete its devices - they become unassigned.
