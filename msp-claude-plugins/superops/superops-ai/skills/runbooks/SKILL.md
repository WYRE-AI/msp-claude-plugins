---
name: "SuperOps Runbooks"
description: >
  SuperOps.ai RMM script automation: finding scripts in the library (all, or by
  OS), their run-time variables, running one script on one asset with
  runScriptOnAsset through the admin-tier GraphQL passthrough, and what the API
  cannot do (batch runs, schedules, reading execution results back).
when_to_use: >-
  When listing, executing, monitoring, and managing automated scripts on assets. Use when:
  superops runbook, superops script, run script superops, execute script, automation superops,
  script execution, runbook execution, script status, bulk script, or scheduled script.
---

# SuperOps.ai Runbook & Script Management

## Overview

SuperOps.ai runs automation as scripts (runbooks) on managed assets: maintenance
tasks, remediation, data collection and custom automation. This skill covers
finding a script and running it on an asset through the SuperOps API, and the
parts that only the SuperOps console can do.

## Anti-triggers

- **A written procedure or checklist** — SuperOps runbooks are
  executable scripts, not documentation. Prose runbooks live in
  `hudu-articles` or `itglue-documents`.
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

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `superops_assets_get` | read | Confirm the target asset is online before a run |
| `superops_custom_query` | admin | `getScriptList` / `getScriptListByType` (no typed script tool exists) |
| `superops_custom_mutation` | admin | `runScriptOnAsset` |

Both passthrough tools are admin tier. Running a script changes a client's
machine, so a named human approver must see the exact mutation and variables
before every run. Never send one from a scheduled or unattended agent.

## Key Concepts

A **script** is a stored library entry with these fields: `scriptId`, `name`,
`description`, `language`, `runAs`, `timeOut`, `runTimeVariables`, `tags` and
`readMe`. `runAs` and `timeOut` belong to the stored script. They cannot be
overridden per run.

Running a script returns an `actionConfigId`. The API has no query that reads
that run's status, exit code or output, so check the result in the SuperOps
console.

| Language | Typical target |
|----------|----------------|
| **PowerShell** | Windows automation |
| **Batch** | Simple Windows tasks |
| **Bash** | macOS/Linux automation |
| **Python** | Cross-platform automation |

See [references/fields.md](references/fields.md) for the field reference.

## API Patterns

| Operation | GraphQL |
|-----------|---------|
| List scripts | `getScriptList(input: ListInfoInput!)` |
| List by OS | `getScriptListByType(input: ScriptListByTypeInput!)` (`type`: `WINDOWS`, `MAC`, …) |
| Run on one asset | `runScriptOnAsset(input: RunScriptInput!)` (`assetId`, `scriptId`, `scriptArguments`) |

That is the whole script surface. The schema has no `getScript`,
`runScriptOnAssets`, `scheduleScript`, `getScriptExecution`, `getBatchExecution`
or `getScriptExecutionHistory`.

`scriptArguments` is a list of `{ name, value }` pairs, one for each name in the
script's `runTimeVariables`. Each value is a string, even for numeric
parameters.

See [references/api.md](references/api.md) for the documents and variables.
Every example there validates against the schema.

## Common Workflows

### Remediation

1. Call `superops_assets_get`. Continue only if `status` is online and
   `lastCommunicatedTime` is recent. A run queued to an offline asset waits until
   the asset checks in.
2. Find the script with `getScriptList` or `getScriptListByType`, and read its
   `runTimeVariables`.
3. Show the operator the `runScriptOnAsset` mutation and variables. Send it
   through `superops_custom_mutation` once they approve.
4. Report the returned `actionConfigId`. Ask the operator to confirm the outcome
   in the console. Record the outcome on the ticket with
   `superops_tickets_add_note`.

### Several assets, or a maintenance window

The API cannot run a script in a batch or on a schedule. Get approval for the
full list of assets, then send one `runScriptOnAsset` per asset. To run at a
future time, schedule the job in the SuperOps console.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Script not found | Invalid script ID | Re-list with `getScriptList` |
| Asset offline | Cannot reach asset | Wait for the asset to check in |
| Missing argument | A `runTimeVariables` name has no value | Add it to `scriptArguments` |
| Permission denied | Token lacks script rights | Check the API user's role |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Exit Code Interpretation

Exit codes are only visible in the SuperOps console. Exit code 137 means the
agent killed the script on timeout, not that the script failed by itself. Check
the script's `timeOut` before you assume a logic error.

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

## Best Practices

1. **Test scripts first** - Test on a single asset before running across a fleet
2. **Use parameters** - Make scripts reusable with run-time variables
3. **Set appropriate timeouts** - On the stored script, to prevent hung runs
4. **Handle errors in scripts** - Return meaningful exit codes
5. **Schedule in the console** - Maintenance windows are a console feature
6. **Record outcomes** - Note each run's result on the ticket
7. **Document scripts** - Clear descriptions and `readMe`
8. **Check asset status** - Verify online before running

## Related Skills

- [SuperOps.ai Assets](../assets/SKILL.md) - Asset details
- [SuperOps.ai Alerts](../alerts/SKILL.md) - Alert-triggered automation
- [SuperOps.ai Tickets](../tickets/SKILL.md) - Ticket-based automation
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
