---
name: "ImmyBot Script Execution"
description: >
  ImmyBot's PowerShell script library and its SYSTEM-context execution model:
  the script tool surface, the find → validate → confirm target → approve →
  execute → review workflow, parameter/timeout/execution-context options, and
  the safety rules governing this destructive, highly privileged operation.
when_to_use: >-
  When browsing, validating, or running ImmyBot PowerShell scripts on endpoints, or reviewing
  script execution history and results. Use when: immybot script, immybot powershell, run script
  immybot, immybot script execution, immybot script history, or immybot remediation script.
---

# ImmyBot Script Execution

ImmyBot ships a PowerShell script library that runs against managed
endpoints in **SYSTEM context**. This is a privileged, destructive
capability — scripts can install/uninstall software, change system
settings, access files, and reboot the machine.

## Anti-triggers

- **Installing or updating software** — ImmyBot has no "install this
  now" call, and a PowerShell installer script is exactly the
  anti-pattern the platform exists to remove; use
  `immybot-software-deployment`.
- **Running a script on an endpoint managed by another RMM** — ImmyBot
  reaches only computers enrolled in this ImmyBot instance, and ImmyBot
  is Windows-only. The same request against another fleet is
  `atera-agents`, `syncro-assets`, `superops-runbooks`,
  `ncentral-monitoring-tasks`, `connectwise-automate-scripts`, or
  `datto-rmm-jobs`.
- **A script that ran inside a reconciliation** — scripts executed by a
  session are tasks; use `immybot-maintenance-sessions`.

## API Tools

| Tool | Purpose |
|------|---------|
| `immybot_scripts_list` | List scripts with category/language/status filters |
| `immybot_scripts_get` | Full detail for one script by ID |
| `immybot_scripts_search` | Search scripts by name |
| `immybot_scripts_categories` | List available script categories |
| `immybot_scripts_validate` | Validate script syntax before running |
| `immybot_scripts_run` | Execute a script on a computer (DESTRUCTIVE) |
| `immybot_scripts_execution_history` | Past executions for a computer |
| `immybot_scripts_execution_result` | Result of one specific execution |

## Canonical Workflow

### 1. Find the script

```
immybot_scripts_search → immybot_scripts_get
```

Read the script description and confirm it matches the intended
outcome. Prefer global, vetted scripts over ad-hoc ones.

### 2. Validate syntax (for new or modified scripts)

`immybot_scripts_validate` checks PowerShell syntax without
executing anything. Always validate custom script content first.

### 3. Confirm the target

`immybot_computers_get` — confirm the computer is online and is the
correct endpoint. Running a script on the wrong machine is the most
common and most damaging mistake.

### 4. Get human approval

`immybot_scripts_run` is destructive. The MCP server returns a
confirmation warning describing SYSTEM-context risk. Surface that
warning, name the script and target computer explicitly, and obtain
operator approval before proceeding.

### 5. Execute and capture

Call `immybot_scripts_run` with the script ID, target computer ID,
optional parameters, timeout (default 30 min), and execution context
(default System).

### 6. Review the result

```
immybot_scripts_execution_result   # this run
immybot_scripts_execution_history  # the computer's run history
```

## Parameters & Timeouts

- **Parameters** — passed as a parameter object; confirm required
  parameters from `immybot_scripts_get` before running.
- **Timeout** — default 30 minutes. Long-running remediation (large
  installs, disk operations) may need a higher value.
- **Execution context** — defaults to System. Only change this if
  the script explicitly needs a user context.

## Safety Rules

- **Never** run a script without explicit human confirmation.
- **Always** name the exact script and exact computer in the
  approval request.
- Validate custom script content with `immybot_scripts_validate`
  before it ever runs.
- For fleet-wide remediation, pilot on one endpoint and review the
  execution result before expanding scope.
- Log the approver, script ID, target, and outcome for every run.

## Related Skills

- [endpoint-management](../endpoint-management/SKILL.md) — pick and verify the target computer
- [api-patterns](../api-patterns/SKILL.md) — destructive-operation confirmation pattern
