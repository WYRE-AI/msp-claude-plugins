---
name: "Repeat Ticket Root Cause"
description: >
  Finds problems that keep coming back by grouping 90 days of PSA tickets,
  closed ones included, by device, user and normalized issue type: how to pull
  the history from each PSA family, what counts as a pattern, how to separate
  recurrence from a one-off burst or a single noisy user, how to propose one
  permanent fix per pattern, and how to hand the result over as a draft
  problem ticket for a technician to approve.
when_to_use: >-
  When looking across closed tickets, not just the open board, for recurring
  problems. Use when: repeat tickets, recurring issue, same problem every
  week, keeps coming back, printer every Monday, VPN broken after every patch,
  root cause, problem ticket, permanent fix, chronic device, repeat caller,
  ticket recurrence, top ticket generators.
---

# Repeat Ticket Root Cause

## Overview

Each ticket is closed correctly and the problem still returns. A printer that
jams every Monday, a VPN client that breaks after each patch cycle, one laptop
that blue-screens twice a month: every individual ticket gets a fix and the
client gets no relief. This skill reads closed history across a 90-day window,
finds the recurrences, and proposes one permanent fix per pattern. It is
read-only and built to run on a schedule. The only output that leaves the
skill is a draft problem ticket for a technician to approve.

## Anti-triggers

- **Duplicates and stale tickets on the open board**, use `ops-pack-board-hygiene`.
  That skill looks at what is open now; this one looks at what was closed and
  came back.
- **Investigating one live incident across vendors**, use
  `shared-skills-incident-correlation`.
- **Predicting hardware failure from RMM telemetry**, use the
  `device-failure-early-warning` skill in this pack where it is installed.
  This skill works from ticket text and links, not telemetry.

## Key Concepts

### Three grouping keys

Group the same 90-day set three ways and keep the three views separate, because
each points at a different kind of fix.

| Key | What a cluster usually means | Typical permanent fix |
|---|---|---|
| Device (configuration item or asset linked to the ticket) | Failing hardware, a bad image, a leftover driver | Replace, reimage, retire |
| User (contact) | Training gap, a profile problem, or a user who is simply the only one who reports | Fix the profile, train, or confirm it is not a pattern |
| Issue type (normalized subject, plus category and sub-category) | Systemic: a bad patch, a flaky service, a missing standard | Change the standard, the patch ring or the service, then document it |

Then look for the intersection. "VPN" tickets across 14 different users and 14
different devices is an issue-type pattern. The same three tickets on one
device is a device pattern. Report the key that explains the most tickets
first.

### What counts as a pattern

Defaults to use when the org has not documented its own, and say which you used:

- **3 or more tickets** in 90 days on the same key.
- At least **2 distinct dates** more than 24 hours apart. One incident that
  generated five tickets in an afternoon is a burst, not a recurrence. Hand it
  to `ops-pack-board-hygiene` as duplicates.
- A fresh pattern needs a **closed-and-returned** instance. If every ticket in
  the cluster is still open, report it as an open cluster rather than a repeat.

Also look for **cadence**. Tickets whose creation dates fall on the same
weekday or the same time of month point at something scheduled: a Monday
backup job, a patch window, a license sync, a scheduled task. Report the
cadence as the lead clue, because it is cheaper to confirm than a root cause.

### Normalizing issue type

Subjects are free text. Group on, in order of reliability:

1. The PSA's own category, sub-category or issue type, when the technicians
   fill it in consistently.
2. The linked asset or configuration item.
3. Fuzzy subject match after stripping client names, ticket numbers and
   hostnames ("can't print" and "printer offline" are one cluster).

If a PSA's category field is mostly blank or "Other", say that the grouping
fell back to subject text and the clusters are weaker for it.

### Not a pattern

- Request types that recur by design: onboarding, offboarding and password
  resets. Exclude them and report them as volume only.
- Alert-generated tickets from monitoring. They recur because the alert
  recurs. If the alert source is the cluster, the fix is the alert rule or the
  underlying condition, and the ticket volume is a symptom.
- A single user producing most of the tickets for a client. Say so. It is a
  conversation to have, not an infrastructure fix.

## Pulling closed-ticket history

Discover the connected PSA's tools with `conduit__search_tools` first. The
window is 90 days of tickets in any status. The tools differ in how they
reach closed tickets:

