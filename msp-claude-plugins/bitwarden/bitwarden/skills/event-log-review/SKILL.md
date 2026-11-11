---
name: "Bitwarden Event Log Review"
description: >
  Reading a client's Bitwarden organization event log through the
  admin-gated bitwarden_events_list tool: date ranges and the 367-day limit,
  continuationToken paging, the one-filter rule, the event types that matter
  to an MSP (failed logins, 2FA changes, vault exports, item views and
  copies, member and policy changes), resolving IDs back to members, groups
  and collections, and handling the personal data events carry.
when_to_use: >-
  When investigating what happened in a client's Bitwarden organization or
  running a periodic activity review. Use when: bitwarden event log,
  bitwarden audit log, who exported the vault, failed bitwarden logins, who
  changed a bitwarden policy, who disabled 2fa, bitwarden suspicious
  activity, or who viewed this item.
---

# Bitwarden Event Log Review

## Overview

The event log is the organization's audit trail: logins, item access,
member and policy changes. It is the only place the Public API shows what
people *did*, as opposed to what they are allowed to do.

**`bitwarden_events_list` is admin-gated in Conduit.** It needs the admin
tier in the gateway access editor. If the call is denied, say that the event
review could not run; do not substitute guesses from the other tools. The
lookups this skill uses to put names to IDs are read tier:
`bitwarden_members_list`, `bitwarden_members_get`, `bitwarden_groups_get`,
`bitwarden_collections_get` and `bitwarden_policies_list`.

## Anti-triggers

- **One leaver's full access picture** — use
  [offboarding-access-review](../offboarding-access-review/SKILL.md); it
  calls the event log as one step.
- **Current policy settings** — use
  [security-posture](../security-posture/SKILL.md); the log shows changes,
  not the current state.

## Key Concepts

### Request shape

| Parameter | Use |
|---|---|
| `start`, `end` | ISO 8601 range. Default is the last 30 days. Over 367 days is rejected. |
| `actingUserId` | Events performed by one Bitwarden account (the member's `userId`, not their member `id`) |
| `itemId` | Events about one vault item |
| `secretId`, `projectId` | Events about one Secrets Manager secret or project |
| `continuationToken` | The token from the previous page, passed back unchanged |

Only one of `actingUserId`, `itemId`, `secretId`, `projectId` per call.

### What an event carries

Each event has a numeric `type`, a `date`, and, depending on the type,
IDs such as `actingUserId`, `memberId`, `itemId`, `collectionId`, `groupId`
or `policyId`, plus `ipAddress` and a numeric `device` client type. There
are no names: resolve IDs with the read tools (members by `userId` or `id`,
groups and collections by ID). Vault item names are encrypted and cannot be
resolved; report the `itemId`.

### Event types worth watching

| Type | Event | Why it matters |
|---|---|---|
| 1000 | User logged in | Baseline; unusual IPs or times stand out |
| 1002 / 1003 | User updated / disabled two-step login | 1003 on an owner or admin is urgent |
| 1005 / 1006 | Failed login / failed two-step login | Clusters suggest password spraying or a stolen master password |
| 1007 | User exported their vault | Possible data exfiltration |
| 1107 | Item viewed | Who looked at a credential |
| 1108 | Item password viewed | Stronger signal than 1107 |
| 1111 | Item password copied | The value left the vault UI |
| 1500 / 1501 | Member invited / confirmed | Who added whom |
| 1503 | Member removed | Offboarding evidence |
| 1511 / 1512 | Member revoked / restored | A restore after a revoke deserves a reason |
| 1600 | Organization settings edited | Confirm the change was expected |
| 1602 | Organization vault exported | Everything shared may have left |
| 1700 | Policy edited | Resolve `policyId` against `bitwarden_policies_list` |

These codes follow Bitwarden's event list. Check the full catalogue on
Bitwarden's [event logs page](https://bitwarden.com/help/event-logs/) before
you rely on a type that is not in this table.

## Common Workflows

### Periodic activity review (monthly)

1. Call `bitwarden_events_list` with `start` and `end` covering the month.
   Page with `continuationToken` until it is `null`.
2. If a page comes back `truncated`, do not page on (that skips the dropped
   events); re-run that stretch with a shorter window.
3. Group events by type. Report counts for the watch-list types, and list
   every 1003, 1007, 1602 and 1700 event individually with the acting
   member resolved by name.
4. Look for failed-login clusters (1005, 1006): same account many times, or
   many accounts from one IP.

### Answering "who did X?"

- **Who changed a policy?** Range around the change, filter nothing, keep
  type 1700 events, resolve `actingUserId` to a member.
- **Who touched this item?** Use `itemId` with a range covering the period
  of interest; keep 1107, 1108, 1111.
- **What did this person do?** Use `actingUserId` (their `userId`).

### Output

Lead with any urgent events (2FA disabled on an admin, vault exports, policy
changes nobody expected). Then a counts table by type, then the detail. Put
IP addresses and device details in the technical appendix, not the summary.

## Gotchas

- **Paging is manual.** The tool never follows `continuationToken` itself.
  A review that stops at page one under-reports.
- **`actingUserId` is the account ID.** Passing a member `id` returns
  nothing, which looks like "no activity".
- **Long ranges are slow and large.** A year of events for a busy
  organization is many pages and invites rate limiting. Narrow the window
  or filter by user or item.
- **Personal data.** Events carry emails (once resolved), IP addresses and
  device details. Keep them inside the ticket or report that needs them.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - errors, rate limits, truncation
- [offboarding-access-review](../offboarding-access-review/SKILL.md) - per-user access and activity
- [security-posture](../security-posture/SKILL.md) - current policy state
