---
name: "SuperOps Runbooks"
description: >
  SuperOps.ai RMM script automation: script types and OS targeting, run-as contexts,
  execution priority, parameterized arguments, single-asset and batch execution,
  recurring schedules, execution status polling, and exit-code interpretation.
when_to_use: >-
  When listing, executing, monitoring, and managing automated scripts on assets. Use when:
  superops runbook, superops script, run script superops, execute script, automation superops,
  script execution, runbook execution, script status, bulk script, or scheduled script.
---

# SuperOps.ai Runbook & Script Management

## Overview

SuperOps.ai provides automation through scripts (runbooks) that execute on managed assets — maintenance tasks, remediation actions, data collection, and custom automation. This skill covers script discovery, execution, scheduling, and result monitoring.

## Anti-triggers

- **A written procedure or checklist** — SuperOps runbooks are
  executable scripts, not documentation. Prose runbooks live in
  `hudu-articles` or `it-glue-documents`.
- **Running a script on an endpoint managed by another RMM** — "run a
  script on this device" matches five other plugins here just as well.
  Confirm which RMM owns the endpoint, then use `atera-agents`,
  `syncro-assets`, `immybot-script-execution`,
  `ncentral-monitoring-tasks`, `connectwise-automate-scripts`, or
  `datto-rmm-jobs`.
- **Deploying or updating an application** — a script that installs
  software is the anti-pattern `immybot-software-deployment` exists to
  replace when the fleet is on ImmyBot.
- **Choosing the targets** — asset selection and online checks are
  `superops-assets`.

## Key Concepts

A **script** is a stored definition (`scriptId`, type, content, parameters, timeout, `osType`).
Executing it creates an **execution instance** identified by `actionConfigId`; running it
across multiple assets creates a **batch** identified by `batchId`. Scheduling produces a
`scheduleId`.

| Script type | Target OS |
|------|-------------|
| **PowerShell** | Windows automation |
| **Batch** | Simple Windows tasks |
| **Bash** | macOS/Linux automation |
| **Python** | Cross-platform automation |

| Run As | When to use |
|--------|-------------|
| **System** | Admin tasks, service management |
| **Logged-in User** | User-specific tasks |
| **Specific User** | Specific permission needs |

| Priority | Behavior |
|----------|-------------|
| **Immediate** | Execute as soon as possible |
| **Normal** | Standard queue priority |
| **Low** | Execute during low activity |

See [references/fields.md](references/fields.md) for the complete script and execution
field reference.

## Common Workflows

### Remediation

1. Query the asset (`getAsset`) and confirm `status` is Online — a script queued to an
   offline asset stays Pending until it checks in.
2. `runScriptOnAsset` with `priority: "Immediate"` and the required `arguments`.
3. Capture the returned `actionConfigId`.
4. Poll `getScriptExecution` until status reaches a terminal value, then read `exitCode`,
   `output`, and `error`.

### Maintenance Window

Use `runScriptOnAssets` with an `assetIds` array, a future `scheduledTime` (UTC ISO 8601),
and `priority: "Low"`. Track the returned `batchId` with `getBatchExecution`, which
reports `successCount` / `failedCount` alongside per-asset results.

### Data Collection

1. `getAssetList` filtered by client and `status: "Online"` to build the asset list.
2. Feed those `assetId` values into `runScriptOnAssets` with the collection script.
3. Read results from `getBatchExecution`.

### Recurring Schedules

`scheduleScript` accepts a `recurrence` object (`type`, `interval`, `daysOfWeek`) alongside
`scheduledTime`. Omit `recurrence` for a one-time run.

## API Patterns

| Operation | GraphQL |
|-----------|---------|
| List scripts | `getScriptList(input: ListInfoInput!)` |
| List by OS | `getScriptListByType(input: ScriptListByTypeInput!)` |
| Get script | `getScript(input: ScriptIdentifierInput!)` |
| Run on one asset | `runScriptOnAsset(input: RunScriptInput!)` |
| Run on many assets | `runScriptOnAssets(input: RunScriptOnAssetsInput!)` |
| Schedule | `scheduleScript(input: ScheduleScriptInput!)` |
| Execution status | `getScriptExecution(input: ScriptExecutionInput!)` |
| Batch results | `getBatchExecution(input: BatchExecutionInput!)` |
| Execution history | `getScriptExecutionHistory(input: ScriptExecutionHistoryInput!)` |

Arguments are passed as an array of `{ name, value }` objects — values are strings even
for numeric parameters. `runAs` must be supplied per execution; it is not inherited from
the script definition's `runAs` default unless omitted.

See [references/api.md](references/api.md) for the complete operation catalog with
request/response examples and end-to-end workflow queries.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Script not found | Invalid script ID | Verify script exists |
| Asset offline | Cannot reach asset | Wait for asset to come online |
| Timeout exceeded | Script ran too long | Increase timeout or optimize script |
| Permission denied | Insufficient RunAs rights | Check execution context |
| Parameter missing | Required param not provided | Add required arguments |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Exit Code Interpretation

Exit code 137 means the agent killed the script on timeout, not that the script failed
on its own — check the script's `timeout` before assuming a logic error.

```javascript
// Common exit codes
const EXIT_CODES = {
  0: 'Success',
  1: 'General error',
  2: 'Misuse of command',
  126: 'Permission denied',
  127: 'Command not found',
  128: 'Invalid exit argument',
  130: 'Script terminated (Ctrl+C)',
  137: 'Script killed (timeout)',
  255: 'Exit status out of range'
};

function interpretExitCode(code) {
  return EXIT_CODES[code] || `Unknown exit code: ${code}`;
}
```

### Execution Status Handling

Execution is asynchronous — the mutation returns before the script runs. Poll until the
status is one of `Success`, `Failed`, `Timeout`, or `Cancelled`.

```javascript
// Poll for execution completion
async function waitForExecution(actionConfigId, maxWaitMs = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < maxWaitMs) {
    const result = await getScriptExecution({ actionConfigId });

    if (['Success', 'Failed', 'Timeout', 'Cancelled'].includes(result.status)) {
      return result;
    }

    await sleep(pollInterval);
  }

  throw new Error('Execution timed out waiting for completion');
}
```

## Best Practices

1. **Test scripts first** - Test on a single asset before bulk execution
2. **Use parameters** - Make scripts reusable with parameters
3. **Set appropriate timeouts** - Prevent hung scripts
4. **Handle errors in scripts** - Return meaningful exit codes
5. **Use scheduling** - Run maintenance during off-hours
6. **Monitor batch executions** - Track success/failure rates
7. **Document scripts** - Clear descriptions and parameter docs
8. **Check asset status** - Verify online before running

## Related Skills

- [SuperOps.ai Assets](../assets/SKILL.md) - Asset details
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert-triggered automation
- [SuperOps.ai Tickets](../tickets/SKILL.md) - Ticket-based automation
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
