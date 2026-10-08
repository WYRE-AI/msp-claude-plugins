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

## How This Plugin Reaches a PBX

Every 3CX PBX is its own endpoint with its own OAuth authorization server —
there's no shared `mcp.3cx.com` the way there's a shared `mcp.pax8.com`.
WYRE Conduit's vendor catalog supports exactly that shape, so **3CX is a
catalog vendor** (slug `3cx`, category *Communications & Telephony*): the
catalog entry resolves the proxy target from the MCP URL you connect with,
and treats each PBX as its own authorization server rather than assuming
one fixed endpoint for every customer.

Two connection paths:

1. **Through Conduit's vendor catalog** (recommended) — `/connect/3cx`, or
   **3CX** under *Communications & Telephony* in the org catalog at
   `/org/catalog`.
2. **Direct**, standalone — connect Claude straight to a specific PBX with
   no gateway in between.

Conduit's **BYO MCP** path (`/connect/byo`) is for MCP servers that have
*no* catalog entry. 3CX has one, so BYO is not the route to use here.

This plugin ships no `.mcp.json`: a catalog connection is made once in the
Conduit web UI rather than declared per-project.

Both supported paths are covered below and in the `api-patterns` skill.

## Prerequisites

- A 3CX PBX running **V20 Update 10 or later** with the MCP Server enabled
  (Admin → Integrations → MCP Clients)
- For a catalog connection, the PBX **reachable from the internet on port
  443** — Conduit fetches the PBX's own OAuth discovery metadata before the
  browser redirect
- An account on that PBX with the 3CX role appropriate for what you want
  Claude to be able to do — tool access is entirely inherited from
  whichever account approves the connection

### Admin-side setup (once, per PBX)

1. Sign into that PBX's 3CX Admin Console.
2. **Admin → Integrations → MCP Clients → Add MCP Client**.
3. Copy the MCP Server URL 3CX displays (pattern:
   `https://yourpbx.3cx.eu/mcp` — the actual FQDN is specific to that PBX).

## Installation

### Via WYRE Conduit's Vendor Catalog (recommended)

If your organization uses [Conduit](https://conduit.wyre.ai), connect the
PBX from the catalog like any other vendor: go to `/connect/3cx`, or find
**3CX** under *Communications & Telephony* at `/org/catalog`.

There is one field, **MCP Server URL**. Paste the URL exactly as the 3CX
console showed it in the admin step above — Conduit proxies to it verbatim
and does not append a path.

Conduit then discovers that PBX's OAuth endpoints from its own metadata
(RFC 9728, then RFC 8414), registers a client dynamically (RFC 7591), and
sends you to the PBX to sign in. **You sign in as a 3CX user**, and the
connection can do only what that user's 3CX role allows.

> **Read this before connecting for a non-owner.** 3CX is not yet
> classified in Conduit's tool table, and Conduit fails closed: every 3CX
> tool currently requires the `admin` tier. Org **owners** are unaffected
> and see all tools; **non-owner members see none**, whatever grant they
> hold, until WYRE classifies the tool surface. This is a known, tracked
> gap — see `GOVERNANCE.md`. Don't work around it by switching to BYO.

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

A direct connection is the right choice for a standalone technician with
no gateway. Note that it gets none of Conduit's access grants, per-tool
allowlists, `conduit__my_access`, or org audit views — see `GOVERNANCE.md`.

## Available Skills

| Skill | Description |
|-------|-------------|
| `directory` | Contact and extension lookups — email, exact extension, phonebook, CRM-synced |
| `calls-queues` | Active calls, recordings, voicemail, queue/department/profile visibility, and the write actions that change live routing |
| `pbx-admin` | System diagnostics, PBX inventory/database, the read-only `Query` tool, call flow apps, and blocklist/blacklist/DID writes |
| `api-patterns` | Connection setup (Conduit catalog and direct), the inherited permission model, Conduit's tier gate, and how to discover the live tool surface |

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
- On a Conduit catalog connection, 3CX is not yet classified in
  `VENDOR_TOOL_CONFIG`, and Conduit fails closed to the `admin` tier for
  unclassified tools. Org owners are unaffected; non-owner members reach no
  3CX tool until classification lands. Tracked and temporary.

See `GOVERNANCE.md` for the full trust model, including what Conduit's tier
gate does and does not enforce on each connection path.

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

If you connected through Conduit and you are **not** an org owner, this is
almost certainly the classification gap, not a broken connection: every 3CX
tool requires the `admin` tier until WYRE classifies the tool surface. Check
`conduit__my_access`, and see `GOVERNANCE.md`, *Tool permission tiers*.

Otherwise, confirm the PBX is running V20 Update 10 (or later) with the MCP
Server enabled, and that the connecting 3CX account has a role that grants
at least read access to the areas you're trying to use.

### Conduit can't discover the PBX's OAuth settings

The connect form rejects the URL before redirecting if discovery fails.
Confirm the MCP Server is enabled on the PBX (Admin → Integrations → MCP
Clients — needs V20 Update 10+), that the URL is exactly what the console
shows, and that the PBX is reachable from the internet on port 443.

## API Documentation

- 3CX's own "MCP Tools and Permissions Reference" (via the Admin Console's
  MCP Clients documentation) is the authoritative source for tool
  capabilities and permission groupings.
- [3CX V20 Update 10 release notes](https://www.3cx.com) — check for GA
  status and any tool-surface changes since this plugin was written.

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Changelog

### 0.2.0 (2026-09-14)

- **Corrected**: 3CX **is** a WYRE Conduit catalog vendor (slug `3cx`,
  category *Communications & Telephony*), added 2026-09-09. The previous
  release asserted it had no catalog entry and structurally could not have
  one — wrong on both counts; Conduit's catalog supports per-tenant vendors
  whose customers each run their own instance at their own URL.
- **Corrected**: the recommended connection path is now Conduit's catalog
  (`/connect/3cx` or `/org/catalog`), not the BYO MCP form
  (`/connect/byo`). BYO remains correct only for MCP servers with no
  catalog entry.
- **Corrected**: replaced the BYO name-heuristic tier tables in
  `api-patterns` and `GOVERNANCE.md` with the real catalog behavior — 3CX
  has no `VENDOR_TOOL_CONFIG` entry yet, so Conduit fails closed to the
  `admin` tier: owners see every tool, non-owner members see none until
  classification lands. Documented as a tracked, temporary gap.
- Documented the catalog connect requirements (V20 Update 10+, PBX
  reachable on 443, paste the MCP URL exactly as the console shows it) and
  the RFC 9728 → RFC 8414 discovery plus RFC 7591 dynamic client
  registration Conduit performs at connect time.

### 0.1.0 (2026-08-21)

- Initial release
- 4 skills: api-patterns, directory, calls-queues, pbx-admin
- 3 commands: find-contact, pbx-health-check, queue-status
- Documents both the direct standalone connection and Conduit's BYO MCP
  path, since 3CX has no fixed shared endpoint for a normal Conduit
  vendor-catalog entry
