---
name: "3CX Calls, Queues & Profiles"
description: >
  3CX's live-operations surface: read-only visibility into active calls,
  recordings, voicemail, department and queue membership, and
  forwarding/presence profiles, plus the write actions that change live
  call routing — dropping a call, switching a profile, and logging a queue
  agent in or out.
when_to_use: >-
  When checking who is on a call right now, queue staffing, recordings or
  voicemail, or when changing a user's or queue's live call-routing state.
  Use when: 3cx active calls, 3cx queue, 3cx voicemail, 3cx recording, 3cx
  profile, 3cx forwarding, drop call 3cx, or log agent 3cx.
---

# 3CX Calls, Queues & Profiles

## Overview

This is the plugin's live-operations surface. Most of it is read-only
visibility into what's happening on the PBX right now; a smaller set of
tools actually change it — ending a call, switching who a person's calls
route to, or moving a queue agent in or out of rotation.

## Anti-triggers

- **A customer-facing service ticket about a call quality or outage issue**
  — that's PSA ticket handling (`halopsa-tickets`, `connectwise-psa-tickets`,
  `autotask-tickets`), not this skill. Use this skill to gather the PBX-side
  facts (was the queue staffed, was the call actually dropped), then work
  the ticket in the PSA.
- **A security incident involving the phone system** (toll fraud, a
  compromised extension) — that's `huntress-incidents` or
  `sentinelone-alerts` territory for the response workflow; this skill only
  reports current call/queue state, it doesn't investigate or remediate.

## Read-Only Capabilities

Exact tool names are not published by 3CX — see the `api-patterns` skill
and call `tools/list` for the authoritative names on a connected PBX.

- List currently active calls
- List recordings available to the authenticated user
- List voicemail items available to the authenticated user
- List a department's members
- List departments accessible to the user
- List forwarding/presence profiles available to the user
- List a queue's agents
- List queues the user can access/manage

## Write Capabilities — Read This Before Calling Any of Them

- Drop (end) an active call
- Select/activate a forwarding-or-presence profile
- Set or clear the active profile's message
- Apply a temporary profile override
- Log a queue agent in/out
- Log the current user in/out of queues

These change what a real person on a real call experiences immediately,
and none of them have a built-in undo. Dropping a call ends it for the
caller too, not just the technician's view of it. Switching someone's
forwarding/presence profile mid-shift redirects their calls right away —
if you get the wrong extension, someone's calls start ringing somewhere
else with no obvious warning to either party. Logging the wrong agent out
of a queue during business hours quietly reduces staffing for everyone
still waiting in it. 3CX's own MCP Tools and Permissions Reference groups
these separately from the read tools for exactly this reason; this
plugin's `GOVERNANCE.md` covers how Conduit's BYO connector tiers them.

**Confirm the target call, extension, or queue ID with the requester
before calling any of these**, and don't let a scheduled or unattended
agent invoke them — a mistake here is visible to the customer immediately
and cannot be quietly corrected after the fact.

## Common Workflows

### Is anyone stuck on hold right now?

List currently active calls alongside a queue's agents — a queue with
active calls but no logged-in agents is the signal, not call count alone.

### Cover for someone who's out

1. List forwarding/presence profiles available to the user to see what
   options exist.
2. Confirm with the requester exactly which profile and which extension.
3. Select/activate the profile — this is a write action; get explicit
   confirmation first.

### Shift-change staffing check

1. List queues the user can access/manage, then list each queue's agents.
2. If staffing needs to change, log the specific agent in or out — again,
   confirm the agent and queue before calling it.

## Gotchas

- **Recordings and voicemail lists are scoped to "available to the
  authenticated user."** That's the 3CX account that approved the OAuth
  connection, not the technician driving Claude — what shows up depends on
  whose connection this is, not who's asking.
- **Profile and queue-login state is per-user or per-queue.** Confirm the
  exact ID before switching anything; there's no confirmation step inside
  the tool itself.

## Related Skills

- [API Patterns](../api-patterns/SKILL.md) — permission inheritance and connection setup
- [Directory & Contacts](../directory/SKILL.md) — resolving who an extension or call belongs to
- [PBX Admin & Diagnostics](../pbx-admin/SKILL.md) — department/queue configuration and system-level diagnostics
