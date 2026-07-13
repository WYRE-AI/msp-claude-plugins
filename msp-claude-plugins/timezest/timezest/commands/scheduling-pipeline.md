---
description: Produce a TimeZest scheduling pipeline report grouped by lifecycle state and resource
argument-hint: "[window]"
arguments: [window]
---

# TimeZest Scheduling Pipeline

Produce a dispatch-friendly view of the TimeZest scheduling pipeline —
every request in flight, bucketed by lifecycle state and rolled up per
technician or team.

## Prerequisites

- TimeZest MCP server connected with a valid `TIMEZEST_API_TOKEN`
- Tools: `timezest_navigate`, `timezest_scheduling_list`,
  `timezest_scheduling_get`

## Steps

1. **List recent requests**

   `timezest_navigate` to `scheduling`, then call
   `timezest_scheduling_list`. Scope to `window` with a `createdAt`
   TQL `filter` (e.g. `createdAt:>=2024-01-01`).

2. **Bucket by lifecycle state**

   Group every request: `pending` (link sent, not booked), `booked`
   (slot confirmed), `completed` (appointment occurred), `cancelled`.

3. **Roll up per resource**

   For each agent or team, count links out (pending), bookings landing
   today, completed, and stuck requests.

4. **Compute conversion**

   For the window, divide `booked` + `completed` by total
   non-cancelled requests created. Always show the denominator and the
   window — never a bare percentage.

5. **Output**

   - Counts per lifecycle bucket
   - Per-resource table (resource, pending, landing-today, completed, stuck)
   - Conversion rate with denominator and window
   - Polling-cadence assumption noted at the top

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| window | string | No | 7d | Window to scope the report |

## Examples

### This week's pipeline

```
/scheduling-pipeline
```

### Today only

```
/scheduling-pipeline today
```

## Related Commands

- `/search-scheduling` — Recent requests grouped by state
- `/stale-requests` — Drill into stuck requests waiting on customers
- `/book-tech` — Create a new scheduling request
