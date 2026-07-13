---
description: Show who is currently on call across schedules and escalation policies
argument-hint: "[schedule_name] [escalation_policy_name] [days_ahead]"
arguments: [schedule_name, escalation_policy_name, days_ahead]
---

# PagerDuty On-Call Schedule

Show who is currently on call and upcoming on-call assignments. Displays the full escalation chain for each schedule, including primary and secondary responders.

## Prerequisites

- PagerDuty MCP server connected with valid API token
- MCP tools `list_oncalls`, `list_schedules`, `get_schedule`, and `list_escalation_policies` available

## Steps

1. **Fetch current on-call entries**

   Call `list_oncalls` with `since` and `until` set to the current time to get who is on call right now. If `schedule_name` is provided, first call `list_schedules` with `query` to resolve the schedule ID, then filter by `schedule_ids[]`. If `escalation_policy_name` is provided, first call `list_escalation_policies` with `query` to resolve the policy ID, then filter by `escalation_policy_ids[]`.

2. **Group by escalation policy**

   Organize results by escalation policy and escalation level to show the full escalation chain (Level 1 primary, Level 2 secondary, etc.).

3. **Build on-call roster table**

   For each entry, display: escalation policy name, escalation level, schedule name, on-call user name, shift start time, and shift end time.

4. **Fetch upcoming schedule**

   Call `get_schedule` for each schedule with `since` (now) and `until` (now + `days_ahead` days) to show upcoming rotation changes.

5. **Highlight coverage gaps**

   Identify any time periods without an assigned on-call responder. Flag these as coverage gaps that need overrides.

6. **Provide recommendations**

   If coverage gaps are found, suggest creating schedule overrides. If the upcoming rotation is changing soon, note the handoff time and incoming responder.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| schedule_name | string | No | all | Filter to a specific schedule by name |
| escalation_policy_name | string | No | all | Filter to a specific escalation policy |
| days_ahead | integer | No | 7 | Number of days ahead to show upcoming assignments |

## Examples

### Show All Current On-Call

```
/oncall-schedule
```

### Show On-Call for a Specific Schedule

```
/oncall-schedule --schedule_name "Primary On-Call"
```

### Show On-Call with 14-Day Lookahead

```
/oncall-schedule --days_ahead 14
```

### Show On-Call for an Escalation Policy

```
/oncall-schedule --escalation_policy_name "Engineering On-Call"
```

## Error Handling

- **Authentication Error:** Verify `PAGERDUTY_API_TOKEN` is set correctly
- **Schedule Not Found:** Verify the schedule name; use `list_schedules` to find available schedules
- **No On-Call Entries:** The schedule may have a coverage gap or the time range may not overlap with any rotation

## Related Commands

- `/incident-triage` - Triage open incidents
- `/escalate-incident` - Escalate an incident to the next on-call level
- `/service-health` - Check service health status
