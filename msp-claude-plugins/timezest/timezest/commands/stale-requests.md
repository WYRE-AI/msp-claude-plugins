---
description: Find stale TimeZest scheduling requests still waiting on a customer to book
argument-hint: "[min_age]"
arguments: [min_age]
---

# TimeZest Stale Requests

Find TimeZest scheduling requests that have been sent to customers but
not yet booked, so dispatch knows who to chase before the link goes
cold.

## Prerequisites

- TimeZest MCP server connected with a valid `TIMEZEST_API_TOKEN`
- Tools: `timezest_navigate`, `timezest_scheduling_list`,
  `timezest_scheduling_get`

## Steps

1. **List pending requests**

   `timezest_navigate` to `scheduling`, call
   `timezest_scheduling_list` with `status: "pending"`.

2. **Filter by age**

   Keep only requests created more than `min_age` days ago — these are
   customers who received a link and have not acted.

3. **Tier by staleness**

   - **< 1 day** — informational, normal
   - **1–3 days** — needs a nudge (resend or reminder)
   - **> 3 days** — needs a call, or a cancel-and-recreate decision

4. **Pull detail for stuck requests**

   For each stale request call `timezest_scheduling_get` and surface
   the PSA ticket from `associatedEntities`, the assigned resource,
   the customer contact, and the request age.

5. **Output**

   A per-tier table (request ID, PSA ticket, resource, customer, age),
   with the `> 3 days` tier listed first and a recommended action per
   row. Note the polling-cadence assumption.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| min_age | integer | No | 1 | Minimum age in days to count as stale |

## Examples

### All stale requests over a day old

```
/stale-requests
```

### Only requests stuck more than 3 days

```
/stale-requests 3
```

## Related Commands

- `/scheduling-pipeline` — Full pipeline view across resources
- `/search-scheduling` — Recent requests grouped by state
