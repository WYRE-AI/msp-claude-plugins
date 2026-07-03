---
name: issue-sweep
description: Sweep active issues across N-central customers, grouped by severity and probable root cause
argument-hint: "[org_unit_id] [min_severity]"
arguments:
  - name: org_unit_id
    description: Customer or site org unit ID to scope the sweep to. Omit to sweep all customers.
    required: false
  - name: min_severity
    description: Lowest severity to include (e.g. warning, failed)
    required: false
    default: "warning"
---

# N-central Issue Sweep

Sweep active issues across one customer or the whole client base, group
them by probable root cause, and rank what to fix first. This is the
morning-check workflow for N-central shops.

## Prerequisites

- N-central MCP server connected with valid `NCENTRAL_SERVER_URL` and `NCENTRAL_JWT`
- Tools: `ncentral_list_customers`, `ncentral_list_active_issues`, `ncentral_list_job_statuses`, `ncentral_list_maintenance_windows`, `ncentral_get_device_service_status`

## Steps

1. **Resolve scope**

   If `org_unit_id` was provided, sweep just that customer/site. Otherwise
   call `ncentral_list_customers` and sweep every customer. Remember:
   active issues are per customer/site only - there is no SO-level query,
   so "all customers" is always a loop.

2. **Pull active issues per org unit**

   Call `ncentral_list_active_issues` for each org unit in scope. Filter
   client-side to `min_severity` and above. Track per-customer counts as
   you go.

3. **Group by probable cause**

   Group issues by (service/monitor tripped) x (customer/site) x (age).
   A cluster of fresh same-service issues at one site is one probable
   incident. Long-standing issues (days old) go in a separate
   "known noise" bucket.

4. **Check the false-positive signals**

   For the top clusters: check `ncentral_list_maintenance_windows` for the
   affected devices (down-in-window is expected, not an incident), and
   spot-check `ncentral_get_device_service_status` - Stale/Disconnected
   monitors mean "agent not reporting", which is a different problem than
   the alert text claims.

5. **Produce the output**

   Fleet headline (customers swept, total issues, by severity, distinct
   probable causes), then one section per cause ordered by impact with
   evidence and a PROPOSED remediation (never executed - direct tasks are
   the user's call). Close with the known-noise list so nothing is
   silently dropped.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| org_unit_id | string | No | all customers | Customer or site to sweep |
| min_severity | string | No | warning | Lowest severity included |

## Examples

```
/ncentral:issue-sweep
```

```
/ncentral:issue-sweep org_unit_id=123 min_severity=failed
```

## Related Commands

- `/ncentral:device-inventory` - for the inventory context behind an issue cluster
- `/ncentral:task-status` - to check whether a remediation task actually succeeded
