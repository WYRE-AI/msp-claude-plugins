---
name: "3CX PBX Admin & Diagnostics"
description: >
  3CX's system-and-configuration surface: server time, PBX event log and
  application log search, service status, database schema and the
  read-only SELECT-only Query tool, DIDs, IP and phone blocklists, SIP
  trunks, call flow apps, and the configuration write/delete actions that
  change what calls the PBX accepts or how they route.
when_to_use: >-
  When diagnosing a PBX-level issue, auditing PBX configuration, running a
  read-only query against PBX data, or changing blocklist, blacklist, or
  DID assignment. Use when: 3cx diagnostics, 3cx event log, 3cx services,
  3cx query, 3cx blocklist, 3cx blacklist, 3cx did, 3cx sip trunk, or 3cx
  call flow.
---

# 3CX PBX Admin & Diagnostics

## Overview

This is the plugin's system-level surface: diagnostics, the PBX's own
configuration inventory, a restricted database query tool, call flow app
details, and the smaller set of write/delete actions that change what
calls the PBX will accept or how they route.

## Read-Only Capabilities

Exact tool names are not published by 3CX — see the `api-patterns` skill
and call `tools/list` for the authoritative names on a connected PBX.

**System and diagnostics**

- Get current PBX server time
- Search/list structured PBX event log
- List PBX services and their state
- Search application logs

**PBX inventory and database**

- Describe a database table's schema
- List DIDs
- List IP blocklist entries
- List configured PBX peers
- List phone blacklist entries
- List accessible database tables
- List configured SIP trunks
- Run a read-only SQL `SELECT` query (the `Query` tool)

**Call flow tools**

- Get a call flow app's details
- Get a call flow app's files
- Get an edit URL for a supported PBX object
- List call flow apps

### The Query tool

The `Query` tool is hard-restricted server-side to read-only SQL `SELECT`
statements, regardless of the connecting account's 3CX role — this holds
even for an account that could otherwise change configuration. That
restriction is enforced inside the PBX itself.

That PBX-side guarantee is separate from what Conduit will let you call,
though. On a Conduit catalog connection, 3CX is not yet classified in
`VENDOR_TOOL_CONFIG`, and Conduit fails closed to the `admin` tier for
unclassified tools — so today the `Query` tool is reachable by org owners
and by nobody else, regardless of it being `SELECT`-only. See the
`api-patterns` skill's *Tool Permission Tiers Under Conduit* section, and
check the tool's actual granted tier rather than assuming `SELECT`-only
implies `read`.

## Write/Delete Capabilities — Read This Before Calling Any of Them

- Add an IP address to the IP blocklist
- Add a number to the phone blacklist
- Assign a DID
- Remove an IP blocklist entry
- Remove a phone blacklist entry

These directly change what calls and traffic the PBX accepts. An
incorrect IP blocklist entry can cut off a legitimate SIP trunk or a
remote worker's softphone. An incorrect DID assignment can silently
misroute inbound calls for an entire department, and nobody notices until
a customer calls in complaining the call never arrived. Treat these
exactly like any other production network-ACL or routing change: confirm
the exact value — the IP, the number, the DID — with the requester before
calling, and don't let a scheduled or unattended agent apply them.

## Common Workflows

### PBX health check

1. Get current PBX server time (confirms basic connectivity/liveness).
2. List PBX services and their state.
3. Search the structured event log for the recent window, looking for a
   pattern rather than a single isolated entry.

### Audit inbound call routing

1. List DIDs.
2. List call flow apps and get the details of any that own a DID under
   review.
3. Cross-reference against the queues/departments the DID should reach
   (see the `calls-queues` skill).

### "Why is this number blocked?"

1. List phone blacklist entries and IP blocklist entries.
2. If the number or IP is present and shouldn't be, remove it — confirm
   the exact value with the requester first; this is a write action.

### Ad hoc read-only report

1. List accessible database tables, then describe the relevant table's
   schema before writing a query.
2. Run the query through the `Query` tool. It can only `SELECT` — there is
   no path from this tool to a data change.

## Gotchas

- **`Query` is `SELECT`-only inside the PBX no matter what** — but don't
  assume that guarantees a `read` tier through Conduit. While 3CX is
  unclassified, it requires `admin` like every other 3CX tool (see above).
- **The call-flow "edit URL" tool hands back a link into the PBX's own web
  UI.** Treat it like any other admin-console link — something a human
  reviews and clicks, not something to feed into further automation
  unreviewed.
- **This is Alpha software** (3CX V20 Update 10 Alpha). Configuration tool
  behavior in particular is worth re-verifying against a real PBX rather
  than trusting this description months after it was written.

## Related Skills

- [API Patterns](../api-patterns/SKILL.md) — connection setup, permission inheritance, and Conduit tool tiering
- [Calls, Queues & Profiles](../calls-queues/SKILL.md) — department/queue membership this configuration feeds into
