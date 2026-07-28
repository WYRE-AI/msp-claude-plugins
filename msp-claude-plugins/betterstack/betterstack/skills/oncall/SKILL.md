---
name: "Better Stack On-Call"
description: >
  Better Stack on-call: on-call calendars and rotations, escalation and
  notification policies, alert routing, and determining who is currently on
  call.
when_to_use: >-
  When finding out who is on call, editing rotations or escalation policies,
  or paging responders in Better Stack. Use when: betterstack on-call,
  betterstack oncall, on-call schedule, on-call calendar, escalation policy,
  notification policy, alert routing, on-call rotation, betterstack
  schedule, betterstack who is on call, betterstack paging, or betterstack
  responder.
---

# Better Stack On-Call Management

## Overview

Better Stack Uptime includes integrated on-call scheduling that determines who gets paged when a monitor fails. Schedules define rotation patterns, and notification/escalation policies define how and when responders are alerted (via phone, SMS, email, or push). For MSPs, on-call is commonly configured per customer team, with separate schedules for each client's SLA requirements.

## Key Concepts

### Schedule Structure

Better Stack schedules define:
- **Members** - Responders in the rotation
- **Rotation** - Daily, weekly, or custom patterns
- **Time zone** - Critical for follow-the-sun setups
- **Start date** - When the rotation begins

### Notification (Escalation) Policies

Policies define the alert cascade when a monitor goes down:

| Step | Description |
|------|-------------|
| 1 | Page the on-call schedule via phone, SMS, email, push |
| 2 (after timeout) | Escalate to a secondary schedule or individual |
| 3 (after timeout) | Escalate to team manager or broader group |

Better Stack calls these "notification policies" rather than "escalation policies", but they serve the same purpose.

### Notification Methods

- **Phone call** - Voice call for critical alerts
- **SMS** - Text message notification
- **Email** - Email alert with incident details
- **Push notification** - Mobile app notification
- **Slack/Teams** - Integration-based notifications

### Integration with Monitors

Monitors are linked to notification policies at creation time. When a monitor goes down:
1. Better Stack creates an incident
2. The monitor's notification policy fires
3. On-call responders are paged in sequence
4. If acknowledged, escalation stops
5. If not acknowledged within the timeout, the next tier is paged

## API Patterns

### List On-Call Schedules

```
list_on_call_schedules
```

Parameters:
- `per_page` - Results per page
- `page[after]` - Pagination cursor

### Get On-Call Schedule

```
get_on_call_schedule
```

Parameters:
- `id` - The schedule ID

**Key fields:**
- `attributes.name` - Schedule name
- `attributes.time_zone` - Time zone (e.g., "America/New_York")
- `attributes.current_shift` - Current on-call user and shift end
- `attributes.next_shift` - Upcoming on-call user and shift start

### Create On-Call Schedule

```
create_on_call_schedule
```

Parameters:
- `name` - Schedule name (required)
- `time_zone` - Time zone for the schedule

### List Notification Policies

```
list_schedule_policies
```

Parameters:
- `per_page` - Results per page

## Common Workflows

### Find Who Is Currently On-Call

1. Call `list_on_call_schedules` to get all schedules
2. Call `get_on_call_schedule` for each relevant schedule
3. Check the `current_shift` field -- shows who is currently on-call and when their shift ends
4. For MSP use: filter schedules by team to find the on-call person for a specific customer account

### Review Escalation Policy Coverage

1. Call `list_schedule_policies` to see all notification policies
2. For each policy, review the escalation steps:
   - Tier 1: who gets paged first and via what channels
   - Tier 2: escalation timeout and who is next
   - Tier 3: final escalation (manager, team-wide broadcast)
3. Verify no step has a deleted or empty schedule assignment

### On-Call Handoff

Before transitioning between on-call shifts:

1. Call `list_incidents` with `status=acknowledged` to find any open, active incidents
2. For each open incident, call `get_incident` to get current status
3. Check the responsible monitor with `get_monitor` for the affected service
4. Brief the incoming responder on: what monitor is down, what was tried, current status
5. The incoming responder runs `acknowledge_incident` if they are taking ownership

### Maintenance Window Coordination

During planned maintenance:

1. Use `pause_monitor` to prevent false pages during the window
2. Notify the on-call team via `create_status_page_incident` for customer-facing work
3. After maintenance, `resume_monitor` on all paused monitors
4. Verify no stale incidents remain open with `list_incidents`

## Error Handling

### Schedule Not Found

**Cause:** Invalid schedule ID or schedule was deleted
**Solution:** List schedules to verify the correct ID

### Invalid Schedule Configuration

**Cause:** Invalid time zone format or member IDs
**Solution:** Verify time zone format and confirm member IDs exist

### No On-Call User

**Cause:** Schedule has no on-call user for the current time
**Solution:** Check schedule configuration and ensure rotations cover all time periods

## Best Practices

- Use one schedule per customer team for clean MSP client mapping
- Set reasonable escalation timeouts: 5 minutes for Tier 1, 10 minutes for Tier 2
- Always have at least Tier 2 and Tier 3 -- single-tier policies cause missed incidents
- Review `current_shift` before major changes to confirm the right person is on-call
- Coordinate monitor pause/resume with on-call awareness to avoid false pages
- Test escalation policies monthly with synthetic incidents
- Document on-call handoff procedures for consistency
- Configure multiple notification methods for critical monitors

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [monitors](../monitors/SKILL.md) - Monitors that trigger on-call alerts
- [incidents](../incidents/SKILL.md) - Incidents routed through escalation
- [status-pages](../status-pages/SKILL.md) - Status pages updated during incidents
- [logging](../logging/SKILL.md) - Log investigation during incidents
