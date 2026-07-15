# Clio Plugin

Claude Code plugin for Clio Manage — legal practice management software.

## Overview

This is the first plugin in a new **legal** vertical for this
marketplace — every other plugin here is MSP/IT tooling. It gives Claude
working knowledge of Clio Manage so legal staff can work with matters,
contacts, time/expense entries, tasks, and read-only communications,
documents, calendar, and billing data without leaving the chat. It talks
to Clio through [Conduit](https://conduit.wyre.ai), so no local SDK,
proxy, or credentials live on your machine.

## What This Plugin Does

- **Matters** — the case/client-file hub: search, create, update, status
  lifecycle, client linkage, practice area
- **Contacts** — people and companies: search, create, update, and how a
  contact relates to the matters they're party to
- **Time & Billing** — log time/expense activities against a matter; read
  (never write) bill status
- **Read-only awareness of tasks, communications, documents, and calendar**
  — these round out a matter summary but have narrower or no write access
  (see Scope Limits below)

## Connecting Clio (OAuth — No API Key)

Clio uses **OAuth 2.0 Authorization Code** flow. You never paste an API
key anywhere:

1. Go to `https://conduit.wyre.ai/connect/clio`
2. Sign in to Clio and approve the requested scopes
3. Optionally set the **Clio Region** field (US / CA / EU / AU — default
   **US**)

Once connected, the plugin's tools are available through Conduit at
`https://conduit.wyre.ai/v1/clio/mcp`. Your MCP client authenticates to
Conduit itself with OAuth (it will prompt you to sign in on first use) —
that's a separate, client-facing OAuth relationship from the
Conduit-to-Clio connection above. There are no environment variables or
headers to configure on the client.

### Clio Region — Known v1 Limitation

The **Clio Region** field changes which of Clio's regional API hosts
Conduit talks to. As of this writing, it does **not** currently guarantee
that the OAuth Authorization Code flow completes correctly for **CA / EU /
AU** accounts — this is unverified for non-US regions. If your firm is on
a non-US Clio instance and the connect flow fails or misbehaves, that is
this known gap, not something wrong on your end. We're stating this
plainly rather than hiding it: treat non-US connections as best-effort
until this is verified.

## Deliberate Scope Conservatism

Clio holds privileged attorney-client data, so this integration is
**conservative by design** — not an oversight. Every limitation below
exists for a specific reason:

| Limitation | Why |
|---|---|
| **No delete tool on any entity, anywhere** | Legal records are frequently subject to retention obligations, malpractice-insurance requirements, or discovery. Deletion, when genuinely needed, happens in Clio directly, by a human, with Clio's own audit trail. |
| **Documents are read-only and metadata-only** | Tools return metadata (name, matter, created date) — never file content. There is no download or upload tool. Document contents are frequently privileged or client-confidential in ways this integration has no way to evaluate. |
| **Communications are read-only** | Logged emails/calls/notes on a matter are often the most sensitive record in the file — list/get only. |
| **Calendar entries are read-only** | Court dates and deadlines are read for context, never written by the integration. |
| **Bills are read-only** | Billing/trust-accounting mutations need rigor (IOLTA compliance, retainer application, avoiding double-billing) that's explicitly out of scope for v1. |
| **Activities support create only — no update/delete** | Time and expense entries can be logged, but corrections happen in Clio directly, preserving Clio's own edit history. |

When you ask for something outside this surface (delete a matter, edit a
communication, generate a bill), the plugin will say so plainly and point
you to Clio directly, rather than attempting a workaround.

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install clio@msp-claude-plugins
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | OAuth connection model, region field, matters-as-hub data model, decision-tree navigation, pagination, and the v1 scope limits with reasoning |
| `matters` | Creating/updating matters, status lifecycle, client linkage, practice area/custom fields |
| `contacts` | People vs. company contacts, and how a contact relates to the matters they're party to (client, opposing party, witness) |
| `time-billing` | Logging time/expense activities against a matter, and reading (not writing) bills |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-matters [query] [status]` | Search or list matters |
| `/matter-summary <matter_id>` | Consolidated view: contacts, open tasks, recent activities, recent communications, bills |
| `/log-time <matter_id> <description> <hours>` | Log a time entry against a matter |
| `/search-contacts <query>` | Search people and companies |

## Available Tools

Provided by the Clio MCP server through Conduit. Tools sit behind
decision-tree navigation: use `clio_navigate` to enter a domain,
`clio_back` to go up, and `clio_status` to see where you are.

| Domain | Tools |
|---|---|
| Navigation | `clio_navigate`, `clio_status`, `clio_back` |
| Matters | `clio_matters_list`, `clio_matters_get`, `clio_matters_create`, `clio_matters_update` |
| Contacts | `clio_contacts_list`, `clio_contacts_get`, `clio_contacts_create`, `clio_contacts_update` |
| Activities | `clio_activities_list`, `clio_activities_get`, `clio_activities_create` |
| Communications (read-only) | `clio_communications_list`, `clio_communications_get` |
| Tasks | `clio_tasks_list`, `clio_tasks_get`, `clio_tasks_create`, `clio_tasks_update` |
| Documents (read-only, metadata only) | `clio_documents_list`, `clio_documents_get` |
| Calendar (read-only) | `clio_calendar_entries_list`, `clio_calendar_entries_get` |
| Bills (read-only) | `clio_bills_list`, `clio_bills_get` |

**No delete tool exists on any entity.**

## Troubleshooting

- **Auth errors on every call** — the fix is almost always in Conduit's
  connect page (`https://conduit.wyre.ai/connect/clio`), not the MCP
  client config. Reconnect there.
- **Non-US region behaving oddly** — see the known v1 limitation above.
- **A tool you expect isn't showing up** — check `clio_status`; you likely
  haven't navigated into the right domain yet with `clio_navigate`.
- **Asked to delete/edit something the tools don't support** — that's by
  design (see Deliberate Scope Conservatism above), not a bug. The action
  needs to happen in Clio directly.

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache-2.0
