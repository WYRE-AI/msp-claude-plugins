# Datto RMM Device API Reference

## List All Devices

```http
GET /api/v2/devices?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "devices": [
    {
      "uid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
      "hostname": "ACME-DC01",
      "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "siteName": "Acme Corporation",
      "deviceType": "Server",
      "status": "online",
      "intIpAddress": "192.168.1.10",
      "operatingSystem": "Windows Server 2022 Standard",
      "lastSeen": 1707991200000,
      "openAlertCount": 2
    }
  ],
  "pageDetails": {
    "count": 250,
    "nextPageUrl": "/api/v2/devices?max=250&page=abc123"
  }
}
```

## Get Single Device

```http
GET /api/v2/device/{deviceUid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "uid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "hostname": "ACME-DC01",
  "description": "Primary Domain Controller",
  "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "siteName": "Acme Corporation",
  "deviceType": "Server",
  "deviceClass": "device",
  "status": "online",
  "intIpAddress": "192.168.1.10",
  "extIpAddress": "203.0.113.50",
  "macAddresses": ["00:1A:2B:3C:4D:5E"],
  "operatingSystem": "Windows Server 2022 Standard",
  "osVersion": "10.0.20348",
  "manufacturer": "Dell Inc.",
  "model": "PowerEdge R640",
  "serialNumber": "ABC1234567",
  "agentVersion": "2.5.0.1234",
  "lastSeen": 1707991200000,
  "lastReboot": 1707800000000,
  "createdAt": 1680000000000,
  "warrantyExpiry": 1750000000000,
  "udf1": "ASSET-00123",
  "udf2": "IT Infrastructure",
  "udf3": "John Admin",
  "openAlertCount": 2,
  "patchStatus": {
    "patchesApproved": 5,
    "patchesPending": 2,
    "patchesFailed": 0
  }
}
```

## Get Devices by Site

```http
GET /api/v2/site/{siteUid}/devices?max=250
Authorization: Bearer {token}
```

## Update Device

```http
POST /api/v2/device/{deviceUid}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "udf1": "NEW-ASSET-TAG",
  "udf2": "Finance Department"
}
```

## Delete Device

```http
DELETE /api/v2/device/{deviceUid}
Authorization: Bearer {token}
```

Deleting a device removes it from Datto RMM but does not uninstall the agent.
