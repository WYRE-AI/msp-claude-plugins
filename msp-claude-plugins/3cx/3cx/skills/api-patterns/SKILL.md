---
name: "3CX API Patterns"
description: >
  3CX's native PBX MCP server: the per-PBX endpoint shape (every PBX is its
  own FQDN and its own OAuth authorization server — there is no shared
  mcp.3cx.com), how Conduit's catalog connects one anyway, the Admin Console
  + client setup flow, the permission model (fully inherited from the 3CX
  account that approved the connection), and how to discover the live tool
  surface since 3CX has not published exact tool-name strings.
when_to_use: >-
  When connecting Claude to a 3CX PBX for the first time, troubleshooting a
  3CX MCP connection or authorization failure, or figuring out which 3CX MCP
  tools are actually available before calling one. Use when: 3cx connect,
  3cx mcp, 3cx setup, 3cx oauth, 3cx authenticate, 3cx admin console, 3cx
  mcp client, 3cx catalog, 3cx conduit, or 3cx pbx url.
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
- **Conduit's BYO MCP feature** (`/connect/byo`) — that path is for MCP
  servers with *no* catalog entry. 3CX has one (`/connect/3cx`), so BYO is
  no longer the route to take here. See *Connection & Authentication* below.

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

This does **not** put 3CX outside Conduit's vendor catalog. Conduit's
catalog supports per-tenant vendors whose every customer runs their own
instance at their own URL: the vendor entry carries a `resolveContainerUrl`
that derives the proxy target from the stored credential instead of naming
one fixed endpoint. **3CX is a catalog vendor** — slug `3cx`, category
`communications`, shown as *Communications & Telephony*.

3CX pairs that with `oauthConfig.perTenantOAuth`, which additionally makes
each tenant its own OAuth authorization server. That combination is shared
with exactly one other vendor, `hudu-official`. (`netsuite` is per-tenant by
URL too, but authenticates with a non-interactive client-credentials grant
rather than per-tenant OAuth, so it is not the same shape.)

### Admin-side setup (on the PBX)

An admin enables the connection from inside that PBX's own console:

1. Sign into the 3CX Admin Console for the target PBX.
2. **Admin → Integrations → MCP Clients → Add MCP Client**.
3. 3CX displays the MCP Server URL for that PBX — copy it for the client-side
   step below.

### Client-side setup — through Conduit's vendor catalog (recommended)

An MSP already using WYRE's Conduit gateway connects a PBX from the catalog
like any other vendor: go to `/connect/3cx` directly, or find **3CX** under
*Communications & Telephony* in the org catalog at `/org/catalog`.

There is one field — **MCP Server URL**. Paste the URL **exactly as the 3CX
console shows it** in the admin step above (`https://<pbx-fqdn>/mcp`).
Conduit proxies to that URL verbatim; it does not append a path.

Requirements Conduit checks or states up front:

- The PBX must run **3CX V20 Update 10 or later** with the MCP Server
  enabled (Admin → Integrations → MCP Clients).
- The PBX must be **reachable from the internet on port 443** — Conduit
  has to fetch the PBX's own discovery metadata before the redirect.

On submit, Conduit:

1. Discovers the PBX's OAuth endpoints from the PBX's own metadata —
   RFC 9728 protected-resource metadata, then RFC 8414
   authorization-server metadata — and persists what it found, so later
   token refreshes resolve the same endpoints without re-discovering.
2. Registers a client dynamically against that authorization server
   (RFC 7591 DCR) as a public client using PKCE (S256).
3. Runs the authorization-code flow. **You sign in as a 3CX user**, and the
   connection can do only what that user's 3CX role allows.

Connecting through the catalog is what gets you Conduit's access grants,
per-tool allowlists, `conduit__my_access`, and the org audit views. A direct
connection gets none of those — see *Permission Model* and `GOVERNANCE.md`.

### Client-side setup — direct connection (no gateway)

For a technician working standalone in Claude Code, with no MSP gateway in
front of it. This is the right choice only when there is no Conduit org to
connect through — it gets none of the grants, allowlists, `conduit__my_access`
or audit views the catalog path provides:

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

### What about Conduit's BYO MCP feature?

`/connect/byo` is still the right path for an MCP server that has **no**
catalog entry. 3CX has one, so BYO is no longer the recommended route for a
PBX, and it should not be used to work around the classification gap
described in *Tool permission tiers under Conduit* below.

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

## Tool Permission Tiers Under Conduit

Conduit derives each tool's tier from `VENDOR_TOOL_CONFIG`, and **3CX has
no entry there yet** — 3CX documents its ~42 tools by display name only and
has not published the wire names, so nothing has been classified.

Conduit is fail-closed: an unclassified tool falls back to requiring tier
`admin`. The practical effect today:

- **Org owners are unaffected** — owner access bypasses the tier gate, so
  an owner sees and can call every 3CX tool.
- **Non-owner members see none of them** until the tools are classified,
  no matter which tier they have been granted. A `read` grant does not
  reach a 3CX tool while it is unclassified.

This is a **known, tracked gap, not a permanent design** — 3CX sits in
Conduit's unclassified-vendor backlog until a real connection confirms the
wire names, at which point the read tools drop from `admin` to `read`.
Classifying a vendor *reduces* privilege; it does not add any.

Do **not** route around this by connecting the PBX through `/connect/byo`.
That trades the catalog's grants, allowlists and audit views for a
name-guessing heuristic, which is a worse security posture, not a better
one. If a non-owner needs access before classification lands, grant it
deliberately (an `admin` grant or an explicit per-tool `customTools`
allowlist) rather than leaving the catalog.

See `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
not classified*, for the enforcement detail, and this plugin's
`GOVERNANCE.md` for the 3CX-specific picture.

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
