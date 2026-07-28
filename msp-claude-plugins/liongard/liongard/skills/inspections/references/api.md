# Liongard Inspectors & Launchpoints API Reference

Complete endpoint catalog with request and response shapes. All requests
require the `X-ROAR-API-KEY` header.

## Inspectors

### List Inspectors

```http
GET /api/v1/inspectors?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 100,
      "Name": "Active Directory",
      "Description": "Inspects Active Directory domain controllers, users, groups, GPOs",
      "Category": "Identity & Access",
      "Version": "3.2.1",
      "RequiresAgent": true,
      "CredentialType": "Domain Admin"
    },
    {
      "ID": 101,
      "Name": "Microsoft 365",
      "Description": "Inspects M365 tenant configuration, users, licenses, security",
      "Category": "Email & Collaboration",
      "Version": "4.1.0",
      "RequiresAgent": false,
      "CredentialType": "App Registration"
    }
  ],
  "TotalRows": 250,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 3,
  "PageSize": 100
}
```

### Get Inspector by ID

```http
GET /api/v1/inspectors/{inspectorId}
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "ID": 100,
  "Name": "Active Directory",
  "Description": "Inspects Active Directory domain controllers, users, groups, GPOs",
  "Category": "Identity & Access",
  "Version": "3.2.1",
  "RequiresAgent": true,
  "CredentialType": "Domain Admin",
  "DataPoints": [
    "Users",
    "Groups",
    "Group Policy Objects",
    "Domain Controllers",
    "Organizational Units",
    "DNS Zones",
    "DHCP Scopes",
    "Certificate Authorities"
  ]
}
```

## Launchpoints

### List Launchpoints

```http
GET /api/v1/launchpoints?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 5001,
      "InspectorID": 100,
      "EnvironmentID": 1234,
      "AgentID": 501,
      "Name": "Acme Corp - Active Directory",
      "Status": "Active",
      "Schedule": "0 2 * * *",
      "LastInspection": "2024-02-15T02:00:00Z",
      "NextInspection": "2024-02-16T02:00:00Z",
      "CreatedOn": "2023-06-01T10:00:00Z",
      "UpdatedOn": "2024-02-15T02:15:00Z"
    }
  ],
  "TotalRows": 500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 5,
  "PageSize": 100
}
```

### Filter Launchpoints by Environment

```http
GET /api/v1/launchpoints?environmentId={environmentId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Get Launchpoint by ID

```http
GET /api/v1/launchpoints/{launchpointId}
X-ROAR-API-KEY: {api_key}
```

### Create Launchpoint

```http
POST /api/v1/launchpoints
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "InspectorID": 100,
  "EnvironmentID": 1234,
  "AgentID": 501,
  "Name": "Acme Corp - Active Directory",
  "Schedule": "0 2 * * *",
  "Configuration": {
    "DomainController": "dc01.acme.local",
    "Username": "admin@acme.local",
    "Password": "encrypted-credential-reference"
  }
}
```

**Response:**
```json
{
  "ID": 5002,
  "InspectorID": 100,
  "EnvironmentID": 1234,
  "AgentID": 501,
  "Name": "Acme Corp - Active Directory",
  "Status": "Active",
  "Schedule": "0 2 * * *",
  "CreatedOn": "2024-02-15T09:00:00Z"
}
```

### Update Launchpoint

```http
PUT /api/v1/launchpoints/{launchpointId}
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Schedule": "0 3 * * *",
  "Name": "Acme Corp - Active Directory (Updated)"
}
```

### Delete Launchpoint

```http
DELETE /api/v1/launchpoints/{launchpointId}
X-ROAR-API-KEY: {api_key}
```

**Warning:** Deleting a launchpoint removes all associated systems and historical inspection data.

## Running Inspections On Demand

### Trigger Immediate Inspection

```http
POST /api/v1/launchpoints/{launchpointId}/run
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "InspectionID": 99001,
  "LaunchpointID": 5001,
  "Status": "Queued",
  "QueuedAt": "2024-02-15T14:30:00Z"
}
```
