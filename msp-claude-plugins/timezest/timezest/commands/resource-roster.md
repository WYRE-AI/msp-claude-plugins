---
description: List TimeZest bookable resources — agents, teams, and appointment types
argument-hint: "[type]"
arguments: [type]
---

# TimeZest Resource Roster

Survey everything bookable in TimeZest — the agents, the teams, and
the appointment types configured for the tenant — so a dispatcher
knows the full menu before creating a scheduling request.

## Prerequisites

- TimeZest MCP server connected with a valid `TIMEZEST_API_TOKEN`
- Tools: `timezest_navigate`, `timezest_resources_list`,
  `timezest_appointment_types_list`

## Steps

1. **List resources**

   `timezest_navigate` to `resources`, call `timezest_resources_list`
   with `filter: "active:true"` and `pageSize: 100`. Apply `type` if
   the caller passed `agent` or `team`.

2. **List appointment types**

   `timezest_navigate` to `appointment_types`, call
   `timezest_appointment_types_list` with `active:true`.

3. **Output**

   - **Agents & Teams** — table of resource name, type, active status
   - **Appointment Types** — table of type name, duration (minutes),
     description

   Group agents and teams separately so the dispatcher sees the
   technician pool and the round-robin pools at a glance.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter resources to `agent` or `team` |

## Examples

### Full roster

```
/resource-roster
```

### Teams only

```
/resource-roster team
```

## Related Commands

- `/book-tech` — Book a resolved resource against a PSA ticket
- `/scheduling-pipeline` — See what each resource has in flight
