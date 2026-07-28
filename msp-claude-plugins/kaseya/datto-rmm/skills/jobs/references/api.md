# Datto RMM Job API Reference

## List Components

```http
GET /api/v2/components?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "components": [
    {
      "uid": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
      "name": "Clear Temp Files",
      "description": "Clears Windows temp directories",
      "category": "Maintenance",
      "osType": "Windows",
      "variables": [
        {
          "name": "days",
          "type": "number",
          "required": false,
          "defaultValue": "7",
          "description": "Delete files older than X days"
        }
      ]
    }
  ]
}
```

## Create Quick Job

```http
POST /api/v2/device/{deviceUid}/quickjob
Authorization: Bearer {token}
Content-Type: application/json

{
  "componentUid": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
  "variables": {
    "days": "30"
  }
}
```

**Response:**
```json
{
  "jobUid": "j1k2l3m4-n5o6-7890-pqrs-123456789def",
  "status": "queued",
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "componentUid": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
  "createdAt": 1707991200000
}
```

## Get Job Status

```http
GET /api/v2/job/{jobUid}
Authorization: Bearer {token}
```

**Response (Running):**
```json
{
  "jobUid": "j1k2l3m4-n5o6-7890-pqrs-123456789def",
  "status": "running",
  "startedAt": 1707991260000,
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "hostname": "ACME-DC01",
  "componentName": "Clear Temp Files"
}
```

**Response (Completed):**
```json
{
  "jobUid": "j1k2l3m4-n5o6-7890-pqrs-123456789def",
  "status": "completed",
  "startedAt": 1707991260000,
  "completedAt": 1707991320000,
  "exitCode": 0,
  "stdout": "Deleted 156 files totaling 2.3 GB",
  "stderr": "",
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "hostname": "ACME-DC01",
  "componentName": "Clear Temp Files"
}
```

## Get Jobs for Device

```http
GET /api/v2/device/{deviceUid}/jobs?max=50
Authorization: Bearer {token}
```

## Get Jobs for Site

```http
GET /api/v2/site/{siteUid}/jobs?max=50
Authorization: Bearer {token}
```
