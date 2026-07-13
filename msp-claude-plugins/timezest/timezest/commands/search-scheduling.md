---
description: List recent TimeZest scheduling requests, grouped by state
argument-hint: "[state]"
arguments: [state]
---

# TimeZest Scheduling Search

Pull recent TimeZest scheduling requests and produce a dispatch-friendly summary grouped by lifecycle state.

## Arguments

- `state` (optional) — Optional state filter (sent / booked / canceled / expired)

## Prerequisites

- TimeZest MCP server connected with a valid `TIMEZEST_API_TOKEN`
- Tools available: `timezest_scheduling_list`, `timezest_scheduling_get`

## Steps

1. **List recent requests**

   Call `timezest_scheduling_list`.

2. **Group by state**

   Bucket results: sent (waiting on customer), booked (confirmed), canceled, expired.

3. **Drill into stuck requests**

   For any request that has been "sent" for more than a working day, call `timezest_scheduling_get` to confirm and call out the PSA ticket from `associated_entities` so dispatch can chase the customer.

4. **Output**

   - Counts per state
   - Stuck-request list (PSA ticket, agent, age)
   - Today's bookings (agent, customer, appointment type, start time)

## Examples

### All recent scheduling activity
```
/search-scheduling
```

### Only the stuck "sent" queue
```
/search-scheduling sent
```

## Related Commands

- (none yet)