| PSA | Tool | How to reach closed tickets in the window |
|---|---|---|
| Autotask | `autotask_search_tickets` | Defaults to open tickets only. Pass `status` for the completed status ID, one status per call, with `createdAfter`. Discover status IDs with `autotask_list_ticket_statuses`. Max 500 per page. Linked CI and notes need `autotask_get_ticket_details` per ticket. |
| ConnectWise PSA | `cw_search_tickets` | Use `conditions` with a date and no status filter, for example `dateEntered > [2026-08-20T00:00:00Z]`. Page with `page` and `pageSize` up to 1000. Configurations per ticket come from `cw_get_ticket_configurations`. |
| HaloPSA | `halopsa_tickets_list` | `closed_only: true` with `dateoccurred_start` and `dateoccurred_end`, paged with `page_no`. |
| SuperOps | `superops_tickets_list` | Filters by status, priority, client and technician, but has no date filter. Pull the Resolved and Closed statuses per client and drop tickets outside the window yourself. |

Pull per client, not account-wide, so a very large tenant does not hit page
limits and each cluster stays inside one client. Linking tickets to assets is
the strongest grouping signal and the most unevenly filled field, so report
what share of tickets had a linked device.

## Common Workflows

### Weekly sweep (all clients)

1. Discover the PSA tools. Resolve status and category IDs from the PSA's own
   list tools rather than assuming their meaning.
2. For each client, pull the 90-day window in any status, with device, contact,
   category, subject, created and closed dates.
3. Drop excluded request types and alert-generated tickets into a "volume
   only" count.
4. Group three ways, apply the pattern thresholds, and compute cadence.
5. For each pattern, work out the likely root cause from the ticket notes and
   resolutions already in the history. Compare what technicians did each time:
   the same workaround repeated four times is the clearest sign of a missing
   permanent fix.
6. Rank patterns by cost: tickets multiplied by time logged, where the PSA
   exposes time entries (`autotask_search_time_entries`,
   `cw_search_time_entries`), otherwise by ticket count, and say which.
7. Compare to last week's run, if one was kept, and mark each pattern as
   new, continuing or resolved. A pattern with no new tickets in 30 days
   after a fix is resolved.
8. Produce the report and drafts below.

### One-client or one-device drill-down

Run steps 2 to 7 for the given client or device only, and include the full
ticket list behind each pattern, newest first.

## Output

Per client, patterns ranked by cost:

```
Acme Co: 3 patterns, 17 tickets of 64 in the last 90 days (27%)

1. Issue type: VPN client fails after patching (9 tickets, 7 users, 5 dates)
   Cadence: 8 of 9 created within 3 days after the second Tuesday
   Same workaround each time: reinstall VPN client (9 of 9 resolutions)
   Likely root cause: patch ring pushes the OS update before the VPN client
   update. Evidence: ticket notes on #48213, #48977, #49510.
   Proposed permanent fix: hold the VPN client in the same patch ring as the
   OS update, or move it ahead of it.
   Time cost: 11.5 h logged
```

Each pattern states the key, the counts, the cadence if any, the repeated
workaround, the root cause and what that rests on, one proposed permanent
fix, and the cost. Where the cause is a guess, write "hypothesis" and name the
check that would confirm it.

### Draft problem ticket

One draft per pattern, never per ticket. Include the linked ticket numbers,
the evidence above and the proposed fix, and leave the assignee empty.
Show the draft and stop. Create it only after a technician approves, using the
PSA's create-ticket tool. Where the PSA has a Problem ticket type (Autotask's
`autotask_create_ticket` takes a `ticketType` picklist value; discover valid
IDs with `autotask_get_field_info`), use it. Otherwise create a normal ticket
and prefix the title with "Problem:". Do not close or merge the original
tickets.

## Error Handling

- **No PSA connected:** say there is no ticket history to analyze and stop.
- **No closed tickets returned:** check that the closed-status filter was
  applied. On Autotask an omitted `status` returns only open tickets, which
  gives a false "no repeats" result.
- **Window not fully covered:** if a PSA call paged out or errored partway, say
  which clients were partial and exclude them from the ranking instead of
  ranking a truncated count.
- **Few or no linked devices:** fall back to category and subject grouping and
  state the share of tickets that had a device.
- **Notes or resolutions not exposed:** report the pattern and count without a
  root cause, and name the field that was missing.

## Best Practices

- State the window, thresholds and grouping fields used in every report, so
  two runs can be compared.
- Report what the data shows and what it does not. A cluster with no
  resolution text supports "this recurs", not "this is why".

## Related Skills

- [Board Hygiene](../board-hygiene/SKILL.md): duplicate detection on the open
  board; the burst case this skill excludes
- [SLA Escalation Playbooks](../sla-escalation-playbooks/SKILL.md): when a
  recurring problem also keeps putting tickets at SLA risk
