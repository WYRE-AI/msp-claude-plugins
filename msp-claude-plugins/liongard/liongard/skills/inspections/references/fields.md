# Liongard Inspector & Launchpoint Field Reference

## Inspector Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique inspector identifier |
| `Name` | string | Inspector display name |
| `Description` | string | What the inspector checks |
| `Category` | string | Technology category |
| `Version` | string | Inspector version |
| `RequiresAgent` | boolean | Whether a local agent is needed |
| `CredentialType` | string | Type of credentials required |
| `DataPoints` | array | List of data points collected |

## Launchpoint Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ID` | int | System | Unique launchpoint identifier |
| `InspectorID` | int | Yes | Associated inspector template |
| `EnvironmentID` | int | Yes | Target environment |
| `AgentID` | int | Conditional | Agent to use (if inspector requires) |
| `Name` | string | Yes | Launchpoint display name |
| `Status` | string | No | Active, Inactive, Error |
| `Schedule` | string | No | Cron expression for scheduling |
| `LastInspection` | datetime | System | Last successful inspection |
| `NextInspection` | datetime | System | Next scheduled inspection |
| `CreatedOn` | datetime | System | Creation timestamp |
| `UpdatedOn` | datetime | System | Last update timestamp |

## Inspector Categories

| Category | Examples |
|----------|---------|
| **Identity & Access** | Active Directory, Azure AD, Duo Security, Okta |
| **Email & Collaboration** | Microsoft 365, Google Workspace, Exchange |
| **Networking** | Cisco Meraki, Fortinet, SonicWall, Ubiquiti |
| **Virtualization** | VMware vSphere, Hyper-V, Nutanix |
| **Backup & DR** | Datto, Veeam, Acronis, StorageCraft |
| **Security** | SentinelOne, Sophos, Bitdefender, Huntress |
| **Cloud** | AWS, Azure, GCP |
| **Infrastructure** | Windows Server, Linux, DNS, DHCP, Certificates |

## Data Relationships

```
Inspector (InspectorID)
    |
    +-- Launchpoint (LaunchpointID)
            |
            +-- Environment (EnvironmentID)
            +-- Agent (AgentID)
            +-- Schedule (Cron Expression)
            +-- Configuration (Credentials, Settings)
            |
            +-- Inspections (InspectionID)
            |       +-- Status (Queued/Running/Completed/Failed)
            |       +-- Duration
            |       +-- Timestamp
            |
            +-- Systems (SystemID)
                    +-- System Details
                    +-- Dataprints
```
