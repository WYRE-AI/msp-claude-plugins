---
description: Find and execute an ImmyBot PowerShell script on a target computer (destructive, SYSTEM context)
argument-hint: "<script> <computer>"
arguments: [script, computer]
---

# ImmyBot Run Script

Find the ImmyBot script "$ARGUMENTS.script" and execute it on
"$ARGUMENTS.computer".

## Arguments

- `script` (required) — Script name or keyword to run
- `computer` (required) — Target computer name or hostname

## Prerequisites

- ImmyBot MCP server connected
- Script execution runs in **SYSTEM context** and is destructive —
  this command requires explicit human approval before running
- Tools: `immybot_scripts_search`, `immybot_scripts_get`,
  `immybot_scripts_run`, `immybot_computers_search`,
  `immybot_computers_get`, `immybot_scripts_execution_result`

## Instructions

1. **Find the script** — `immybot_scripts_search`, then
   `immybot_scripts_get` to read the description and required
   parameters. Prefer vetted, global scripts.
2. **Confirm the target** — `immybot_computers_search` then
   `immybot_computers_get`. Verify the computer is online and is the
   intended endpoint.
3. **Request approval** — Present the exact script name, its
   description, the SYSTEM-context warning, and the exact target
   computer. Obtain explicit human approval.
4. **Execute** — With approval, call `immybot_scripts_run` with the
   script ID, computer ID, any required parameters, and a timeout.
5. **Review** — `immybot_scripts_execution_result` for the outcome.
   Report exit status and key output.

## Example

```
/run-script "Disk Cleanup" "SRV-FILE01"
```

## Safety

Never run a script without explicit human confirmation naming the
script and the target computer.

## Related Commands

- `/list-computers` — confirm the target computer first
- `/maintenance-status` — alternative for desired-state remediation
