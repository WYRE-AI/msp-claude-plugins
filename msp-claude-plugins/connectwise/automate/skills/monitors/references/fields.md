# Monitor Field Reference

### Monitor Definition Fields

```typescript
interface Monitor {
  // Identifiers
  MonitorID: number;            // Primary key
  MonitorGUID: string;          // Global unique ID
  Name: string;                 // Monitor name

  // Type and Category
  MonitorType: MonitorType;     // Internal, Remote, Agent, SNMP
  Category: string;             // Performance, Service, etc.
  Enabled: boolean;             // Is active

  // Check Configuration
  CheckInterval: number;        // Seconds between checks
  FailAfter: number;            // Failures before alerting
  ResetAfter: number;           // Successes before clearing

  // Alert Settings
  AlertSeverity: number;        // 1-4 severity level
  AlertMessage: string;         // Alert text template
  AlertAction: string;          // Action on alert

  // Thresholds
  Thresholds: MonitorThreshold[];

  // Assignment
  AssignmentType: string;       // Group, Computer, Client
  TargetID: number;             // Target group/computer/client ID

  // Template
  TemplateID: number;           // Parent template ID (0 if not from template)

  // Metadata
  Description: string;          // Monitor description
  DateCreated: string;          // Creation date
  DateModified: string;         // Last modified
}

type MonitorType = 'Internal' | 'Remote' | 'Agent' | 'SNMP' | 'Script';

interface MonitorThreshold {
  Field: string;                // Field to check
  Operator: ThresholdOperator;  // Comparison operator
  Value: string;                // Threshold value
  Duration: number;             // Minutes condition must persist
}

type ThresholdOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'contains' | 'notcontains';
```

### Monitor Template Fields

```typescript
interface MonitorTemplate {
  TemplateID: number;           // Primary key
  Name: string;                 // Template name
  Description: string;          // Template description
  Category: string;             // Template category

  // Default Settings
  MonitorType: MonitorType;
  CheckInterval: number;
  FailAfter: number;
  ResetAfter: number;
  AlertSeverity: number;

  // Thresholds
  Thresholds: MonitorThreshold[];

  // Assignment Rules
  AutoApply: boolean;           // Auto-apply to new computers
  ApplyCondition: string;       // Condition for auto-apply

  // Metadata
  IsBuiltIn: boolean;           // System template
  DateCreated: string;
  DateModified: string;
}
```

### Monitor Status Fields

```typescript
interface MonitorStatus {
  MonitorID: number;
  ComputerID: number;
  Status: MonitorStatusValue;
  LastCheck: string;            // ISO datetime
  LastAlertTime: string;        // Last alert generated
  ConsecutiveFailures: number;  // Current failure count
  CurrentValue: string;         // Last checked value
  Message: string;              // Status message
}

type MonitorStatusValue = 'OK' | 'Warning' | 'Error' | 'Critical' | 'Unknown' | 'Disabled';
```
