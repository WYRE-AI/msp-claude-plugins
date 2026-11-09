# Alert Field Reference

Fields commonly present on an alert returned by `cwautomate_alerts_list` and `cwautomate_alerts_get`. Exact shape varies by Automate version; treat unlisted fields as informational.

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
  Severity: { Id: AlertSeverity; Name: string }; // 1-4; filter with `severity`

  // Timestamps
  TimeGenerated: string;        // When created

  // Context
  Category: string;             // Alert category
}

type AlertSource = 'Monitor' | 'Script' | 'EventLog' | 'System';
type AlertSeverity = 1 | 2 | 3 | 4;
```

The API returns **no status, acknowledgment, history or ticket-link fields**: alerts are read-only, and the Automate REST API has no route that changes or annotates them.
