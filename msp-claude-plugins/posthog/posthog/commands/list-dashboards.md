---
description: List a PostHog project's dashboards, or retrieve one by ID
argument-hint: "[dashboard_id]"
arguments: [dashboard_id]
---

# List PostHog Dashboards

List dashboards in the connected PostHog project, or retrieve a specific
one with its insight tiles.

## Arguments

- `dashboard_id` (optional) — Retrieve a single dashboard by ID; omit to
  list all dashboards

## Prerequisites

- PostHog connected in Conduit with a personal API key scoped at least to
  `dashboard:read`

## Steps

1. If `dashboard_id` is given, call `dashboard-get` for that ID
2. Otherwise, call `dashboards-get-all` to list every dashboard in the
   project
3. Report dashboard name, ID, and (when retrieving a single dashboard) its
   insight tiles
4. Note each insight tile's "as of" timestamp rather than presenting the
   numbers as live — see `skills/insights-and-dashboards/SKILL.md`

## Examples

### List all dashboards

```
/list-dashboards
```

### Retrieve a specific dashboard

```
/list-dashboards 12345
```

## Error Handling

| Error | Resolution |
|-------|------------|
| 404 Not Found | No dashboard exists with that ID in this project |
| 403 Forbidden | The connected key isn't scoped for `dashboard:read` |
| 429 Rate Limited | Back off and retry — see `skills/api-patterns/SKILL.md` |

## Related Commands

- `/check-insight` — Look up a single insight's result directly
