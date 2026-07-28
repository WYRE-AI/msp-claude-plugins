# Liongard System Field Reference

## Core Fields

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

## Extended Fields

| Field | Type | Description |
|-------|------|-------------|
| `DetailCount` | int | Number of detail records available |
| `DetectionCount` | int | Number of detections for this system |
| `Tags` | array | User-assigned tags |

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
