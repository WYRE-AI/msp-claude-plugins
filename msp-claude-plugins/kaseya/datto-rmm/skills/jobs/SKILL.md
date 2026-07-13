---
name: "Datto RMM Jobs"
description: >
  Use this skill when working with Datto RMM jobs - running quick jobs,
  scheduling jobs, monitoring job status, and viewing results. Covers
  component scripts, job variables, execution status, stdout/stderr output,
  and job management workflows.
when_to_use: >-
  When running quick jobs, scheduling jobs, monitoring job status, and viewing results. Use when:
  datto job, rmm job, quick job, run script, component job, job status, job results, scheduled
  job, or remote execution.
---

# Datto RMM Job Management

## Overview

Jobs in Datto RMM execute component scripts on devices. Quick jobs run immediately; scheduled jobs run at specified times. Each job can accept variables, produces output (stdout/stderr), and has a status lifecycle. This skill covers job execution, monitoring, and results retrieval.

## Key Concepts

### Job Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Quick Job** | Runs immediately | Ad-hoc tasks, troubleshooting |
| **Scheduled Job** | Runs at specified time | Maintenance, recurring tasks |
| **Policy Job** | Runs based on policy | Automated responses |

### Job Lifecycle

```
Created → Queued → Running → Completed/Failed
                      │
                      └─→ Timeout
```

### Component Scripts

Components are the scripts/programs that jobs execute:
- Built-in Datto components
- Custom PowerShell/Bash scripts
- Third-party integrations

## Field Reference

### Job Object

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

### Component Object

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

## API Patterns

### List Components

```http
GET /api/v2/components?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "components": [
    {
      "uid": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
      "name": "Clear Temp Files",
      "description": "Clears Windows temp directories",
      "category": "Maintenance",
      "osType": "Windows",
      "variables": [
        {
          "name": "days",
          "type": "number",
          "required": false,
          "defaultValue": "7",
          "description": "Delete files older than X days"
        }
      ]
    }
  ]
}
```

### Create Quick Job

```http
POST /api/v2/device/{deviceUid}/quickjob
Authorization: Bearer {token}
Content-Type: application/json

{
  "componentUid": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
  "variables": {
    "days": "30"
  }
}
```

**Response:**
```json
{
  "jobUid": "j1k2l3m4-n5o6-7890-pqrs-123456789def",
  "status": "queued",
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "componentUid": "c1d2e3f4-a5b6-7890-cdef-123456789abc",
  "createdAt": 1707991200000
}
```

### Get Job Status

```http
GET /api/v2/job/{jobUid}
Authorization: Bearer {token}
```

**Response (Running):**
```json
{
  "jobUid": "j1k2l3m4-n5o6-7890-pqrs-123456789def",
  "status": "running",
  "startedAt": 1707991260000,
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "hostname": "ACME-DC01",
  "componentName": "Clear Temp Files"
}
```

**Response (Completed):**
```json
{
  "jobUid": "j1k2l3m4-n5o6-7890-pqrs-123456789def",
  "status": "completed",
  "startedAt": 1707991260000,
  "completedAt": 1707991320000,
  "exitCode": 0,
  "stdout": "Deleted 156 files totaling 2.3 GB",
  "stderr": "",
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "hostname": "ACME-DC01",
  "componentName": "Clear Temp Files"
}
```

### Get Jobs for Device

```http
GET /api/v2/device/{deviceUid}/jobs?max=50
Authorization: Bearer {token}
```

### Get Jobs for Site

```http
GET /api/v2/site/{siteUid}/jobs?max=50
Authorization: Bearer {token}
```

## Workflows

### Run Job and Wait for Completion

```javascript
async function runJobAndWait(client, deviceUid, componentUid, variables = {}, options = {}) {
  const { timeoutMs = 300000, pollIntervalMs = 5000 } = options;

  // Create the job
  const createResponse = await client.request(
    `/api/v2/device/${deviceUid}/quickjob`,
    {
      method: 'POST',
      body: JSON.stringify({ componentUid, variables })
    }
  );

  const jobUid = createResponse.jobUid;
  const startTime = Date.now();

  // Poll for completion
  while (true) {
    const job = await client.request(`/api/v2/job/${jobUid}`);

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'timeout') {
      return {
        success: job.status === 'completed' && job.exitCode === 0,
        job
      };
    }

    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      return {
        success: false,
        job,
        error: 'Job polling timeout exceeded'
      };
    }

    await sleep(pollIntervalMs);
  }
}
```

### Find Component by Name

```javascript
async function findComponentByName(client, name) {
  const response = await client.request('/api/v2/components?max=250');
  const components = response.components || [];

  // Exact match
  const exact = components.find(c =>
    c.name.toLowerCase() === name.toLowerCase()
  );
  if (exact) return { found: true, component: exact };

  // Partial match
  const matches = components.filter(c =>
    c.name.toLowerCase().includes(name.toLowerCase())
  );

  if (matches.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (matches.length === 1) {
    return { found: true, component: matches[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: matches.map(c => ({
      name: c.name,
      uid: c.uid,
      category: c.category
    }))
  };
}
```

### Batch Job Execution

