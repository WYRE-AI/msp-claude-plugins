---
name: "MSPCFO API Patterns"
description: >
  MSPCFO MCP fundamentals for this plugin: OAuth 2.0 + PKCE browser sign-in
  brokered by Conduit (no API key, no headers), the admin-only tool gate
  while MSPCFO's tools are unclassified in Conduit, discovering tool names
  at runtime because MSPCFO does not publish them, report parameters and
  result size, error handling, and data-freshness caveats.
when_to_use: >-
  When connecting MSPCFO, working out which MSPCFO tool to call, or
  debugging missing tools, auth failures or odd numbers from the MSPCFO MCP
  server. Use when: mspcfo api, mspcfo auth, mspcfo oauth, mspcfo sign in,
  mspcfo connect, mspcfo tools missing, mspcfo error, or mspcfo mcp.
---

# MSPCFO API Patterns

## Overview

MSPCFO runs a first-party hosted MCP server at `https://app.mspcfo.com/mcp`.
There is no WYRE sidecar. Conduit proxies the server at
`https://conduit.wyre.ai/v1/mspcfo/mcp` and handles sign-in. This skill
covers what is not guessable from the tools themselves: how auth works,
why tool names must be discovered live, and who can see the tools.

## Anti-triggers

- **Which client or agreement is losing money** — use
  `mspcfo-client-profitability` or `mspcfo-agreement-pricing-review`.
- **Technician hours and utilization** — use
  `mspcfo-technician-utilization`.

## Connection and authentication

- Auth is OAuth 2.0 authorization code with PKCE (S256), scope "mcp",
  against MSPCFO's own authorization server. Conduit registers a public
  client, so there is no client secret.
- The user connects once in Conduit (**Connections → MSPCFO**), signs in
  with their MSPCFO account in the browser, and Conduit keeps the access
  and refresh tokens server-side. Conduit sends the access token to MSPCFO
  as a bearer token itself; the client sends no vendor header.
- `.mcp.json` therefore declares only the Conduit URL. Never add an
  Authorization header or an API key variable for MSPCFO: there is none.
- The token carries the signed-in MSPCFO user's permissions. If a report
  is missing or partial, the MSPCFO account may not have access to it.

## The admin-only gate in Conduit

MSPCFO's tools are on Conduit's unclassified backlog: no tool has a tier
yet, so Conduit fails closed.

- Admin-tier callers see every tool MSPCFO lists.
- Every other caller sees **no** MSPCFO tools.

So "connected, but no MSPCFO tools" almost always means the caller's
Conduit tier is below admin, not that sign-in failed. Say that plainly
and point the user to a Conduit admin. Do not retry the sign-in.

Every MSPCFO tool is admin-gated in Conduit, whatever it does. That will
change only after WYRE classifies the tools from a verified live
connection.

## Discovering tools

MSPCFO does not publish its MCP tool names, and this plugin does not
invent them.

1. Read the MSPCFO tools from the live tool list in the session (they
   appear under the mspcfo server).
2. Match each job to a tool by its description and input schema. MSPCFO's
   public MCP page says the server draws on these reports: Client P&L,
   Client Segments, Market Segments, Member Work Report, Members Billing
   by Month, Utilization Hours and FFA Components.
3. If no listed tool covers the report you need, tell the user which
   report is missing. Do not fall back to a guessed tool name or to
   arithmetic on unrelated data presented as if MSPCFO computed it.
4. If a tool's description says it creates, updates, deletes, sends or
   schedules something, treat it as a write. Describe the exact call and
   get the user's approval first.

## Parameters and result size

MSPCFO has not published parameter schemas or pagination rules. Read them
from each tool's input schema. In practice:

- Reports are period-based. Pass an explicit date range or period and
  state it in your answer. Prefer whole months and like-for-like
  comparisons (this quarter vs. the same quarter last year).
- Scope to one client or agreement when the question is about one client.
  Portfolio-wide pulls are large.
- If a result looks cut off (round-number row counts, a continuation
  token, a "more results" hint), follow the tool's own paging field if it
  has one. Otherwise narrow the period or scope, and say the first answer
  was partial.

## Errors

| Situation | Likely cause | Action |
|---|---|---|
| No MSPCFO tools listed | Caller's Conduit tier is below admin | Ask a Conduit admin; sign-in is fine |
| Connect refused or MSPCFO missing from Connections | Connector still hidden in Conduit | Nothing to fix client-side; contact WYRE |
| Auth error after a working period | Refresh failed (MSPCFO user disabled, password reset, access revoked) | Reconnect in Conduit and sign in again |
| Empty report, no error | Period has no data, filter too narrow, or the MSPCFO user cannot see it | Widen the period, then check the user's MSPCFO permissions |
| Throttling or upstream 5xx | MSPCFO or Conduit is rate limiting or degraded | Wait, then retry once with a smaller scope; do not loop |

MSPCFO does not publish rate limits. Sequence portfolio sweeps client by
client rather than firing many large report calls at once.

## Data freshness and trust

- MSPCFO's numbers come from synced PSA data plus MSPCFO's cost and
  agreement setup. They are only as good as time entry, labor cost rates
  and agreement mapping in the PSA.
- MSPCFO describes its MCP as early and asks customers to check important
  numbers against the report in the MSPCFO app. Do that before anything
  reaches a client or a pricing decision.
- Calculated metrics (efficiency, employee revenue productivity, margins)
  are MSPCFO's definitions. Quote them as MSPCFO's figures rather than
  re-deriving them with a different formula.

## Related Skills

- [Client profitability](../client-profitability/SKILL.md)
- [Agreement pricing review](../agreement-pricing-review/SKILL.md)
- [Technician utilization](../technician-utilization/SKILL.md)
