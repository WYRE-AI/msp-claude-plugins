---
name: "3CX API Patterns"
description: >
  3CX's native PBX MCP server: the per-PBX endpoint shape (every PBX is its
  own FQDN and its own OAuth authorization server — there is no shared
  mcp.3cx.com), the Admin Console + client setup flow, the permission model
  (fully inherited from the 3CX account that approved the connection), and
  how to discover the live tool surface since 3CX has not published exact
  tool-name strings.
when_to_use: >-
  When connecting Claude to a 3CX PBX for the first time, troubleshooting a
  3CX MCP connection or authorization failure, or figuring out which 3CX MCP
  tools are actually available before calling one. Use when: 3cx connect,
  3cx mcp, 3cx setup, 3cx oauth, 3cx authenticate, 3cx admin console, 3cx
  mcp client, 3cx byo, or 3cx pbx url.
---

# 3CX API Patterns

## Overview

3CX added a native MCP server built directly into the PBX, introduced in
**3CX V20 Update 10** (announced July 30, 2026 as an **Alpha** release — 3CX's
own release notes describe Update 10 Alpha as "intended for testing and
evaluation only"). Treat everything in this plugin as based on that Alpha:
exact tool names, the permissions reference, and behavior may all shift
before 3CX ships Update 10 GA.

This is a different project from the older third-party *SSIG-IT/3cx-mcp-server*
on GitHub, a community-built MCP server that talks to 3CX's REST API rather
than shipping inside the PBX. Do not mix the two up, and do not carry
claims from the community project into this one — in particular, its
"Enterprise/Enterprise Plus license required" claim is specific to that
project and is **not** confirmed for 3CX's native MCP server.

## Anti-triggers

- **The community *3cx-mcp-server* project** — different codebase, different
  tool surface, different auth model (its own API-key setup rather than
  per-PBX OAuth). Nothing in this plugin describes it, and nothing about it
  should be assumed here.
- **A customer's "the phones are down" ticket** — that's ticket handling in
  the PSA, not a 3CX MCP call. Use `halopsa-tickets`, `connectwise-psa-tickets`,
  or `autotask-tickets` to work the ticket itself; come back to this plugin
  once you need the PBX-side facts.
- **WYRE's Conduit vendor catalog** — 3CX has no catalog entry there and,
  structurally, cannot: Conduit's catalog vendors share one fixed endpoint
  per vendor, and every 3CX PBX is its own origin with its own authorization
  server. See *Connection & Authentication* below for the two ways this
  plugin actually reaches a PBX.

## Connection & Authentication

### Every PBX is its own endpoint

Unlike a hosted SaaS MCP server, there is no single 3CX MCP URL. Each PBX
exposes its own endpoint at its own FQDN, following the pattern:

```
https://yourpbx.3cx.eu/mcp
```

(or whatever FQDN that customer's PBX actually uses). Transport is
Streamable HTTP. A skill, command, or agent in this plugin that needs to
call a tool always does so against whichever PBX endpoint the current
session is already connected to — nothing here can assume a fixed URL
across customers.

### Admin-side setup (on the PBX)

An admin enables the connection from inside that PBX's own console:

1. Sign into the 3CX Admin Console for the target PBX.
2. **Admin → Integrations → MCP Clients → Add MCP Client**.
3. 3CX displays the MCP Server URL for that PBX — copy it for the client-side
   step below.

### Client-side setup — direct connection (no gateway)

For a technician working standalone in Claude Code, with no MSP gateway in
front of it:

```bash
claude mcp add --scope project --transport http 3CX "https://yourpbx.3cx.eu/mcp"
claude
```

Then inside Claude:

1. Run `/mcp` and select the `3CX` server.
2. Choose **Authenticate**. Claude opens the 3CX authorization page in the
   browser.
3. Sign in, review the requested access, and select **Allow**.
4. Claude confirms the connection succeeded.

The new connection also then shows up in that PBX's own
**Admin → Integrations → MCP Clients** list — the authorization is visible
and revocable from both sides.

### Client-side setup — through Conduit's BYO MCP feature

An MSP already using WYRE's Conduit gateway for other vendors does not need
a separate direct connection per PBX. Conduit has a generic
**"Bring Your Own (BYO) MCP server"** feature (`/connect/byo`) built for
exactly this shape — a vendor with no fixed shared endpoint. Paste the
PBX's MCP URL from the admin step above into that form; Conduit then:

1. Discovers the PBX's own OAuth authorization server at runtime —
   RFC 9728 protected-resource metadata, then RFC 8414 authorization-server
   metadata.
2. Registers a client dynamically against that authorization server
   (RFC 7591 DCR).
3. Runs the normal authorization-code + PKCE flow, validating the callback's
   `iss` against the discovered issuer (RFC 9207) before persisting tokens.

No 3CX-specific code exists in Conduit for this — the same generic BYO path
handles any MCP server shaped this way. See *Tool permission tiers under
Conduit BYO* below for how Conduit decides what an operator may call once
connected, and this plugin's `GOVERNANCE.md` for the full picture.

## Permission Model

Tool access is entirely inherited from the 3CX user account that approved
the OAuth connection. Claude can do exactly what that account's 3CX role
already permits inside 3CX — nothing more. There is no separate
Claude-specific permission layer on the PBX side.

One tool is restricted regardless of role: the `Query` tool (see the
`pbx-admin` skill) is hard-restricted server-side to read-only SQL
`SELECT` statements, no matter what the connecting account is otherwise
allowed to do in 3CX.

## Discovering the Live Tool Surface

3CX's own "MCP Tools and Permissions Reference" documents these tools by
human-readable label — find a contact by email, list active calls, drop a
call, and so on — but does not publish the literal machine tool-name
strings anywhere publicly accessible. The skills in this plugin describe
the tool surface by capability for that reason, deliberately without
inventing exact snake_case identifiers that cannot be verified against a
real PBX.

**Before calling a tool, confirm its real name and schema** by calling the
standard MCP `tools/list` method against the connected PBX. This is also the
only reliable way to know what changed between the Update 10 Alpha and any
later release — the tool surface described here is a snapshot, not a
guarantee.

## Tool Permission Tiers Under Conduit BYO

If a PBX is reached through Conduit's BYO path rather than a direct
connection, Conduit still has to decide a permission tier for each tool it
has never seen before — there is no hand-curated `VENDOR_TOOL_CONFIG` entry
for 3CX to draw from. It does this with a name-and-description heuristic
that is deliberately conservative:

- A leading verb from a fixed read-shaped set (`get`, `list`, `search`,
  `find`, `query`, and similar) tiers the tool `read`.
- Any other leading verb — including one the heuristic has simply never
  seen before — tiers the tool `write`. Unrecognized verbs are never
  silently treated as read.
- A secret/credential noun anywhere in the name or description escalates
  to `admin`, and a mutating verb on a privileged-account noun (roles,
  members, billing, API keys, org settings) does too.

This matters concretely for one 3CX tool: the read-only `Query` tool is
enforced `SELECT`-only *inside the PBX*, but Conduit's heuristic tiers
purely on the tool's name. If that tool's real name is built around a
generic "run" or "execute" action rather than a `get`/`list`/`query`-style
read verb, Conduit will tier it `write` despite the PBX-side restriction.
Don't assume `read` for it; check the tool's actual granted tier after
connecting.

## Gotchas

- **This is Alpha software.** Exact tool names, the permissions reference,
  and behavior can all change before 3CX ships Update 10 GA. Re-verify
  against `tools/list` rather than trusting a cached mental model, especially
  months after this was written.
- **No shared URL.** Every other skill and command in this plugin assumes an
  already-connected PBX; there is nothing to hardcode across customers.
- **Don't borrow tool names from the community *3cx-mcp-server* project** —
  it is a different codebase talking to a different API surface.

## Related Skills

- [Directory & Contacts](../directory/SKILL.md) — contact and extension lookups
- [Calls, Queues & Profiles](../calls-queues/SKILL.md) — live call/queue state and the write actions that change it
- [PBX Admin & Diagnostics](../pbx-admin/SKILL.md) — system diagnostics, PBX inventory, and configuration writes