```javascript
async function runJobOnMultipleDevices(client, deviceUids, componentUid, variables = {}) {
  const jobs = [];

  for (const deviceUid of deviceUids) {
    try {
      const response = await client.request(
        `/api/v2/device/${deviceUid}/quickjob`,
        {
          method: 'POST',
          body: JSON.stringify({ componentUid, variables })
        }
      );
      jobs.push({
        deviceUid,
        jobUid: response.jobUid,
        status: 'queued'
      });
    } catch (error) {
      jobs.push({
        deviceUid,
        error: error.message,
        status: 'failed'
      });
    }

    // Respect rate limits
    await sleep(100);
  }

  return jobs;
}
```

### Monitor Running Jobs

```javascript
async function monitorJobs(client, jobUids, options = {}) {
  const { onUpdate, timeoutMs = 600000, pollIntervalMs = 10000 } = options;
  const startTime = Date.now();
  const results = new Map();

  // Initialize tracking
  jobUids.forEach(uid => results.set(uid, { status: 'unknown' }));

  while (true) {
    let allComplete = true;

    for (const jobUid of jobUids) {
      const current = results.get(jobUid);
      if (['completed', 'failed', 'timeout'].includes(current.status)) {
        continue;
      }

      try {
        const job = await client.request(`/api/v2/job/${jobUid}`);
        results.set(jobUid, job);

        if (!['completed', 'failed', 'timeout'].includes(job.status)) {
          allComplete = false;
        }

        if (onUpdate) {
          onUpdate(jobUid, job);
        }
      } catch (error) {
        results.set(jobUid, { status: 'error', error: error.message });
      }
    }

    if (allComplete) break;

    if (Date.now() - startTime > timeoutMs) {
      break;
    }

    await sleep(pollIntervalMs);
  }

  return Array.from(results.entries()).map(([jobUid, data]) => ({
    jobUid,
    ...data
  }));
}
```

### Job Result Summary

```javascript
function summarizeJobResult(job) {
  const duration = job.completedAt && job.startedAt
    ? Math.round((job.completedAt - job.startedAt) / 1000)
    : null;

  return {
    jobUid: job.jobUid,
    device: job.hostname,
    component: job.componentName,
    status: job.status,
    exitCode: job.exitCode,
    duration: duration ? `${duration}s` : 'N/A',
    success: job.status === 'completed' && job.exitCode === 0,
    output: job.stdout?.substring(0, 500) || '',
    errors: job.stderr?.substring(0, 500) || ''
  };
}
```

## Error Handling

### Common Job API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device offline | 400 | Device not online | Wait for device or use scheduled job |
| Component not found | 404 | Invalid componentUid | Verify component exists |
| Missing variable | 400 | Required variable not provided | Include all required variables |
| Job not found | 404 | Invalid jobUid | Verify job was created |
| Permission denied | 403 | API restrictions | Check component permissions |

### Error Response Example

```json
{
  "errorCode": "DEVICE_OFFLINE",
  "message": "Cannot run quick job on offline device",
  "details": {
    "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    "lastSeen": 1707900000000
  }
}
```

### Safe Job Execution

```javascript
async function safeRunJob(client, deviceUid, componentUid, variables = {}) {
  // Verify device is online
  const device = await client.request(`/api/v2/device/${deviceUid}`);

  if (device.status !== 'online') {
    return {
      success: false,
      error: `Device is ${device.status}`,
      lastSeen: new Date(device.lastSeen).toISOString()
    };
  }

  // Verify component exists and get required variables
  const component = await client.request(`/api/v2/component/${componentUid}`);

  // Check required variables
  const missingVars = component.variables
    .filter(v => v.required && !variables[v.name])
    .map(v => v.name);

  if (missingVars.length > 0) {
    return {
      success: false,
      error: `Missing required variables: ${missingVars.join(', ')}`
    };
  }

  // Run the job
  try {
    const response = await client.request(
      `/api/v2/device/${deviceUid}/quickjob`,
      {
        method: 'POST',
        body: JSON.stringify({ componentUid, variables })
      }
    );
    return { success: true, jobUid: response.jobUid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Best Practices

1. **Verify device online** - Check status before quick jobs
2. **Provide all variables** - Include required and optional variables
3. **Poll with backoff** - Don't poll too frequently
4. **Handle long-running jobs** - Set appropriate timeouts
5. **Log job results** - Store stdout/stderr for troubleshooting
6. **Use meaningful variable values** - Document what each variable does
7. **Test components first** - Validate on test devices
8. **Monitor exit codes** - 0 typically means success
9. **Handle stderr** - Warnings may appear in stderr even on success
10. **Batch carefully** - Respect rate limits when running on multiple devices

## Job Status Interpretation

| Exit Code | Typical Meaning |
|-----------|-----------------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of command |
| 126 | Permission denied |
| 127 | Command not found |
| 130 | Script terminated (Ctrl+C) |
| 137 | Killed (SIGKILL) |
| 143 | Terminated (SIGTERM) |

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Target device management
- [Datto RMM Variables](../variables/SKILL.md) - Job variables
- [Datto RMM Alerts](../alerts/SKILL.md) - Alert-triggered jobs
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
