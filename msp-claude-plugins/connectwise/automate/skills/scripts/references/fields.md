# Script Field Reference

## Script Fields

```typescript
interface Script {
  // Identifiers
  ScriptID: number;             // Primary key
  ScriptGUID: string;           // Global unique ID
  Name: string;                 // Script name

  // Organization
  FolderID: number;             // Folder ID
  FolderPath: string;           // Full folder path

  // Script Content
  ScriptType: ScriptType;       // Type of script
  ScriptVersion: number;        // Version number
  Description: string;          // Script description

  // Permissions
  ClientID: number;             // 0 for global, or specific client
  LocationID: number;           // 0 for all locations

  // Parameters
  Parameters: ScriptParameter[];

  // Metadata
  DateCreated: string;          // Creation date
  DateModified: string;         // Last modified
  ModifiedBy: string;           // Last editor
  Enabled: boolean;             // Is active
}

type ScriptType = 'Automate' | 'PowerShell' | 'Batch' | 'VBScript' | 'Shell';

interface ScriptParameter {
  Name: string;                 // Parameter name
  Type: ParameterType;          // Data type
  Required: boolean;            // Is required
  DefaultValue: string;         // Default if not provided
  Description: string;          // Parameter help
  Options: string[];            // For dropdown types
}

type ParameterType = 'String' | 'Number' | 'Boolean' | 'Dropdown' | 'Computer' | 'Client';
```

## Script Execution Fields

```typescript
interface ScriptExecution {
  // Identifiers
  ExecutionID: number;          // Unique execution ID
  ScriptID: number;             // Script that ran
  ComputerID: number;           // Target computer

  // Status
  Status: ExecutionStatus;      // Current status
  ExitCode: number;             // Process exit code
  StartTime: string;            // When started
  EndTime: string;              // When finished
  Duration: number;             // Seconds elapsed

  // Results
  Output: string;               // Script stdout
  ErrorOutput: string;          // Script stderr
  LogOutput: string;            // Automate log entries

  // Context
  TriggeredBy: string;          // Who/what initiated
  Parameters: Record<string, string>;  // Passed parameters
}

type ExecutionStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Timeout' | 'Cancelled';
```
