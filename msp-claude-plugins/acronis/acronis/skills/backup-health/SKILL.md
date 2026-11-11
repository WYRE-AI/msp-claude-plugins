---
name: "Acronis Backup Health Triage"
description: >
  Alert-driven backup health triage in Acronis Cyber Protect Cloud: ranking
  customers by active alert load, drilling into the worst machines, reading
  an alert's plan, resource and error context, separating real backup
  failures from noise, and the false-positive write (off by default, write
  tier in Conduit).
when_to_use: >-
  When an MSP needs a daily or weekly backup check across Acronis customers,
  wants to know which clients have failed or missed backups, or is working a
  specific Acronis backup alert. Use when: acronis backup failed, acronis
  alerts, backup health, missed backup, acronis daily check, which clients
  have backup problems, or acronis false positive.
---

# Acronis Backup Health Triage

## Overview

Acronis raises an alert when a backup fails, finishes with warnings, doesn't
run on schedule, or a machine stops reporting. For an MSP the daily question
is "which customers have backup problems right now, and which machines?"
This skill answers it from the alert data first, because alerts are the
cheapest fleet-wide signal, and then drills into machines and plans.

## Anti-triggers

- **Machines with no protection plan at all, or plans that never deployed** —
  those raise no backup alert. Use `acronis-protection-coverage`.
- **Malware, suspicious processes or EDR incidents** — use `acronis-edr-incidents`.

## Key Concepts

| Concept | Meaning |
|---------|---------|
| Alert | One problem on one resource, with a `type`, `category`, `severity`, the plan (`planId`, `planName`) and the resource (`resourceId`, `resourceName`) |
| Category | A group of alert types, such as `Backup` or `Monitoring`. List the ones turned on with `acronis_fetch_categories`. |
| Alert type | The specific condition. List all of them with `acronis_fetch_all_alert_types`, filtered by `category` if needed. |
| Severity | An ordered scale, so `gt(warning)` means "worse than warning" |
| Dismissed | An alert someone cleared. Dismissed alerts carry `deleted_at` and are hidden unless you pass `show_deleted`. |
| Active | Not dismissed. `acronis_fetch_active_alert_count` returns how many there are and when that last changed. |

## Workflow: Daily Backup Health Sweep

1. **Is anything new?** Call `acronis_fetch_active_alert_count`. If the count
   and last-modified time match the last sweep, stop there.
2. **Rank customers.** Call `acronis_fetch_alert_counts_per_customer` with
   `category: ["Backup"]` (confirm the exact category name with
   `acronis_fetch_categories` the first time) and `severity: "gt(warning)"`.
   Sort customers by count.
3. **Shape of the problem.** Call `acronis_fetch_alert_counters` with
   `embed_tenants: true` and `embed_severities: true` to see whether a
   customer's count is many warnings or a few critical alerts.
   `embed_categories` can't be combined with `embed_types` or
   `embed_severities`.
4. **Worst machines.** Call `acronis_fetch_resources_with_top_severity_alerts`
   with `embed_alert: true`. It returns each resource's single worst alert,
   which is the right list for "what do I fix first".
5. **Per-customer detail.** For each customer worth a look, call
   `acronis_fetch_alerts_grouped_per_customer` with that `customer_id`, or
   `acronis_fetch_all_alerts` with `tenant: ["<customer uuid>"]` and the same
   category and severity filters.
6. **One alert.** `acronis_fetch_alert` with `path.id` returns the full alert
   with its details and context.
7. **Group by plan.** If many machines fail under one plan, the plan or its
   storage target is the problem, not the machines. Group the alerts by
   `planName` before writing tickets. `acronis_fetch_alerts_grouped_by_scope`
   can group by any context key that the alert types define.

## Workflow: Working One Alert

1. `acronis_fetch_alert` for the alert.
2. `acronis_fetch_resource` with the alert's resource ID, plus
   `links_and_issues: "embed_detailed"`, to see the machine and any policy
   issues on it.
3. If the machine might be offline, find its agent with `acronis_fetch_agents`
   (`hostname` filter) and check whether it is online. `online: false`
   returns only agents that aren't responding.
4. Check the plan with `acronis_fetch_policy` (`include_settings: true`) when
   the alert points at the schedule, retention or backup destination.
5. Record the finding on the PSA ticket. Acronis has no ticket link for
   backup alerts.

## Reading the Signal

| Pattern | Likely cause | Action |
|---------|--------------|--------|
| One machine, repeated failures, agent offline | Machine powered off, decommissioned, or agent stopped | Confirm with the client before chasing the backup |
| Many machines under one plan fail at once | Destination storage full or unreachable, credentials for the destination changed | Fix the plan or destination once |
| Missed schedule, no failure | Machine asleep or off at backup time | Check power settings or move the schedule |
| Warnings only, completes each day | Usually skipped files, such as locked or in-use files | Review weekly, not daily |
| Alert for a machine the client retired | Stale resource still has a plan applied | Revoke the plan in the console; this connector can't delete resources |

## False Positives (write, off by default)

`acronis_mark_alert_as_false_positive` sets or clears an alert's
false-positive flag with `path.id` and `body.falsePositive` (`true` or
`false`). It changes the alert for everyone in Acronis.

- It's **off by default**. If it isn't in the tool list, writes are turned
  off for the Acronis connector; tell the operator to mark it in the console.
- When writes are on, Conduit puts it at the **write** tier (not admin).
- Only mark an alert after you've confirmed the cause is benign. A backup
  that really failed is never a false positive, even if the machine is
  unimportant. Ask before marking more than one alert at a time.

## Gotchas

- Alert timestamps are Unix **nanoseconds**. For "last 24 hours", take the
  current Unix time in seconds, subtract 86400, multiply by 1,000,000,000 and
  pass the result as one integer: `created_at: "gt(1793491200000000000)"`.
- `acronis_fetch_all_alerts` has no page cursor. For a big partner, filter by
  tenant and category instead of pulling everything, or the result hits the
  100 KB cap and is cut off.
- `planName` and `resourceName` match substrings unless you wrap the value
  in `eq(...)`.
- An empty alert list doesn't mean every machine is backed up. A machine with
  no plan never alerts. Run the coverage check in `acronis-protection-coverage`
  for that.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Headers, filters, pagination and errors
- [protection-coverage](../protection-coverage/SKILL.md) - Machines with no plan, plan deployment issues, agent hygiene
- [tenants-and-usage](../tenants-and-usage/SKILL.md) - Map Acronis customer tenants to your clients
