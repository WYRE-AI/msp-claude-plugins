# Datto RMM Job Field Reference

## Job Object

```typescript
interface Job {
  // Identifiers
  jobUid: string;               // Unique job ID
  jobId: number;                // Legacy numeric ID

  // Target
  deviceUid: string;            // Target device
  hostname: string;             // Device hostname
  siteUid: string;              // Device's site

  // Component
  componentUid: string;         // Component being run
  componentName: string;        // Component display name

  // Status
  status: JobStatus;            // Current status
  startedAt?: number;           // Execution start (Unix ms)
  completedAt?: number;         // Completion time (Unix ms)

  // Results
  exitCode?: number;            // Process exit code
  stdout?: string;              // Standard output
  stderr?: string;              // Standard error

  // Variables
  variables?: Record<string, string>;  // Input variables

  // Timestamps
  createdAt: number;            // Job creation time
  queuedAt: number;             // When queued
}

type JobStatus = 'created' | 'queued' | 'running' | 'completed' | 'failed' | 'timeout';
```

## Component Object

```typescript
interface Component {
  uid: string;                  // Component UID
  name: string;                 // Display name
  description: string;          // What the component does
  category: string;             // Component category
  osType: string;               // "Windows", "macOS", "Linux"
  variables: ComponentVariable[];
}

interface ComponentVariable {
  name: string;                 // Variable name
  type: string;                 // "string", "number", "boolean"
  required: boolean;            // Is required
  defaultValue?: string;        // Default if not provided
  description: string;          // Variable purpose
}
```
