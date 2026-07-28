---
name: "Clio Time & Billing"
description: >
  Clio time and expense activities logged against a matter: the activities
  domain's create-only lifecycle, the billing-read / time-entry-write
  split, and why billing mutations are out of scope for v1.
when_to_use: >-
  When logging a time entry, logging an expense, or looking up bill status
  in Clio. Use when: clio time entry, clio activity, clio billable hours,
  clio expense, clio bill, clio invoice, clio billing, or clio log time.
---

# Clio Time & Billing

## Overview

Clio splits billing-adjacent work into two domains with very different
permissions, and the split is deliberate:

| Domain | Tools | Can you write? |
|---|---|---|
| **activities** | `clio_activities_list`, `clio_activities_get`, `clio_activities_create` | Create only — no update, no delete |
| **bills** | `clio_bills_list`, `clio_bills_get` | Read-only |

Both domains reference `matter_id` — activities are logged *against* a
matter, and bills are generated from a matter's unbilled activities. See
the [api-patterns skill](../api-patterns/SKILL.md) for the full
matters-as-hub picture.

## Activities: Time and Expense Entries

An **activity** is either a time entry or an expense entry logged against
a matter. Typical fields:

- `matter_id` — the matter the activity belongs to (required)
- Type — time entry vs. expense entry
- Description — what the work/expense was
- Quantity — for time entries, the duration; for expense entries, the
  amount or unit count
- Rate — billing rate applied (time entries) or unit cost (expenses)
- Date — when the work/expense occurred
- Billable / non-billable flag

### Logging Time

Use `clio_activities_create` with `matter_id`, a description, and the time
quantity. Before creating:

1. **Resolve the matter first** — don't create a time entry against a
   guessed or partially-matched matter. If the user names a client but not
   a specific matter, and the client has multiple matters, ask which one.
2. **Get the description right** — time entry descriptions often end up on
   client-facing invoices; write them the way the attorney would want a
   client to read them, not as an internal shorthand, unless told
   otherwise.
3. **Confirm billable status** if it's ambiguous — defaulting non-billable
   work to billable (or vice versa) has real revenue/client-relationship
   consequences.

See [/log-time](../../commands/log-time.md) for the command-level workflow.

### Why No Update or Delete on Activities

Once created, an activity can't be modified or removed through this
integration. Corrections happen in Clio directly, which preserves Clio's
own edit history for what is, in most firms, a billing-relevant record.
If a user asks you to "fix" a time entry you just logged, say plainly that
correcting or removing it needs to happen in Clio — don't attempt a
workaround (e.g. creating an offsetting negative entry) without the user
explicitly asking for that specific approach.

## Bills: Read-Only

`clio_bills_list` / `clio_bills_get` let you look up bill status, amounts,
and which matter a bill was generated from — but you cannot generate,
edit, void, or send a bill through this integration.

### Why Billing Mutations Are Out of Scope for v1

Generating or modifying a bill correctly requires trust-accounting rigor
this integration doesn't attempt: IOLTA/trust compliance, correct
application of retainers, avoiding double-billing across overlapping
billing cycles, and firm-specific billing rules (flat fee vs. hourly vs.
contingency) that vary matter to matter. Getting this wrong isn't a
cosmetic bug — it's a compliance and client-trust problem. So v1 reads
bills for context (e.g. "has this matter been billed recently, and for
how much") and leaves all billing actions to Clio's own billing workflow,
where a human with full context runs it.

When a user asks you to "send an invoice" or "write off this bill,"
explain that billing actions aren't available through this integration
and point them to Clio directly.

## Common Workflow: Time Entry Then Status Check

A typical flow: log time against a matter
(`clio_activities_create`), then later check whether that matter's
unbilled activity has made it onto a bill (`clio_bills_list` filtered by
`matter_id`). These are two separate, one-directional operations — there's
no tool that ties a specific activity to the bill it ended up on; you can
only observe bill-level totals and status.

## Related Skills

- [Clio API Patterns](../api-patterns/SKILL.md) — connection, navigation, scope limits, and why the whole surface is conservative-by-design
- [Clio Matters](../matters/SKILL.md) — the matter activities and bills are scoped to
- [Clio Contacts](../contacts/SKILL.md) — the client a bill is ultimately billed to
