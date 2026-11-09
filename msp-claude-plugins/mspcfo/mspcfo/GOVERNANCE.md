# MSPCFO plugin — governance and safety model

Unofficial. Community-built plugin for MSPCFO's hosted MCP server. Not
affiliated with, endorsed by, or sponsored by MSPCFO.

## What it connects as

This plugin holds no credentials. It reaches MSPCFO's hosted MCP
(`https://app.mspcfo.com/mcp`) through the WYRE Conduit gateway
(`https://conduit.wyre.ai/v1/mspcfo/mcp`).

- Auth is OAuth 2.0 with PKCE against MSPCFO's own authorization server.
  An MSP user signs in with their MSPCFO account in the browser. There is
  no API key and no client secret.
- Conduit stores the access and refresh tokens server-side per
  organization. Nothing is stored on the technician's machine, in this
  repo, or in the model's context.
- MSPCFO's MCP only sees what that MSPCFO user can see in the MSPCFO app.
  The MSPCFO account you sign in with is the ceiling on what Claude reads.
- Every call carries the operator's Conduit identity, so the Conduit
  audit log records who pulled which report. MSPCFO's side sees only the
  signed-in MSPCFO account.
- Removing someone from the Conduit organization clears their per-vendor
  grants and revokes their gateway refresh tokens at once.

Confirm the live permission grant in the Conduit access editor before you
rely on a tier in this document. This note does not describe gateway
enforcement internals.

## Tool permission groups

MSPCFO's tool names are not public, and an unauthenticated tool listing
is refused, so Conduit has not classified them.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **All MSPCFO tools** | Unknown until classified. MSPCFO's public material describes report reads only. | `admin` (fail-closed) | Every tool the MSPCFO server lists. Names are not published and are not cited here. |

**What that costs you.** A user or agent below admin tier on MSPCFO sees
no MSPCFO tools at all. Granting admin admits every MSPCFO tool, including
any write tool MSPCFO may expose, because there is no narrower tier until
WYRE classifies the tools after a verified live connection.

## Recommended agent policy

- Use the reports for analysis and drafting: profitability rankings,
  agreement reviews, rate-increase drafts, utilization summaries.
- If a tool's description says it creates, updates, deletes, sends or
  schedules anything, a human approves the exact call before it runs.
  Conduit does not enforce that approval; it is a workflow you impose on
  your agents.
- Nothing a client sees (QBR deck, rate-increase letter, vCIO plan) goes
  out without a person checking the figures against the MSPCFO app.

## What it cannot reach

- Only the MSPCFO tenant of the signed-in MSPCFO user.
- Not the PSA directly. MSPCFO reports on synced PSA data; it cannot
  change agreements, tickets or invoices in ConnectWise or Autotask. Use
  the PSA plugin for that, with its own approvals.
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- Client P&L, agreement revenue, cost and margin are commercially
  sensitive. They are the MSP's own books.
- Member Work Report, Utilization Hours and Members Billing by Month
  attach hours, billing and productivity to named employees. Treat them
  as HR-adjacent: in several jurisdictions automated processing of
  employee performance data carries consultation or notification
  obligations.

## Known sharp edges

- **Early tool, check the numbers.** MSPCFO calls its MCP early and asks
  customers to verify important figures against the report in the app.
- **Garbage in.** Margins depend on PSA time-entry hygiene, labor cost
  setup and agreement mapping. A client that looks unprofitable can be a
  data problem, such as unbilled time on the wrong agreement.
- **Small periods mislead.** One month of a quarterly-billed agreement,
  or one large project, swings margin hard. Compare like periods and
  show the period used.
