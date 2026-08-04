---
name: "Datto RMM Jobs"
description: >
  Datto RMM job execution: quick jobs vs. scheduled vs. policy jobs, the
  job status lifecycle, component scripts and their variables, and
  stdout/stderr/exit-code result handling.
when_to_use: >-
  When running quick jobs, scheduling jobs, monitoring job status, and viewing results. Use when:
  datto job, rmm job, quick job, run script, component job, job status, job results, scheduled
  job, or remote execution.
---

# Datto RMM Job Management

## Overview

Jobs in Datto RMM execute component scripts on devices. Quick jobs run immediately; scheduled jobs run at specified times. Each job can accept variables, produces output (stdout/stderr), and has a status lifecycle. This skill covers job execution, monitoring, and results retrieval.

## Anti-triggers

- **Running something on a VSA-managed endpoint** — VSA calls these
  agent procedures and exposes `kaseya_vsa_run_procedure`; use
  `kaseya-vsa-api-patterns`.
- **Stored configuration a script reads** — job variables are supplied
  per run; account and site variables are a separate persistent store
  in `datto-rmm-variables`.

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

### Field Reference

A `Job` carries identifiers, target device/site, component, status,
start/complete timestamps, `exitCode`/`stdout`/`stderr` results, and input
`variables`. A `Component` declares its own typed `ComponentVariable[]`
(name, type, required, default). See
[references/fields.md](references/fields.md) for the complete interfaces.

## Common Workflows

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

Related helpers - component lookup by name, batch execution across
multiple devices, multi-job monitoring, result summarization, and a
"safe run" wrapper that pre-validates device status and required
variables - are in [references/examples.md](references/examples.md).

## API Patterns

- `GET /api/v2/components?max=250` - list components (with their variable schemas)
- `POST /api/v2/device/{deviceUid}/quickjob` - create a quick job (`componentUid` + `variables`)
- `GET /api/v2/job/{jobUid}` - poll job status/results
- `GET /api/v2/device/{deviceUid}/jobs?max=50` - job history for a device
- `GET /api/v2/site/{siteUid}/jobs?max=50` - job history for a site

See [references/api.md](references/api.md) for full request/response examples.

## Gotchas

- **Quick jobs fail with 400 `DEVICE_OFFLINE` if the target device isn't online** - check `device.status` first, or fall back to a scheduled job.
- **Missing required component variables fail with 400**, not a partial run - fetch the component's `variables` schema and validate before submitting.
- **`exitCode === 0` is the actual success signal**, not `status === 'completed'` alone - a component can complete with a nonzero exit code.
- **stderr may contain warnings even on success** - don't treat any stderr output as failure by itself.
- Poll with backoff/interval rather than tight-looping; respect rate limits when running jobs across multiple devices (see batch example in references).

### Exit Code Reference

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

See [references/errors.md](references/errors.md) for the full job API error table.

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Target device management
- [Datto RMM Variables](../variables/SKILL.md) - Job variables
- [Datto RMM Alerts](../alerts/SKILL.md) - Alert-triggered jobs
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
