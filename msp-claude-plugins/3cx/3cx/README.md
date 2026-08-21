# 3CX Plugin

Claude Code plugin for 3CX's native PBX MCP server — directory and contact
lookups, live call/queue/profile visibility (plus the write actions that
change it), and PBX administration and diagnostics.

## Overview

3CX added an MCP server built directly into the PBX, introduced in
**3CX V20 Update 10** (announced July 30, 2026 as an **Alpha** release — 3CX
describes Update 10 Alpha as "intended for testing and evaluation only").
Treat this plugin as based on that Alpha: exact tool names and behavior may
shift before 3CX ships Update 10 GA. See the `api-patterns` skill and
`GOVERNANCE.md` for the full detail.

This plugin provides Claude with deep knowledge of that MCP server, enabling:

- **Directory & Contacts** — resolve a caller by email, exact extension, phonebook, or CRM-synced contact
- **Calls, Queues & Profiles** — see who's on a call, queue staffing, recordings, and voicemail; drop calls, switch profiles, and manage queue login state
- **PBX Admin & Diagnostics** — server health, event/application logs, a read-only database query tool, DIDs, SIP trunks, call flow apps, and blocklist/blacklist/DID management

This is **not** the same project as the community *SSIG-IT/3cx-mcp-server*
on GitHub — that's a separate, third-party server talking to 3CX's REST
API. Don't carry claims (including licensing requirements) between the two.

## How This Is Different From Other Plugins Here

Every 3CX PBX is its own endpoint with its own OAuth authorization server —
there's no shared `mcp.3cx.com` the way there's a shared
`mcp.pax8.com`. That means this plugin doesn't fit WYRE Conduit's usual
single-shared-endpoint vendor catalog, and there's no `.mcp.json` shipped
with it. Two real connection paths exist instead:

1. **Direct**, standalone — connect Claude straight to a specific PBX.
2. **Through Conduit's BYO MCP feature** (`/connect/byo`) — for MSPs who
   want this PBX alongside their other Conduit-brokered vendors.

Both are covered below and in the `api-patterns` skill.

## Prerequisites

- A 3CX PBX running **V20 Update 10** (Alpha or later) with the MCP server
  feature available
- An account on that PBX with the 3CX role appropriate for what you want
  Claude to be able to do — tool access is entirely inherited from
  whichever account approves the connection

### Admin-side setup (once, per PBX)

1. Sign into that PBX's 3CX Admin Console.
2. **Admin → Integrations → MCP Clients → Add MCP Client**.
3. Copy the MCP Server URL 3CX displays (pattern:
   `https://yourpbx.3cx.eu/mcp` — the actual FQDN is specific to that PBX).

## Installation

### Direct Connection (Claude Code, no gateway)

```bash
claude mcp add --scope project --transport http 3CX "https://yourpbx.3cx.eu/mcp"
claude
```

Then inside Claude:

1. Run `/mcp` and select the `3CX` server.
2. Choose **Authenticate** — Claude opens 3CX's own authorization page in
   the browser.
3. Sign in, review the requested access, and select **Allow**.

The connection then also appears in that PBX's own
**Admin → Integrations → MCP Clients** list.

### Via WYRE Conduit's BYO MCP Feature

If your organization already uses [Conduit](https://conduit.wyre.ai) for
other vendors, paste the PBX's MCP URL from the admin step above into
Conduit's BYO MCP registration form at `/connect/byo`. Conduit
auto-discovers the PBX's OAuth flow and completes the authorization —
no vendor-specific setup is needed on Conduit's side. See `GOVERNANCE.md`
for exactly how Conduit tiers this PBX's tools once connected this way.

## Available Skills

| Skill | Description |
|-------|-------------|
| `directory` | Contact and extension lookups — email, exact extension, phonebook, CRM-synced |
| `calls-queues` | Active calls, recordings, voicemail, queue/department/profile visibility, and the write actions that change live routing |
| `pbx-admin` | System diagnostics, PBX inventory/database, the read-only `Query` tool, call flow apps, and blocklist/blacklist/DID writes |
| `api-patterns` | Connection setup (direct and Conduit BYO), the inherited permission model, and how to discover the live tool surface |

## Available Commands

| Command | Description |
|---------|-------------|
| `/find-contact` | Resolve a contact or extension by email, extension, or name |
| `/pbx-health-check` | Quick PBX liveness sweep — server time, service status, recent event log |
| `/queue-status` | Staffing and active-call snapshot for one queue or all accessible queues |

## Quick Start

### Find a Contact

```
/find-contact jane@acmecorp.com
```

### Check PBX Health

```
/pbx-health-check
```

### Check Queue Staffing

```
/queue-status "Support"
```

## Security Considerations

- Tool access is entirely inherited from the 3CX account that approved the
  connection — there is no separate Claude-specific permission layer.
- The `Query` database tool is hard-restricted server-side to read-only
  `SELECT`, regardless of the connecting account's role.
- The write actions in `calls-queues` and `pbx-admin` have an immediate,
  visible effect on real calls, real callers, and real routing, with no
  built-in undo — see the **Write Capabilities** section of each skill and
  `GOVERNANCE.md`'s *Recommended agent policy* before granting them to any
  automated or unattended workflow.
- 3CX has not published exact MCP tool-name strings publicly. This plugin
  describes tools by capability rather than inventing identifiers; always
  confirm the live tool set with `tools/list` against the actual PBX.

See `GOVERNANCE.md` for the full trust model, including how Conduit's BYO
connector tiers this vendor's tools when there's no hand-curated
classification to draw from.

## Troubleshooting

### Authentication errors

1. Re-run `/mcp` → **Authenticate** for the `3CX` server.
2. Confirm the connection still shows under that PBX's
   **Admin → Integrations → MCP Clients**.
3. If it was removed there, re-run the `claude mcp add` step and
   reauthenticate.

### Tool names don't match what a skill describes

3CX has not published a fixed tool-name list, and this is Alpha software —
call `tools/list` against the connected PBX for the authoritative current
names rather than assuming this plugin's descriptions are literal
identifiers.

### No tools available after connecting

Confirm the PBX is running V20 Update 10 (or later) with the MCP server
feature enabled, and that the connecting 3CX account has a role that
grants at least read access to the areas you're trying to use.

## API Documentation

- 3CX's own "MCP Tools and Permissions Reference" (via the Admin Console's
  MCP Clients documentation) is the authoritative source for tool
  capabilities and permission groupings.
- [3CX V20 Update 10 release notes](https://www.3cx.com) — check for GA
  status and any tool-surface changes since this plugin was written.

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Changelog

### 0.1.0 (2026-08-21)

- Initial release
- 4 skills: api-patterns, directory, calls-queues, pbx-admin
- 3 commands: find-contact, pbx-health-check, queue-status
- Documents both the direct standalone connection and Conduit's BYO MCP
  path, since 3CX has no fixed shared endpoint for a normal Conduit
  vendor-catalog entry
