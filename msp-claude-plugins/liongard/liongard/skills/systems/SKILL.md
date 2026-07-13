---
name: "Liongard Systems"
description: >
  Use this skill when working with Liongard systems, system details,
  dataprints for JMESPath evaluation, or asset inventory. Covers
  discovered systems from inspections, system detail data, dataprint
  extraction, and identity/device profiles.
when_to_use: >-
  When working with Liongard systems, system details, dataprints for JMESPath evaluation, or asset
  inventory. Use when: liongard system, liongard device, system detail, dataprint, jmespath,
  liongard asset, liongard inventory, system data liongard, or liongard identity.
---

# Liongard Systems & Data

## Overview

Systems are the entities discovered during Liongard inspections. When a launchpoint runs an inspection, it discovers systems such as servers, firewalls, cloud services, user accounts, domain controllers, and other infrastructure components. Each system contains detailed configuration data captured at the time of inspection, providing a historical record of the IT environment.

## System Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique system identifier |
| `Name` | string | System display name |
| `InspectorID` | int | Inspector that discovered this system |
| `InspectorName` | string | Inspector display name |
| `LaunchpointID` | int | Launchpoint that produced this system |
| `LaunchpointName` | string | Launchpoint display name |
| `EnvironmentID` | int | Parent environment |
| `EnvironmentName` | string | Environment display name |
| `Status` | string | Active, Inactive, Error |
| `LastInspection` | datetime | Last successful inspection timestamp |
| `SystemType` | string | Type classification (Server, Firewall, etc.) |
| `CreatedOn` | datetime | First discovery timestamp |
| `UpdatedOn` | datetime | Last update timestamp |

### Extended Fields

| Field | Type | Description |
|-------|------|-------------|
| `DetailCount` | int | Number of detail records available |
| `DetectionCount` | int | Number of detections for this system |
| `Tags` | array | User-assigned tags |

## API Patterns

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

### What Are System Details?

System details contain the raw configuration data captured during inspections. This is the actual IT documentation data -- user lists, firewall rules, backup statuses, license counts, security settings, and more. Details are stored as structured JSON and can be queried using JMESPath expressions via the dataprints API.

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

### What Are Dataprints?

Dataprints provide a way to extract specific data from system details using JMESPath expressions. Instead of fetching the entire system detail and parsing it client-side, you can use dataprints to query exactly the data you need.

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

### JMESPath Quick Reference

| Expression | Description |
|------------|-------------|
| `Data.Field` | Direct field access |
| `Data.Array[0]` | First array element |
| `Data.Array[*].Name` | All Name values from array |
| `Data.Array[?Status=='Active']` | Filter array elements |
| `Data.{a: Field1, b: Field2}` | Multi-select hash |
| `Data.Array | length(@)` | Count array elements |
| `Data.Array[*].Name | sort(@)` | Sort values |
| `Data.Array[?Age > \`30\`]` | Numeric comparison |

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

## Common Workflows

### Finding Systems by Environment

```javascript
async function getEnvironmentSystems(environmentId) {
  const systems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${instance}.app.liongard.com/api/v1/systems?environmentId=${environmentId}&page=${page}&pageSize=500`,
      {
        headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
      }
    );

    const data = await response.json();
    systems.push(...data.Data);
    hasMore = data.HasMoreRows;
    page++;
  }

  return systems;
}
```

### Extracting Configuration Data

```javascript
async function getPasswordPolicy(systemDetailId) {
  const response = await fetch(
    `https://${instance}.app.liongard.com/api/v2/dataprints-evaluate-systemdetailid`,
    {
      method: 'POST',
      headers: {
        'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        SystemDetailID: systemDetailId,
        Expression: 'Data.PasswordPolicy'
      })
    }
  );

  return response.json();
}
```

### Comparing System Snapshots

1. **Get current detail** - Fetch latest system detail
2. **Get historical detail** - Fetch detail from a specific date
3. **Compare data** - Diff the two snapshots
4. **Identify changes** - Note what configuration items changed

### Cross-Platform Asset Correlation

1. **Query identities** - Get all identities for an environment
2. **Review sources** - See which platforms each identity appears in
3. **Identify gaps** - Find users missing from expected platforms
4. **Check status** - Verify enabled/disabled status across platforms
5. **Report findings** - Generate cross-platform identity report

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid system ID | Verify system exists |
| 401 | Unauthorized | Check API key |
| 404 | System not found | Confirm system ID |
| 404 | System detail not found | System may not have been inspected yet |
| 422 | Invalid JMESPath expression | Check expression syntax |
| 429 | Rate limited | Wait and retry (300 req/min) |

### JMESPath Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Invalid expression | Syntax error in JMESPath | Validate expression syntax |
| Null result | Path doesn't exist in data | Check available data fields |
| Type mismatch | Comparing incompatible types | Verify field types |

## Best Practices

1. **Use dataprints for specific data** - Avoid fetching entire system details when you only need a few fields
2. **Cache system lists** - Systems change infrequently, cache for minutes
3. **Filter by environment** - Always scope queries to specific environments
4. **Handle null data** - Some systems may not have all expected fields
5. **Use pagination** - Never fetch unbounded system lists
6. **Monitor detail counts** - Track detail count changes for data quality
7. **Leverage asset inventory** - Use identities and devices for cross-platform views

## Data Relationships

```
System (SystemID)
    |
    +-- Inspector (InspectorID)
    +-- Launchpoint (LaunchpointID)
    +-- Environment (EnvironmentID)
    |
    +-- System Details
    |       +-- Raw Configuration Data (JSON)
    |       +-- Historical Snapshots
    |       +-- Dataprints (JMESPath queries)
    |
    +-- Detections (DetectionID)
    |
    +-- Asset Inventory
            +-- Identity Profiles
            +-- Device Profiles
```

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Environments](../environments/SKILL.md) - Environment management
- [Liongard Inspections](../inspections/SKILL.md) - Inspectors and launchpoints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
