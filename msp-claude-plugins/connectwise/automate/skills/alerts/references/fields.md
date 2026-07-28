# Alert Field Reference

### Alert Fields

```typescript
interface Alert {
  // Identifiers
  AlertID: number;              // Primary key
  AlertGUID: string;            // Global unique ID

  // Source
  Source: AlertSource;          // Monitor, Script, EventLog, System
  SourceID: number;             // ID of source (MonitorID, ScriptID, etc.)
  SourceName: string;           // Name of source

  // Target
  ComputerID: number;           // Affected computer
  ComputerName: string;         // Computer hostname
  ClientID: number;             // Parent client
  ClientName: string;           // Client name
  LocationID: number;           // Location ID

  // Alert Details
  Subject: string;              // Alert title
  Message: string;              // Detailed message
  Severity: AlertSeverity;      // 1-4 severity level
  Status: AlertStatus;          // Current status

  // Timestamps
  TimeGenerated: string;        // When created
  TimeAcknowledged: string;     // When acknowledged
  TimeResolved: string;         // When resolved
  LastUpdate: string;           // Last status change

  // Acknowledgment
  AcknowledgedBy: string;       // User who acknowledged
  Notes: string;                // Acknowledgment notes

  // Ticket Integration
  TicketID: number;             // Linked ticket ID
  TicketStatus: string;         // Ticket status

  // Context
  Category: string;             // Alert category
  AdditionalData: object;       // Extra context data
}

type AlertSource = 'Monitor' | 'Script' | 'EventLog' | 'System' | 'Manual';
type AlertSeverity = 1 | 2 | 3 | 4;
type AlertStatus = 'New' | 'Active' | 'Acknowledged' | 'Resolved' | 'Cleared' | 'Suppressed';
```

### Alert History Fields

```typescript
interface AlertHistory {
  HistoryID: number;
  AlertID: number;
  Action: string;               // Status change, note added, etc.
  ActionBy: string;             // User who made change
  ActionTime: string;           // When action occurred
  PreviousStatus: string;
  NewStatus: string;
  Notes: string;
}
```
