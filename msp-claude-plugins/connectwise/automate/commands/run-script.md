---
description: Execute a script on an endpoint in ConnectWise Automate
argument-hint: "<computer> <script> [params] [wait]"
arguments: [computer, script, params, wait]
---

# Run Script

Execute a script on an endpoint in ConnectWise Automate with optional parameters, then collect its result without re-running it.

## Prerequisites

- ConnectWise Automate connected in Conduit (server URL, client ID, username, password)
- An `admin` grant on the `connectwise-automate` vendor: `cwautomate_computers_run_script` and `cwautomate_scripts_execute` are admin-tier
- Operator approval of the exact script and target before step 5

## Steps

1. **Resolve computer identifier**
   - If numeric, use it as the computer ID
   - Otherwise `cwautomate_computers_search` with the hostname

2. **Verify the computer is online**
   - `cwautomate_computers_get`; if offline, stop and report the last contact time

3. **Resolve the script**
   - If numeric, use it as the script ID
   - Otherwise `cwautomate_scripts_list` and match by name; `cwautomate_scripts_get` to read its parameters

4. **Check nothing is already running**
   - `cwautomate_scripts_running` with the computer ID; if the same script is running, report that instead of launching it again

5. **Execute (after approval)**
   - One computer: `cwautomate_computers_run_script` with `computer_id`, `script_id` and `parameters` (key-value pairs). It waits up to 20 seconds.
   - Several computers: `cwautomate_scripts_execute` with `script_id` and the list of computer IDs; it schedules the script and polls its history for the per-computer outcome.

6. **Collect the result**
   - If the run finished inside the wait, report its pass/fail state and Automate's diagnostic message.
   - If the result has `completed: false`, the script is **still running**. Do not launch it again. Read `cwautomate_scripts_history` for that computer (and `cwautomate_scripts_running` to see it is still in progress) until the run appears in history.

Under the hood step 5 issues `POST /cwa/api/v1/Computers/{computerID}/Scripts/{scriptID}/Execute`; Automate has no synchronous run, which is why history is the source of truth for the outcome.

## Catalog commands (not scripts)

Automate's fixed command catalog (for example reboot, refresh inventory) is a separate surface:

1. `cwautomate_commands_list` — find the command ID; free-text commands are not accepted.
2. `cwautomate_computers_run_command` (admin) with `computer_id`, `command_id` and positional `parameters`. It queues the command and returns an `execution_id`.
3. `cwautomate_computers_command_status` with `computer_id` and `execution_id` to read the outcome. Never re-issue on a timeout or a "Duplicate command" result; poll instead.

`cwautomate_computers_reboot` follows the same queue-and-poll pattern.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| computer | string | Yes | - | Computer hostname or ID |
| script | string | Yes | - | Script name or ID |
| params | string | No | - | Parameters as `key=value,key2=value2` |
| wait | flag | No | false | Keep polling `cwautomate_scripts_history` until the run completes |

## Examples

```
/run-script "ACME-DC01" "Clear Temp Files"
/run-script "ACME-DC01" "Clear Temp Files" --params "days=30,path=C:\\Temp"
/run-script 12345 1001 --wait
```

## Output

### Completed

```
Script Completed

Computer:      ACME-DC01 (ID: 12345)
Script:        Clear Temp Files (ID: 1001)
Result:        Success
Message:       Successfully deleted 156 files (2.3 GB freed)
```

### Still running

```
Script still running on ACME-DC01 (ID: 12345)

The run was queued and has not finished within the wait window.
Not re-launching. Checking cwautomate_scripts_history for the result.
```

### Failed

```
Script Failed

Computer:      ACME-DC01
Script:        Clear Temp Files
Message:       Access denied to C:\Temp\locked.file

Suggestions:
- Check whether the file is in use
- Verify the script runs with the permissions it needs
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Computer offline | Agent not checked in | Report last contact; do not queue unless the operator wants it to run on next check-in |
| Script not found | Wrong name or ID | Re-list with `cwautomate_scripts_list` |
| Missing parameters | Required script parameter omitted | Read `cwautomate_scripts_get` and ask for the value |
| Not permitted | No `admin` grant on the vendor | The operator must grant it; do not fall back to another tool |
| `completed: false` | Run outlasted the wait | Poll `cwautomate_scripts_history`; never re-launch |

## Related Commands

- `/list-computers` - Find computer IDs
