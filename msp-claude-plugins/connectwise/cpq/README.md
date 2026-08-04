# ConnectWise CPQ Plugin

Claude Code plugin for ConnectWise CPQ — formerly ConnectWise Sell, originally Quosal —
the quoting and proposal tool in the ConnectWise stack.

## Overview

Gives Claude working knowledge of the CPQ REST API and its 25-tool `cpq_*` MCP surface:

- **Quotes** — search, versions, create-by-copy, patch, delete
- **Line items** — the priced rows, the tabs that hold them, pricing and margin fields
- **Quote customers** — the per-quote contact records synced from the CRM/PSA
- **Payment terms** — financing and payment options on a quote
- **Lookups** — templates, tax codes, recurring-revenue periods, CPQ users

CPQ is not ConnectWise PSA: different host, different auth (no `clientId`), much smaller
surface. Pair this plugin with `connectwise-psa` when a workflow needs opportunities,
products or agreements.

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install connectwise-cpq
```

## Configuration

Served through the WYRE MCP gateway. CPQ needs **three** credentials, plus CPQ 2022.2 or
newer and a user flagged as an **API user**:

| Gateway credential | Gateway header | Where to find it |
|---|---|---|
| Access Key | `X-CPQ-Access-Key` | The Sell URL while logged in: `.../QuosalWeb/home?accesskey=<this>` |
| Public Key | `X-CPQ-Public-Key` | Settings > Organization Settings > API Keys |
| Private Key | `X-CPQ-Private-Key` | Shown once, at key creation |

The MCP server combines them into the upstream Basic token
(`base64(accessKey+publicKey:privateKey)`) — you never construct that header yourself.
Running the server directly instead of through the gateway, the same values come from
`CPQ_ACCESS_KEY`, `CPQ_PUBLIC_KEY` and `CPQ_PRIVATE_KEY` (see `.env.example`).

Verify the connection with `cpq_test_connection`.

## Available Skills

| Skill | Description |
|-------|-------------|
| [api-patterns](skills/api-patterns/) | Three-part Basic auth, `conditions` syntax, paging over bare arrays, `includeFields`, JSON Patch updates, errors, and the endpoints CPQ does not expose |
| [quotes](skills/quotes/) | Quote lifecycle: search, GUID vs quote number, versions, create-by-copy, status flags, customers, terms |
| [quote-items](skills/quote-items/) | Line items and tabs: the tab requirement, pricing and margin fields, bundles, optional lines |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-quotes` | Search quotes by account, status, or date range |
| `/get-quote` | Full quote detail — tabs, line items, customers, terms |
| `/create-quote` | Create a quote by copying a template or an existing quote |
| `/list-templates` | List the templates available to copy |

## Things CPQ's API Cannot Do

Worth knowing before planning a workflow — all confirmed absent from the official spec:

- **No create-from-scratch.** Every new quote is a copy of a template or an existing quote
  (`POST /api/quotes/copyById/{id}`), then patched.
- **No product catalog or price sourcing.** Etilize and distributor feeds are web-app only.
- **No opportunities.** Quotes link out via `crmOpportunityId`; the opportunity lives in
  the attached PSA/CRM.
- **No publish / deliver / e-sign / order-porting verbs.** Order Porter state is readable
  and partly patchable, but delivery happens in the CPQ web app.
- **No attachments, PDF generation, or webhooks.** Poll `modifyDate` instead of subscribing.
- **No global customer directory.** Customers exist only in the context of a quote.
- **No tab writes.** Tabs are read-only over REST.

## API Documentation

- [ConnectWise CPQ developer portal](https://developer.connectwise.com/Products/ConnectWise_CPQ) (login-gated)
- Base URL: `https://sellapi.quosalsell.com` — one global host, tenancy carried by the access key
