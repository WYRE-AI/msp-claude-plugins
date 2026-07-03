---
name: task-status
description: Drill into an N-central scheduled task's outcome - aggregate status down to per-device results and output
argument-hint: "[task_id] [device_id]"
arguments:
  - name: task_id
    description: Task ID to inspect. Omit to list tasks on a device first.
    required: false
  - name: device_id
    description: Device ID to list tasks for when task_id is unknown
    required: false
---

# N-central Task Status

Answer "did that task actually work?" - from aggregate outcome down to
per-device results and captured output. This is the follow-up workflow
after any scheduled task or direct support task run.

## Prerequisites

- N-central MCP server connected with valid `NCENTRAL_SERVER_URL` and `NCENTRAL_JWT`
- Tools: `ncentral_list_device_tasks`, `ncentral_get_task`, `ncentral_get_task_status`, `ncentral_get_task_status_details`

## Steps

1. **Resolve the task**

   If `task_id` was provided, go straight to step 2. If only `device_id`
   was provided, call `ncentral_list_device_tasks` for that device and let
   the user pick. If neither was provided, ask for one - do not guess.

2. **Get the definition and aggregate status**

   Call `ncentral_get_task` for what the task is (script, parameters,
   targets), then `ncentral_get_task_status` for the aggregate outcome -
   completed / failed / in-progress counts across targets.

3. **Drill into failures only**

   If the aggregate shows failures (or the user asked for output), call
   `ncentral_get_task_status_details` for per-device status, return codes,
   and captured output. Skip this on wide all-green tasks - the details
   payload is large.

4. **Produce the output**

   Task header (name, what it runs, target count), aggregate outcome
   table, then per-failed-device detail: device name/ID, status, return
   code, and the relevant slice of output. If the task is still running,
   say so explicitly and suggest re-checking rather than polling in a
   tight loop.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| task_id | string | No | prompt | Task to inspect |
| device_id | string | No | none | Device to list tasks for when task_id is unknown |

## Examples

```
/ncentral:task-status task_id=456789
```

```
/ncentral:task-status device_id=1001
```

## Related Commands

- `/ncentral:issue-sweep` - the triage that usually precedes a remediation task
- `/ncentral:device-inventory` - device context for the task's targets
