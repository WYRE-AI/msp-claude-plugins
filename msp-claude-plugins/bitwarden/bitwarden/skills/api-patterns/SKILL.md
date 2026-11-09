---
name: "Bitwarden API Patterns"
description: >
  Bitwarden MCP fundamentals: the organization API key passed through Conduit
  as X-Bitwarden-Client-Id / X-Bitwarden-Client-Secret / X-Bitwarden-Region,
  the 12 read-only tools and which one is admin-gated, full-list responses
  versus the paged event log, response truncation, the member role and status
  enums, error and rate-limit handling, and what the Public API can never
  return. Every other Bitwarden skill assumes these patterns.
when_to_use: >-
  When connecting to or calling Bitwarden through the MCP tools, or diagnosing
  a failed Bitwarden request. Use when: bitwarden api, bitwarden connection,
  bitwarden organization api key, bitwarden region, bitwarden 401, bitwarden
  429, bitwarden pagination, continuationToken, or a truncated bitwarden
  response.
---

# Bitwarden MCP Tools & API Patterns

## Overview

The Bitwarden plugin gives an MSP the admin view of one client's Bitwarden
organization through the
[Bitwarden Public API](https://bitwarden.com/help/public-api/): who is a
member, their role and 2FA state, which groups and collections exist, which
security policies are on, what happened in the event log, and how many seats
are licensed.

Every tool is a `GET`. Nothing in this plugin can invite, confirm, revoke,
restore, or remove a member, change a group, collection or policy, or change
seats. Nothing can read vault items or passwords: the Public API does not
expose them. Any remediation you recommend is done by a person in the
Bitwarden Admin Console.

## Connection & Authentication

Conduit connects as a Bitwarden **organization API key**. The connect form
has three fields, each passed to the MCP server as a header:

| Conduit field | Header | Env var (.mcp.json) | Notes |
|---|---|---|---|
| Organization client_id | `X-Bitwarden-Client-Id` | `BITWARDEN_CLIENT_ID` | Starts with `organization.`. A personal `user.` key is refused. |
| Organization client_secret | `X-Bitwarden-Client-Secret` | `BITWARDEN_CLIENT_SECRET` | Secret. Redacted from all tool output. |
| Region | `X-Bitwarden-Region` | `BITWARDEN_REGION` | `us` (bitwarden.com, the default) or `eu` (bitwarden.eu). |

Facts that shape every conversation about access:

- **Teams or Enterprise only.** The Public API does not exist on Free,
  Families or Starter plans. A 403 usually means the plan lacks it.
- **Owner-only key.** Only an organization owner can view or rotate the key
  (Admin Console > Settings > Organization info > View API key).
- **There is no read-only key.** The key's only scope, `api.organization`,
  is full organization admin. This plugin wraps only read routes, but the
  stored key could change the organization if it leaked. Rotate it from the
  same Admin Console page if it is ever exposed.
- **One connection, one organization.** The key belongs to one Bitwarden
  organization. Each client organization has its own key; a provider
  (reseller) relationship does not give one key access to several clients.
- **Self-hosted Bitwarden is not supported.** Only US and EU cloud work.

The MCP server exchanges the key for a short-lived bearer token, caches it,
and on a 401 refreshes once and retries. You never handle the token.

## The 12 tools

| Tool | What it returns | Conduit tier |
|---|---|---|
| `bitwarden_members_list` | Every member: role, status, 2FA, email, externalId, collection access | read |
| `bitwarden_members_get` | One member by `memberId` (GUID) | read |
| `bitwarden_members_list_group_ids` | Group IDs one member belongs to | read |
| `bitwarden_groups_list` | Every group and its collection access | read |
| `bitwarden_groups_get` | One group by `groupId` | read |
| `bitwarden_groups_list_member_ids` | Member IDs in one group | read |
| `bitwarden_collections_list` | Every collection and its group access (metadata only) | read |
| `bitwarden_collections_get` | One collection by `collectionId` | read |
| `bitwarden_policies_list` | Every configured security policy, enabled flag and settings | read |
| `bitwarden_policies_get` | One policy by `policyType` integer (404 if never configured) | read |
| `bitwarden_events_list` | The organization audit event log, paged | **admin-gated** |
| `bitwarden_subscription_get` | Password Manager and Secrets Manager seats, autoscale limits, storage | read |

**`bitwarden_events_list` is admin-gated in Conduit.** It needs the admin
tier in the gateway access editor; a user granted only read gets a denial for
it while the other 11 tools work. Event data carries emails, IP addresses
and device details, which is why it sits behind the higher grant. When the
event log is denied, say so and continue with what the read tools show;
do not present an event-free review as complete. Confirm the live grant in
the access editor.

## Identifiers and enums

All IDs (`memberId`, `groupId`, `collectionId`, event filters) are GUIDs.
Anything else is refused before a request is made. A member's `id` (the
organization membership) is not the same as their `userId` (the Bitwarden
account); event filters such as `actingUserId` take the **userId**.

