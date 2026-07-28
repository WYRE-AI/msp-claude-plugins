# Liongard Environment Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ID` | int | System | Auto-generated unique identifier |
| `Name` | string | Yes | Environment display name |
| `Description` | string | No | Optional description text |
| `Status` | string | No | Active or Inactive (default: Active) |
| `Visible` | boolean | No | Visibility in UI (default: true) |
| `Tier` | string | No | Service tier classification |
| `CreatedOn` | datetime | System | Creation timestamp |
| `UpdatedOn` | datetime | System | Last update timestamp |

## Extended Fields

| Field | Type | Description |
|-------|------|-------------|
| `AgentCount` | int | Number of agents associated |
| `LaunchpointCount` | int | Number of configured inspections |
| `SystemCount` | int | Number of discovered systems |
| `DetectionCount` | int | Number of active detections |

## Data Relationships

```
Environment (ID)
    |
    +-- Environment Groups (GroupID)
    |
    +-- Agents (AgentID)
    |
    +-- Launchpoints (LaunchpointID)
    |       +-- Systems (SystemID)
    |
    +-- Detections (DetectionID)
    |
    +-- Metrics (MetricID)
    |
    +-- Integration Mappings
    |
    +-- Timeline Events
```
