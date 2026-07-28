# Datto RMM Audit API Patterns

## Get Device Audit

```http
GET /api/v2/device/{deviceUid}/audit
Authorization: Bearer {token}
```

**Response:**
```json
{
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "lastAuditDate": 1707991200000,
  "hardware": {
    "processor": {
      "name": "Intel Core i7-10700",
      "cores": 8,
      "logicalProcessors": 16,
      "speed": 2900
    },
    "memory": {
      "totalRam": 34359738368,
      "availableRam": 17179869184,
      "slots": [...]
    },
    "disks": [...]
  },
  "operatingSystem": {
    "name": "Windows 11 Pro",
    "version": "10.0.22631",
    "architecture": "64-bit",
    "installDate": "2023-10-15",
    "lastBootTime": 1707800000000
  },
  "network": {
    "interfaces": [...],
    "dnsServers": ["192.168.1.1", "8.8.8.8"],
    "defaultGateway": "192.168.1.1"
  }
}
```

## Get Software Inventory

```http
GET /api/v2/device/{deviceUid}/audit/software
Authorization: Bearer {token}
```

**Response:**
```json
{
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "lastScan": 1707991200000,
  "totalCount": 156,
  "applications": [
    {
      "name": "Google Chrome",
      "version": "121.0.6167.140",
      "publisher": "Google LLC",
      "installDate": "2024-01-20",
      "architecture": "x64"
    },
    {
      "name": "Microsoft 365 Apps",
      "version": "16.0.17231.20182",
      "publisher": "Microsoft Corporation",
      "installDate": "2023-12-10",
      "architecture": "x64"
    }
  ]
}
```

## Get ESXi Host Audit

```http
GET /api/v2/device/{deviceUid}/audit/esxi
Authorization: Bearer {token}
```

## Get Printer Audit

```http
GET /api/v2/device/{deviceUid}/audit/printers
Authorization: Bearer {token}
```

