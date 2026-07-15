---
description: Log a time entry (billable activity) against a Clio matter
argument-hint: "<matter_id> <description> <hours>"
arguments: [matter_id, description, hours]
---

# Log Time in Clio

Create a time entry (an `activities` create) against a Clio matter. This
is a write operation — confirm the details with the user before calling
the tool if any of them are ambiguous.

## Prerequisites

- Clio connected via Conduit
- Navigate into the `activities` domain (`clio_navigate`)
- Tools: `clio_matters_get`, `clio_activities_create`

## Steps

1. **Resolve the matter**

   If `matter_id` wasn't provided or looks like a client name rather than
   a matter ID, resolve it first (`/search-matters` or `clio_matters_get`
   to confirm it exists). Don't log time against a guessed matter.

2. **Confirm the description**

   Time entry descriptions often appear on client-facing invoices. If the
   user gave you shorthand ("worked on Acme stuff"), either ask for a
   fuller description or write one from context and show it to the user
   before submitting — don't submit vague internal shorthand as the
   client-facing record without at least surfacing it.

3. **Confirm the quantity**

   `hours` should be a plain decimal (e.g. `1.5`), not a mixed format.
   Convert obvious phrasing ("an hour and a half") but confirm anything
   ambiguous.

4. **Confirm billable status if ambiguous**

   Default to billable unless the user says otherwise. If it's genuinely
   unclear (e.g. internal admin work on a client matter), ask.

5. **Create the activity** — `clio_activities_create` with `matter_id`,
   description, time quantity, date (default: today unless specified),
   and billable flag.

6. **Confirm back to the user** what was logged, including the matter it
   was logged against — this is the easiest place for a costly mistake
   (wrong matter) to slip through unnoticed.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| matter_id | string | Yes | - | The matter to log time against |
| description | string | Yes | - | What the time entry is for |
| hours | number | Yes | - | Duration in decimal hours |

## Examples

```
/log-time 2024-014 "Draft motion to compel" 2.5
```

```
/log-time 2024-014 "Client call re: settlement posture" 0.75
```

## Output

```
Logged time entry on matter 2024-014 (Acme v. Beta Supply):

  Description: Draft motion to compel
  Duration:    2.5 hours
  Date:        2026-07-13
  Billable:    Yes

This entry cannot be edited or deleted through this integration — corrections
happen directly in Clio (see the time-billing skill).
```

## Error Handling

### Matter Not Found

```
Matter "2024-999" not found.

Did you mean one of these?
- 2024-014 — Acme v. Beta Supply
- 2024-091 — Acme - Lease Renewal

Run /search-matters to find the right matter first.
```

### Ambiguous Description

```
The description "worked on Acme stuff" is pretty vague for a time entry
that may end up on the client's invoice. Want me to use something more
specific, like "Case review and strategy discussion — Acme v. Beta
Supply," or would you like to provide your own wording?
```

## Related Commands

- `/search-matters` — find the matter_id first
- `/matter-summary` — see recent activity on a matter, including entries you've just logged

## Notes

Activities support create only — there is no update or delete tool. If you
log a mistaken entry, tell the user plainly that fixing it requires going
into Clio directly; do not attempt to "fix" it by creating an offsetting
entry unless the user explicitly asks for that.
