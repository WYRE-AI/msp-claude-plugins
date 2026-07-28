# Liongard Detection Field Reference

## Detection Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique detection identifier |
| `Type` | string | Detection type (Added, Removed, Changed, Threshold) |
| `Severity` | string | Critical, High, Medium, Low, Info |
| `SystemID` | int | System where detection occurred |
| `SystemName` | string | System display name |
| `EnvironmentID` | int | Parent environment |
| `EnvironmentName` | string | Environment display name |
| `InspectorName` | string | Inspector that triggered detection |
| `Status` | string | New, Acknowledged, Resolved, Dismissed |
| `Summary` | string | Brief description of the change |
| `Details` | object | Detailed before/after data |
| `DetectedOn` | datetime | When the change was detected |
| `AcknowledgedOn` | datetime | When acknowledged by user |
| `ResolvedOn` | datetime | When marked resolved |

## Timeline Event Types

| Event Type | Description |
|------------|-------------|
| `InspectionQueued` | Inspection was scheduled to run |
| `InspectionStarted` | Inspection began executing |
| `InspectionCompleted` | Inspection finished successfully |
| `InspectionFailed` | Inspection encountered an error |
| `DetectionCreated` | New detection was identified |
| `DetectionAcknowledged` | Detection was acknowledged by user |
| `DetectionResolved` | Detection was marked resolved |
| `AlertTriggered` | Alert rule fired a notification |
| `UserAction` | User performed an action in the platform |
| `EnvironmentCreated` | New environment was added |
| `LaunchpointCreated` | New launchpoint was configured |
| `AgentOnline` | Agent came online |
| `AgentOffline` | Agent went offline |

## Data Relationships

```
Detection (DetectionID)
    |
    +-- System (SystemID)
    +-- Environment (EnvironmentID)
    +-- Inspector (InspectorName)
    +-- Severity / Type / Status
    +-- Before/After Details

Alert Rule (AlertID)
    |
    +-- Conditions (Severity, Type, Inspector)
    +-- Notifications (Email, Webhook)
    +-- Triggered Alerts
            +-- Detection (DetectionID)

Metric (MetricID)
    |
    +-- Inspector (InspectorID)
    +-- Expression (JMESPath)
    +-- Threshold / Operator
    +-- Evaluations
            +-- System (SystemID)
            +-- Value / Compliant

Timeline (EventID)
    |
    +-- EventType
    +-- Environment (EnvironmentID)
    +-- System (SystemID)
    +-- User (UserID)
    +-- EventDate
```
