---
name: "Ticket Triage Agent"
description: >
  Build (or run once) a ticket-triage agent that classifies new PSA
  tickets by priority, advances them to In Progress, and posts a summary
  to the connected chat tool. Works with any curated PSA — Autotask,
  HaloPSA, or ConnectWise PSA.
when_to_use: >-
  Use when a customer wants new support tickets automatically triaged and
  prioritized. Use when: ticket triage, ticket dispatch, priority
  classification, PSA automation.
---

## What this does

Finds new/untriaged PSA tickets, classifies each by priority from its
content, updates the record, moves it to In Progress, and posts a
one-line summary to chat. Can run as a one-off right now, or be installed
as an hourly Claude-managed scheduled routine.

## Source

Generalizes the `ticket-dispatcher` agent (`autotask` plugin, Archetype
B — "the canonical archetype-B fit") plus the equivalent
`service-desk-ops` agents the catalog lists for `halopsa` and
`connectwise-psa` — the same three PSAs `psa-tool-map` curates tool
names for.

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **A connected PSA** | Autotask, HaloPSA, or ConnectWise PSA (curated — see `psa-tool-map` for tool names; another connected PSA works via guided discovery). Must be able to read and update tickets — priority and status. |
| **A connected chat-delivery target** | Slack (shipped) — see `chat-delivery-adapters`. Teams is not yet available. |
| **Scheduled routines access** (only if installing as a routine) | Via the `/schedule` capability; managed at claude.ai/code/routines. |

## Detecting the customer's stack

1. Check which curated PSA is connected. More than one → ask which to
   use. None → tell the human a PSA connection is needed, don't guess.
2. Fetch `skill://advanced-workflows/psa-tool-map/SKILL.md` for that
   vendor's exact tool names, status/priority discovery approach, and
   gotchas.
3. Fetch `skill://advanced-workflows/chat-delivery-adapters/SKILL.md` for
   the connected delivery target's write tool and limits.

## Run it now

1. Using the PSA's "list new/untriaged tickets" tool, find tickets in the
   New (or equivalent untriaged) status.
2. For each, get its detail (title, description, requester).
3. Classify PRIORITY using the rubric below.
4. Call the PSA's "update ticket" tool once per ticket: set priority AND
   advance status to In Progress in the same call — the status change is
   the idempotency guard, so a second run won't reprocess it.
5. Post a one-line summary per ticket to the connected chat-delivery
   target.
6. If an update call fails, leave the ticket in its original status and
   post a "needs a human" message instead — never skip silently.

Priority rubric:
- **Critical**: server/site down, multiple users affected, or a security
  incident.
- **High**: a single user fully blocked from working.
- **Medium**: service degraded but the user can still work.
- **Low**: requests, questions, cosmetic issues.
- When torn between two, pick the lower-severity one.

## Set up as a recurring routine

1. Confirm the PSA connector works (a lightweight test/ping call from the
   tool-map skill, if one exists for the connected vendor).
2. Discover the tenant's status and priority IDs **once**, by name — per
   the tool-map skill's guidance for the connected PSA. Do not bake
   `list_*` discovery calls into the routine itself.
3. Confirm the chat-delivery connector and destination channel.
4. Create a Claude-managed scheduled routine named "Ticket Triage Agent":
   - Schedule: hourly (`0 * * * *`) — Claude-managed routines reject any
     cadence faster than hourly.
   - Attach the PSA connector with `permitted_tools` populated with
     exactly the tools this workflow needs (list, get-detail, update) —
     an attached connector with an empty `permitted_tools` list runs with
     no tools and silently does nothing.
   - Attach the chat-delivery connector with its `permitted_tools`.
   - Routine prompt: the "Run it now" steps above, with the discovered
     status/priority IDs baked in by name (never re-discovered per run).
5. Create one test ticket, trigger a manual run, and verify: the ticket
   moved to In Progress + reprioritized, one chat message posted, and a
   second run does not reprocess it.

## Known gotchas

- **One-hour minimum cadence.** Claude-managed routines reject any cron
  faster than hourly.
- **`permitted_tools` must be populated per connector**, or the routine
  runs with no tools and no error.
- **Routine tool calls prompt for permission** the first time each new
  tool is touched — pre-allow them or expect an approval prompt on first
  run.
- **Don't call list/discovery tools every run** — enumerate once at build
  time; per-run discovery calls are slow enough to hit the tool timeout.

## How it works

### Idempotency is structural
The agent only picks up tickets in the untriaged status, and triaging a
ticket moves it out of that status — the transition itself is the
"already handled" marker. No database or timestamp window is needed.

### Failures escalate to a human
An unclassifiable ticket or a failed update call leaves the ticket
untouched and posts a "needs a human" message — never silently skipped,
never mis-prioritized without a person being told.

## Extending it

This classifies priority only, deliberately — enumerating queue/category
lists per run is what triggers slow discovery calls. To add queue or
category routing, bake those lists into the routine prompt the same way
status/priority IDs are baked in.
