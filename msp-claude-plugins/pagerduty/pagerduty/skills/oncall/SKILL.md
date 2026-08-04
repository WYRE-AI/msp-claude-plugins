---
name: "PagerDuty On-Call"
description: >
  PagerDuty on-call model: schedules with rotation layers, restrictions, the
  computed final schedule, and overrides; escalation policy tiers and
  timeouts; on-call entry fields; and the schedule, escalation policy, and
  team MCP tools.
when_to_use: >-
  When determining who is on-call, building or adjusting schedules and rotations,
  reviewing escalation coverage, or arranging shift overrides. Use when:
  pagerduty oncall, pagerduty on-call, pagerduty schedule, pagerduty rotation, pagerduty
  escalation, pagerduty escalation policy, pagerduty override, pagerduty who is on call, pagerduty
  shift, pagerduty team member, pagerduty responder, or pagerduty page.
---

# PagerDuty On-Call Management

## Overview

PagerDuty's on-call system manages who receives pages for each service. Schedules define rotation layers (who is on-call when), and escalation policies define what happens if a page isn't acknowledged (Tier 1 → Tier 2 → Tier 3). For MSPs, PagerDuty on-call management typically covers internal SRE/IT rotations and can be configured per-customer if using multi-account setups.

## Anti-triggers

- **When the SLA clock runs against a customer** — business-hours
  calendars and coverage windows in a helpdesk or PSA are a billing and
  contractual construct, unrelated to who gets woken up. Use
  `freshdesk-sla-business-hours` or `halopsa-contracts`.
- **Escalating a ticket** — raising a PSA ticket's priority or moving it
  to another queue is `freshdesk-ticketing` or `halopsa-tickets`;
  escalation here means a page climbing tiers because nobody
  acknowledged.
- **Reviewing shift load or burnout risk** — Rootly analyses on-call
  health and handoffs but does not author schedules; use `rootly-oncall`.
- **Responder workload metrics and off-hours interruption counts** —
  those are `pagerduty-analytics`; this skill covers coverage, not
  measurement.

## MCP Tools

### On-Call & Schedule Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_oncalls` | Who is currently on-call for each schedule | `schedule_ids[]`, `user_ids[]`, `escalation_policy_ids[]`, `since`, `until` |
| `list_schedules` | List all on-call schedules | `query` (name search), `team_ids[]` |
| `get_schedule` | Get schedule with rotation layers and current on-call | `id`, `since`, `until` |
| `create_schedule` | Create a new on-call schedule | `name`, `time_zone`, `schedule_layers[]` |
| `update_schedule` | Update schedule details or layers | `id` |
| `delete_schedule` | Delete a schedule | `id` |
| `list_schedule_overrides` | List temporary overrides | `id`, `since`, `until` |

### Escalation Policy Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_escalation_policies` | List all escalation policies | `query`, `team_ids[]` |
| `get_escalation_policy` | Get policy details and rules | `id` |

### Team Tools (supporting on-call management)

| Tool | Description |
|------|-------------|
| `list_teams` | List all teams |
| `list_team_members` | List members of a team |
| `add_team_member` | Add a user to a team |

## Key Concepts

### Schedule Structure

A PagerDuty schedule is composed of:
- **Schedule layers** — Define rotation patterns (e.g., weekly rotation of 3 engineers)
- **Restrictions** — Time-of-day or day-of-week windows (e.g., business hours only)
- **Final schedule** — The computed result after restrictions are applied across all layers
- **Overrides** — One-off replacements that take priority over the base schedule

### Escalation Policy Structure

```
Tier 1: Primary on-call responder (5 min to ack)
    ↓ (if not acknowledged)
Tier 2: Secondary responder or team lead (10 min to ack)
    ↓ (if not acknowledged)
Tier 3: Engineering manager
    ↓ (if not acknowledged)
Tier 4: Repeat (or broadcast to whole team)
```

Each tier targets either a **schedule** (on-call rotation) or specific **users**. The escalation timeout is configurable per tier.

### Schedule Layers

| Field | Description |
|-------|-------------|
| `start` | When this layer starts |
| `rotation_type` | daily / weekly / custom |
| `rotation_turn_length_seconds` | How long each person is on-call |
| `users[]` | Ordered list of responders in rotation |
| `restrictions[]` | Active time windows for this layer |

## Common Workflows

### Find Who Is Currently On-Call

1. Call `list_oncalls` with no filters to see all current on-call entries
2. Filter by `schedule_ids[]` or `escalation_policy_ids[]` to narrow to a specific service team
3. The response shows `user` (who is on-call), `schedule`, and `escalation_policy` for each entry
4. `start` and `end` timestamps show when their shift ends

### View Upcoming On-Call Schedule

1. Call `get_schedule` with `id` and `since` (now) / `until` (next 2 weeks)
2. The response includes `final_schedule.rendered_schedule_entries` — the computed on-call assignments
3. Each entry shows: user, start, end — giving you the full rotation timeline

### Create a Temporary Override

When someone is unavailable during their shift:
1. Identify the schedule ID with `list_schedules`
2. Create an override by calling `update_schedule` or use the PagerDuty API directly:
   - `user`: the covering responder
   - `start` / `end`: the override period
3. Verify with `list_schedule_overrides` on the schedule ID

### On-Call Handoff Briefing

Before handing off to the incoming on-call:

1. Call `list_oncalls` to confirm the current and incoming responders
2. Call `list_incidents` with `statuses[]=triggered&statuses[]=acknowledged` to find open incidents
3. For each open incident, call `list_incident_notes` to capture the current investigation state
4. Brief the incoming responder on each open incident: what fired, what was tried, current status

### Check Escalation Policy Coverage

1. Call `list_escalation_policies` to find the policy for the affected service
2. Call `get_escalation_policy` with the ID
3. Review each rule: what schedule/users are in Tier 1, Tier 2, Tier 3
4. Verify no tier has an empty or deleted schedule (common gap that causes missed pages)

### Add Coverage for a Gap

When a rotation has a coverage gap (no one assigned):
1. Call `list_schedule_overrides` to see existing overrides during the gap
2. If gap exists, create an override with the covering engineer's user ID
3. Verify coverage with `get_schedule` for the gap period

## Field Reference

### On-Call Entry Fields

| Field | Description |
|-------|-------------|
| `escalation_policy.id` | The escalation policy this on-call is part of |
| `schedule.id` | The schedule driving this on-call entry |
| `user.id` / `user.name` | The on-call responder |
| `start` | When this person's on-call period started |
| `end` | When their on-call period ends |
| `escalation_level` | Which tier (1 = primary, 2 = secondary) |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Schedule not found | Invalid schedule ID | List schedules with `list_schedules` to find valid IDs |
| User not in account | Invalid user ID for override | List users with `list_users` |
| Override conflict | Overlapping override exists | Check with `list_schedule_overrides` first |
| 401 Unauthorized | Wrong auth format | Use `Token token=<key>` not `Bearer` |

## Best Practices

1. **Always verify coverage** — After any schedule change, check `list_oncalls` to confirm the right person is on-call
2. **Create overrides, not schedule changes** — For temporary gaps, use overrides rather than modifying the base schedule
3. **Use `since`/`until` on `list_oncalls`** — To see future on-call assignments, not just current
4. **Check escalation policy before service go-live** — Verify all tiers have valid, active schedules
5. **Review overrides before major incidents** — Ensure the right people are actually on-call before planned maintenance

## Related Skills

- [Incidents](../incidents/SKILL.md) — Incident lifecycle and triage
- [API Patterns](../api-patterns/SKILL.md) — Auth, full tool reference, pagination
