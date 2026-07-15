---
description: Consolidated view of one Clio matter — contacts, open tasks, recent activities, recent communications, and bills
argument-hint: "<matter_id>"
arguments: [matter_id]
---

# Clio Matter Summary

Pull a consolidated, one-screen view of a single matter: the matter
details, its client/related contacts, open tasks, recent time/expense
activities, recent communications (read-only), and bill status. This is
the "what's the state of this case" workflow.

## Prerequisites

- Clio connected via Conduit
- Navigate into each domain used below before calling its tools
- Tools: `clio_matters_get`, `clio_contacts_get`, `clio_tasks_list`,
  `clio_activities_list`, `clio_communications_list`, `clio_bills_list`

## Steps

1. **Resolve the matter**

   If `matter_id` wasn't provided, ask for it or run
   [/search-matters](../commands/search-matters.md) first — don't guess at
   a matter ID.

2. **Get the matter record** — `clio_matters_get(matter_id)`. Note status,
   responsible attorney, practice area, and client contact ID.

3. **Get the client contact** — `clio_contacts_get(client_id)` for the
   matter's client. If the matter has other related contacts (opposing
   party, witnesses), include them if the tool surface exposes them for
   this matter.

4. **List open tasks** — `clio_tasks_list` filtered to this `matter_id`,
   open/incomplete only unless asked for all.

5. **List recent activities** — `clio_activities_list` filtered to this
   `matter_id`, most recent first, reasonably bounded (e.g. last 10–20 or
   last 30 days) unless the user wants full history.

6. **List recent communications (read-only)** — `clio_communications_list`
   filtered to this `matter_id`. This is privileged content — summarize
   factually (who/when/subject) without embellishing or speculating about
   content you weren't given.

7. **List bills** — `clio_bills_list` filtered to this `matter_id`. Report
   status and amounts; remember bills are read-only — do not offer to
   generate or modify one (see
   [time-billing](../skills/time-billing/SKILL.md)).

8. **Assemble the summary** in this order: matter header (number, status,
   attorney, practice area) → client/related contacts → open tasks →
   recent activities → recent communications → bill status.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| matter_id | string | Yes | The Clio matter to summarize |

## Examples

```
/matter-summary 2024-014
```

## Output

```
Matter 2024-014 — Acme v. Beta Supply
================================================================
Status:     Open
Attorney:   J. Rivera
Practice:   Litigation
Client:     Acme Corporation (contact #8891)

Contacts
--------
Client:          Acme Corporation
Opposing Party:  Beta Supply Co.

Open Tasks (2)
--------------
- Draft discovery requests — due 2026-07-20
- Review deposition transcript — due 2026-07-25

Recent Activities (last 30 days)
---------------------------------
2026-07-10  2.5h   Draft motion to compel
2026-07-08  0.75h  Client call re: settlement posture
2026-07-05  $45.00 Court filing fee (expense)

Recent Communications (read-only, logged entries only)
--------------------------------------------------------
2026-07-09  Email — "Re: settlement posture" (J. Rivera → client)
2026-07-08  Call — logged, 22 min (J. Rivera + client)

Bills
-----
Bill #3312 — Status: Awaiting Payment — $4,250.00 (issued 2026-06-30)
================================================================
```

## Notes

- If any domain returns nothing (no tasks, no recent activity), say so
  plainly rather than omitting the section — an empty task list is a real
  answer ("no open tasks"), not missing data.
- Communications and documents are privileged/sensitive by nature — report
  what the tools return without adding interpretation the source data
  doesn't support.

## Related Commands

- `/search-matters` — find the matter_id first
- `/log-time` — add a new time entry to this matter
