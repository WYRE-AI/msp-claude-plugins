---
description: List active alerts across NinjaOne devices
argument-hint: "[priority] [organization]"
arguments: [priority, organization]
---

List active alerts in NinjaOne.

## Arguments

- `priority` (optional) — Filter by priority (critical, high, medium, low)
- `organization` (optional) — Filter by organization name or ID

## Filters
- Priority: $ARGUMENTS.priority (if specified)
- Organization: $ARGUMENTS.organization (if specified)

## Instructions

1. Query alerts across devices
2. Apply filters if specified
3. Sort by severity (CRITICAL first, then HIGH, MEDIUM, LOW)
4. Present in a clear, actionable format

## Output Format

### Active Alerts

**Total:** {count} alerts ({critical_count} critical)

| Device | Organization | Alert | Severity | Since |
|--------|--------------|-------|----------|-------|
| SERVER-01 | Acme Corp | Disk space < 10% | CRITICAL | 2 hours ago |
| WS-JANE | Beta Inc | AV definitions outdated | MAJOR | 1 day ago |

### Actions

For each alert, indicate available actions:
- Dismiss alert
- Create ticket
- View device details

## If No Alerts

If no alerts match the criteria, confirm:
"No active {priority} alerts found{for organization}."
