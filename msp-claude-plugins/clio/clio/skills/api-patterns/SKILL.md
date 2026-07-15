---
name: "Clio API Patterns"
description: >
  Use this skill when working with the Clio Manage MCP tools — OAuth 2.0
  Authorization Code connection via Conduit, the matters-as-hub data model,
  decision-tree tool navigation, pagination, and the deliberate v1 scope
  limits (no delete anywhere, documents metadata-only, communications/
  calendar/bills read-only). Essential background before touching any other
  Clio skill.
when_to_use: >-
  When connecting to Clio, navigating its MCP tools, or explaining why a
  Clio operation isn't available. Use when: clio api, clio auth, clio oauth,
  clio connection, clio region, clio navigate, clio pagination, clio scope,
  clio permissions, clio read-only, or clio mcp.
---

# Clio API Patterns

## Overview

Clio Manage is legal practice management software: matters (case/client
files), the people and companies involved in them, time and expense
tracking, tasks, documents, calendar, and billing. This is the first
**legal** vertical in this marketplace — every other plugin here is
MSP/IT tooling, so nothing about Clio's data model, compliance posture, or
connection flow should be assumed to look like a PSA or RMM.

The Clio MCP server exposes tools under `clio_{entity}_{operation}`
(`clio_matters_list`, `clio_activities_create`, etc.), fronted by Conduit
— no local SDK, proxy, or API key on your machine.

## Connection & Authentication

Clio uses **OAuth 2.0 Authorization Code** flow, not an API key. You never
paste a key or secret anywhere:

1. Go to `https://conduit.wyre.ai/connect/clio`
2. Sign in to Clio and approve the requested scopes
3. Optionally set **Clio Region** (see below)
4. Conduit stores the resulting OAuth tokens and refreshes them
   automatically; your MCP client only ever authenticates to Conduit itself

Your MCP client's connection to Conduit (`https://conduit.wyre.ai/v1/clio/mcp`)
is a *separate* OAuth relationship from Conduit's connection to Clio — you
sign in once to Conduit (client-to-gateway), and once to Clio (gateway-to-
vendor, via the connect page above). If a tool call fails with an auth
error, the fix is almost always in Conduit's connect page, not the MCP
client config.

### Clio Region

Clio runs separate regional deployments (US, CA, EU, AU; default **US**).
The **Clio Region** field on the connect page selects which regional API
host Conduit talks to.

**Known v1 limitation:** the region field only changes which regional API
host is used — it does **not** currently guarantee the OAuth Authorization
Code flow completes correctly for CA/EU/AU accounts. This is unverified for
non-US regions as of this writing; if you're on a non-US Clio instance and
the connect flow fails or behaves oddly, that's the known gap, not user
error. Don't paper over it — flag it back to the org so it gets tracked
against the real limitation instead of re-tried indefinitely.

## Tool Navigation

Clio's tools sit behind **decision-tree navigation** — this is deliberate,
not a bug, and it's how the server keeps a large tool surface manageable:

- `clio_navigate` — move into a domain (matters, contacts, activities,
  communications, tasks, documents, calendar-entries, bills)
- `clio_status` — see which domain you're in and what's available from here
- `clio_back` — return to the top-level navigation state

You cannot call a domain tool (e.g. `clio_matters_create`) until you've
navigated into that domain. If a tool appears to be "missing," check
`clio_status` first — it's very likely just not in scope from the current
navigation state.

## The Matters-as-Hub Data Model

**Matters are the hub.** Almost every other object references a
`matter_id`:

- Activities (time/expense entries) are logged *against* a matter
- Tasks are typically scoped to a matter
- Communications (logged emails/calls/notes) are attached to a matter
- Documents are filed under a matter
- Calendar entries commonly reference a matter
- Bills are generated from a matter's unbilled activities

Contacts are the exception — a contact (person or company) exists
independently and can be linked to many matters in different roles (client,
opposing party, witness, etc. — see the [contacts skill](../contacts/SKILL.md)).

Practically: when a user asks "what's going on with Acme's case," resolve
the matter first (`clio_matters_list` / `clio_matters_get`), then pull
whatever domain data you need scoped to that `matter_id`. See
[matter-summary](../../commands/matter-summary.md) for the reference
pattern that pulls contacts, tasks, activities, communications, and bills
for one matter.

## Pagination

List tools (`clio_matters_list`, `clio_contacts_list`, `clio_activities_list`,
etc.) accept a `limit` and return a paging cursor for the next page.
Practical guidance:

- Request a reasonable `limit` (don't default to the max if the user only
  asked for "a few")
- Check the response for a next-page cursor/token; if present, there are
  more results than what you're holding — don't report a list as complete
  just because the first page looked short
- Prefer server-side filters (status, client, date range, matter_id) over
  pulling everything and filtering client-side — Clio accounts can have
  years of matters and activities behind them

If a specific tool's exact pagination field names aren't obvious from
context, check that tool's input/output schema directly rather than
guessing — don't invent parameter names.

## Deliberate v1 Scope Limits — Read This Before Assuming Something Is a Bug

Clio holds privileged attorney-client data. The v1 tool surface is
**conservative by design**, not an oversight, and every limitation below
exists for a specific reason:

| Limitation | Scope | Why |
|---|---|---|
| **No delete tool on any entity** | All domains | Legal records (time entries, matter history, communications) are frequently subject to retention obligations, malpractice-insurance requirements, or discovery. There is no `clio_*_delete` tool anywhere in this server — full stop. Deletion, when truly needed, happens in Clio directly, by a human, with Clio's own audit trail. |
| **Documents are read-only and metadata-only** | `documents` | `clio_documents_list`/`clio_documents_get` return metadata (name, matter, created date, etc.) — **never file content**. There is no download or upload tool. Document *contents* are frequently privileged, client-confidential, or subject to matter-specific access restrictions that this integration has no way to evaluate — so it doesn't try. |
| **Communications are read-only** | `communications` | Logged emails/calls/notes on a matter are often the most sensitive record in the file (privileged attorney-client communication). List/get only — no create, update, or delete. |
| **Calendar entries are read-only** | `calendar-entries` | Same reasoning as communications — court dates, deadlines, and appointment details are read for context, never written by the integration. |
| **Bills are read-only** | `bills` | Billing and trust-accounting mutations require rigor (trust accounting rules, IOLTA compliance) that is explicitly out of scope for v1. You can read bill status and amounts; you cannot generate, edit, or void a bill through this integration. |
| **Activities have no update/delete** | `activities` | Time and expense entries can be *created* (`clio_activities_create`) but not modified or removed through the integration — corrections happen in Clio directly, preserving Clio's own edit history. |

When a user asks for something in one of these categories, don't work
around the limitation (e.g. by trying to fabricate a workaround through an
unrelated tool) — say plainly what the tool surface does and doesn't do,
and point them to Clio directly for the write operation.

## Related Skills

- [Clio Matters](../matters/SKILL.md) — the core case/client-file object
- [Clio Contacts](../contacts/SKILL.md) — people and companies
- [Clio Time & Billing](../time-billing/SKILL.md) — activities (time/expense) and read-only bills
