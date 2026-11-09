# MSPCFO Plugin

Claude Code plugin for [MSPCFO](https://www.mspcfo.com/), the MSP
profitability and business-intelligence platform built on PSA data.

## Overview

MSPCFO reads an MSP's PSA (ConnectWise and Autotask today; Halo is on
MSPCFO's roadmap) and turns tickets, time entries, agreements and costs
into profitability reports. MSPCFO runs its own hosted MCP server at
`https://app.mspcfo.com/mcp`. This plugin reaches it through the WYRE
Conduit gateway and gives Claude the MSP finance context to use it well:

- **Client profitability**: which clients make or lose money, and why
- **Agreement pricing review**: underpriced or over-consumed agreements,
  and annual rate-increase proposals
- **Technician utilization**: billable vs. non-billable hours, cost per
  hour, and billing by member and month
- **API patterns**: OAuth sign-in through Conduit, tool discovery,
  errors, and the admin-only gate described below

MSPCFO's public MCP page lists the reports its MCP draws on: **Client
P&L, Client Segments, Market Segments, Member Work Report, Members
Billing by Month, Utilization Hours and FFA Components**, with more being
added. The skills here are written around those reports and around the
MSP jobs they serve.

## What this plugin does not claim

MSPCFO does not publish its MCP tool names, and Conduit cannot list them
without a signed-in MSPCFO account. **This plugin therefore names no
MSPCFO tool.** The skills tell Claude to discover the tools from the live
tool list after you connect and pick them by their descriptions. When a
tool you expected is missing, Claude says so instead of guessing a name.

MSPCFO also does not say whether any of its MCP tools change data. Every
workflow in this plugin is a read and report workflow. Treat any tool
whose description suggests it changes something as a write, and approve it
yourself before it runs.

MSPCFO describes its MCP as early and asks customers to check important
numbers against the report in the MSPCFO app. The skills repeat that
check before anything goes to a client.

## Conduit status: hidden and admin-only

Read this before you plan a rollout.

1. **The MSPCFO connector ships hidden in Conduit.** It is out of the
   public catalog, and Conduit refuses new connections until WYRE has
   provisioned the OAuth client on every region and verified a live
   connection. Until then, the connect flow below will not be offered.
2. **Every MSPCFO tool is admin-gated in Conduit.** The tools are not yet
   classified by tier, so Conduit fails closed: users with admin access to
   MSPCFO in Conduit see the full upstream tool list, and everyone else
   sees no MSPCFO tools at all. A teammate who connects and sees no tools
   has not hit a sign-in failure. Their Conduit access tier is below
   admin. This changes once WYRE classifies the tools after a verified
   live connection.

## Connecting through Conduit

There is no API key, no client secret and no header to set. Conduit's
MSPCFO connector has no form fields; it is browser sign-in only.

1. In the WYRE Conduit web UI, open **Connections → MSPCFO**.
2. Start the connection. Your browser opens MSPCFO's sign-in page.
3. Sign in with your MSPCFO account and approve access (scope "mcp").
4. Conduit stores the resulting tokens server-side for your organization,
   including a refresh token, so the connection survives access-token
   expiry without signing in again.

Conduit's connect note for this vendor reads:

> MSPCFO shows MSP profitability from your PSA data. It works with
> ConnectWise and Autotask today, and Halo is on MSPCFO's roadmap.
> There's no API key. Sign in with your MSPCFO account when the browser
> opens. Until these tools are reviewed, only admins can see them, so a
> teammate with no tools doesn't mean sign-in failed.

MSPCFO's MCP only sees what the signed-in MSPCFO user can see in the
MSPCFO app. Connect with an account whose MSPCFO permissions match what
you want Claude to read.

`.mcp.json` declares only the gateway URL:

```json
{
  "mcpServers": {
    "mspcfo": {
      "type": "http",
      "url": "https://conduit.wyre.ai/v1/mspcfo/mcp"
    }
  }
}
```

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install mspcfo
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | OAuth sign-in through Conduit, tool discovery, admin-only gate, errors, data freshness |
| `client-profitability` | Client P&L review, flagged and loss-making clients, segment comparison |
| `agreement-pricing-review` | Underpriced and over-consumed agreements, efficiency, annual rate-increase proposals |
| `technician-utilization` | Member work, utilization hours, billing by member and month, cost per hour |

## Available Agents

| Agent | Description |
|-------|-------------|
| `profitability-review-analyst` | Multi-step client or portfolio profitability review: rank the weakest clients and agreements, explain the cause from utilization data, and draft a vCIO action plan or rate-increase proposal |

The agent declares no tool list, so it inherits your session's tools,
including the MSPCFO tools Conduit exposes to you. That is deliberate: the
MSPCFO tool names are not known in advance and cannot be listed in the
agent file.

## Quick Start

```
Which ten clients had the lowest margin over the last six months, and what drove it?
```

```
Rank our three weakest agreements and draft a vCIO plan for each.
```

```
Which technicians were under 60% billable utilization last quarter?
```

```
Prepare an annual rate-increase recommendation for Acme Corp.
```

## Security and data handling

- **This is financial data.** Client P&L, agreement revenue and cost per
  hour are commercially sensitive. Do not paste results into client-facing
  channels without review.
- **The member reports are employee performance data.** Member Work
  Report, Utilization Hours and Members Billing by Month tie hours,
  billing and productivity to named staff. Treat them as HR-adjacent, and
  do not post per-person rankings where the people named have not been
  told this analysis runs.
- **No credential lives on the technician's machine.** Conduit holds the
  MSPCFO tokens. Removing a user from your Conduit organization revokes
  their gateway access immediately.
- See [GOVERNANCE.md](GOVERNANCE.md) for the access model.

## Troubleshooting

### Signed in, but no MSPCFO tools appear

Your Conduit access tier for MSPCFO is below admin. While the tools are
unclassified, only admin-tier users see them. Ask a Conduit admin to check
your access in the Conduit access editor.

### Connect option missing or refused

The connector is still hidden in Conduit (see *Conduit status* above).
Nothing on your side will fix it; contact WYRE.

### Authentication errors after a working connection

Conduit refreshes the MSPCFO token automatically. If the refresh fails,
for example because the MSPCFO user was disabled or its password changed,
reconnect in **Connections → MSPCFO** and sign in again.

### Numbers do not match the MSPCFO app

Check the date range and filters first. MSPCFO's figures depend on PSA
sync, cost setup, agreement setup and time-entry hygiene, which MSPCFO
validates during onboarding. If a figure still differs, trust the MSPCFO
report and tell MSPCFO support.

## Changelog

### 1.0.0

- Initial release: 4 skills (api-patterns, client-profitability,
  agreement-pricing-review, technician-utilization) and 1 agent
  (profitability-review-analyst)
- Conduit connection through MSPCFO OAuth sign-in; no headers, no API key
