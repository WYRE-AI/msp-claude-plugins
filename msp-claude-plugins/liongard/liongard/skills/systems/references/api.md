# Liongard Systems, Dataprints & Asset Inventory API Reference

Complete endpoint catalog with request and response shapes. All requests
require the `X-ROAR-API-KEY` header.

## Systems

### List All Systems

```http
GET /api/v1/systems?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 10001,
      "Name": "DC01.acme.local",
      "InspectorID": 100,
      "InspectorName": "Active Directory",
      "LaunchpointID": 5001,
      "LaunchpointName": "Acme Corp - Active Directory",
      "EnvironmentID": 1234,
      "EnvironmentName": "Acme Corporation",
      "Status": "Active",
      "LastInspection": "2024-02-15T02:15:00Z",
      "SystemType": "Domain Controller",
      "CreatedOn": "2023-06-01T10:30:00Z",
      "UpdatedOn": "2024-02-15T02:15:00Z"
    }
  ],
  "TotalRows": 2500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 25,
  "PageSize": 100
}
```

### Filter Systems by Environment

```http
GET /api/v1/systems?environmentId={environmentId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Filter Systems by Inspector

```http
GET /api/v1/systems?inspectorId={inspectorId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Filter Systems by Launchpoint

```http
GET /api/v1/systems?launchpointId={launchpointId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Get System by ID

```http
GET /api/v1/systems/{systemId}
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "ID": 10001,
  "Name": "DC01.acme.local",
  "InspectorID": 100,
  "InspectorName": "Active Directory",
  "LaunchpointID": 5001,
  "LaunchpointName": "Acme Corp - Active Directory",
  "EnvironmentID": 1234,
  "EnvironmentName": "Acme Corporation",
  "Status": "Active",
  "LastInspection": "2024-02-15T02:15:00Z",
  "SystemType": "Domain Controller",
  "DetailCount": 45,
  "DetectionCount": 2,
  "CreatedOn": "2023-06-01T10:30:00Z",
  "UpdatedOn": "2024-02-15T02:15:00Z"
}
```

## System Details

### Get System Detail

```http
GET /api/v1/systems/{systemId}/detail
X-ROAR-API-KEY: {api_key}
```

**Response (example for Active Directory system):**
```json
{
  "SystemID": 10001,
  "InspectionDate": "2024-02-15T02:15:00Z",
  "Data": {
    "DomainName": "acme.local",
    "FunctionalLevel": "Windows2016Domain",
    "DomainControllers": [
      {
        "Name": "DC01",
        "IPAddress": "10.0.1.10",
        "OperatingSystem": "Windows Server 2022",
        "FSMORoles": ["PDCEmulator", "RIDMaster"]
      },
      {
        "Name": "DC02",
        "IPAddress": "10.0.1.11",
        "OperatingSystem": "Windows Server 2022",
        "FSMORoles": ["InfrastructureMaster"]
      }
    ],
    "Users": {
      "TotalCount": 150,
      "EnabledCount": 142,
      "DisabledCount": 8,
      "LockedOutCount": 0
    },
    "Groups": {
      "TotalCount": 85,
      "SecurityGroups": 60,
      "DistributionGroups": 25
    },
    "GroupPolicyObjects": {
      "TotalCount": 12,
      "LinkedCount": 10,
      "UnlinkedCount": 2
    },
    "PasswordPolicy": {
      "MinimumLength": 12,
      "ComplexityEnabled": true,
      "MaxAge": 90,
      "MinAge": 1,
      "HistoryCount": 24,
      "LockoutThreshold": 5,
      "LockoutDuration": 30
    }
  }
}
```

### Historical Detail Snapshots

System details maintain historical snapshots for comparison:

```http
GET /api/v1/systems/{systemId}/detail?date=2024-01-15
X-ROAR-API-KEY: {api_key}
```

## Dataprints

### Evaluate Dataprint by System Detail ID

```http
POST /api/v2/dataprints-evaluate-systemdetailid
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "SystemDetailID": 10001,
  "Expression": "Data.Users.TotalCount"
}
```

**Response:**
```json
{
  "Result": 150
}
```

### Complex JMESPath Examples

**Get all domain controller names:**
```json
{
  "SystemDetailID": 10001,
  "Expression": "Data.DomainControllers[*].Name"
}
```

**Response:**
```json
{
  "Result": ["DC01", "DC02"]
}
```

**Get users with specific criteria:**
```json
{
  "SystemDetailID": 10001,
  "Expression": "Data.DomainControllers[?OperatingSystem=='Windows Server 2022'].Name"
}
```

**Extract nested configuration:**
```json
{
  "SystemDetailID": 10001,
  "Expression": "Data.PasswordPolicy.{MinLength: MinimumLength, Complexity: ComplexityEnabled, MaxAge: MaxAge}"
}
```

**Response:**
```json
{
  "Result": {
    "MinLength": 12,
    "Complexity": true,
    "MaxAge": 90
  }
}
```

## Asset Inventory (v2)

### Identity Profiles

Asset Inventory aggregates user identities discovered across all inspections:

```http
GET /api/v2/inventory/identities?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": "identity-uuid-1234",
      "DisplayName": "John Smith",
      "Email": "john.smith@acme.com",
      "EnvironmentID": 1234,
      "Sources": [
        {
          "Inspector": "Active Directory",
          "SystemID": 10001,
          "Username": "jsmith",
          "Status": "Enabled"
        },
        {
          "Inspector": "Microsoft 365",
          "SystemID": 10050,
          "Username": "john.smith@acme.com",
          "LicenseAssigned": true
        }
      ],
      "LastSeen": "2024-02-15T02:15:00Z"
    }
  ],
  "TotalRows": 500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 5,
  "PageSize": 100
}
```

### Get Identity by ID

```http
GET /api/v2/inventory/identities/{identityId}
X-ROAR-API-KEY: {api_key}
```

### Device Profiles

Asset Inventory also aggregates device information:

```http
GET /api/v2/inventory/devices?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": "device-uuid-5678",
      "Hostname": "SERVER-DC01",
      "EnvironmentID": 1234,
      "IPAddresses": ["10.0.1.10"],
      "OperatingSystem": "Windows Server 2022",
      "Sources": [
        {
          "Inspector": "Active Directory",
          "SystemID": 10001,
          "Role": "Domain Controller"
        },
        {
          "Inspector": "VMware vSphere",
          "SystemID": 10100,
          "VMName": "DC01-VM"
        }
      ],
      "LastSeen": "2024-02-15T02:15:00Z"
    }
  ],
  "TotalRows": 800,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 8,
  "PageSize": 100
}
```

### Get Device by ID

```http
GET /api/v2/inventory/devices/{deviceId}
X-ROAR-API-KEY: {api_key}
```