Member `type` (role):

| Value | Role |
|---|---|
| 0 | Owner |
| 1 | Admin |
| 2 | User |
| 4 | Custom |

Member `status`:

| Value | Status | Meaning for an audit |
|---|---|---|
| -1 | Revoked | Still listed, but has no access to organization data |
| 0 | Invited | Invite not yet accepted; no Bitwarden account linked yet |
| 1 | Accepted | Accepted but not yet confirmed by an admin; cannot decrypt shared items |
| 2 | Confirmed | Full member |
| 3 | Staged | Created ahead of an invite; not active yet |

Policy types are integers 0 to 23; the `policyType` parameter of
`bitwarden_policies_get` lists them all. See
[security-posture](../security-posture/SKILL.md) for the ones that matter in
a review.

## Pagination

- **Members, groups, collections and policies come back whole.** The
  response is `{object: "list", data: [...], continuationToken: null}`. The
  API does not page these lists, so one call is the full set.
- **The event log is paged.** `bitwarden_events_list` returns a
  `continuationToken`. Pass it back unchanged to get the next page, and stop
  when it is `null`. The tool never pages on its own.
- **Event ranges.** With no `start`/`end` the log covers the last 30 days.
  Bitwarden rejects ranges over 367 days. Dates are ISO 8601
  (`2026-10-01` or `2026-10-01T00:00:00Z`).
- **One event filter at a time.** Pass at most one of `actingUserId`,
  `itemId`, `secretId`, `projectId`. Bitwarden would silently ignore the
  others, so the tool refuses the combination.

## Truncated responses

Tool output is capped (about 60,000 characters). A list that does not fit is
cut structurally and marked:

```json
{
  "object": "list",
  "continuationToken": null,
  "truncated": true,
  "returned_items": 180,
  "total_items_in_page": 412,
  "truncation_hint": "...",
  "data": [ ... ]
}
```

Always check for `truncated: true` before counting anything.

- On a **full list** (members, groups, collections) there is no next page,
  so the missing items cannot be fetched by paging. Report the count as
  partial ("first 180 of 412 members"), then work per record:
  `bitwarden_groups_list` and `bitwarden_groups_list_member_ids` give member
  IDs, and `bitwarden_members_get` returns one member. Members in no group
  cannot be reached that way; say so.
- On an **event page**, following `continuationToken` skips the items that
  were dropped. Re-run with a shorter `start`/`end` window instead.

## Error Handling

Errors come back as tool errors (`isError: true`) carrying the HTTP status,
a hint, Bitwarden's `message` and field `errors`, and a `request_id` when
Bitwarden sent one.

| Status | Meaning | Action |
|---|---|---|
| 400 | Invalid request (often a bad date range or parameter) | Read the field errors; check the event range is under 367 days |
| 401 | Key rejected even after a token refresh | The key was probably rotated. An owner re-submits the Conduit connect form with the new client_secret |
| 403 | Key lacks access | The organization is not on Teams or Enterprise, or the region is wrong |
| 404 | Not found | Wrong GUID, or for `bitwarden_policies_get`, a policy that was never configured (treat as "off") |
| 429 | Rate limited | Wait for the `Retry after Ns` value in the error, then retry once |
| Argument error | A non-GUID ID, bad date, or two exclusive filters | Fix the argument; no request was sent |

A Conduit denial (the tool is outside your grant) is not a Bitwarden error.
For `bitwarden_events_list` it means the admin tier is not granted.

## Rate limits

Bitwarden does not publish fixed Public API limits. Keep calls sequential,
prefer one list call over many `_get` calls, and back off on 429 using the
`Retry-After` value the error reports. Large event sweeps are the usual
cause; narrow the date range rather than paging through a year of events.

## Related Skills

- [security-posture](../security-posture/SKILL.md) - policies, 2FA coverage and admin sprawl
- [offboarding-access-review](../offboarding-access-review/SKILL.md) - what a departing user could reach
- [license-reconciliation](../license-reconciliation/SKILL.md) - seats versus real members
- [event-log-review](../event-log-review/SKILL.md) - reading the admin-gated event log
