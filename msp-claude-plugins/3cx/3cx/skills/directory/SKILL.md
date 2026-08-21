---
name: "3CX Directory & Contacts"
description: >
  3CX's read-only directory surface: resolving a caller by email or by exact
  extension, searching the PBX's own phonebooks, searching contacts synced
  from an integrated CRM, and listing PBX users/extensions.
when_to_use: >-
  When looking up who a phone number, extension, or email address belongs to
  inside 3CX, or when listing the PBX's users and extensions. Use when: 3cx
  contact, 3cx extension, 3cx phonebook, 3cx directory, find caller 3cx, who
  is this extension, or 3cx user list.
---

# 3CX Directory & Contacts

## Overview

3CX exposes read-only lookups across three sources: the PBX's own
phonebooks (company and personal entries), the PBX's user/extension list,
and — where the PBX has a CRM connector configured — contacts synced in
from that CRM. All of it is read-only; nothing in this skill creates or
edits a contact or extension.

## Anti-triggers

- **The CRM record itself** — this skill only reads what 3CX has synced in
  or is querying live from a connected CRM. To create or edit the actual
  CRM contact, use `hubspot-contacts` or `salesbuildr-companies-contacts`.
- **The client's documentation record** — extension lists and phone trees
  that belong in runbooks live in `hudu-companies`, not here.

## Capabilities

Exact tool names are not published by 3CX — see the `api-patterns` skill
for why, and call `tools/list` for the authoritative names on a connected
PBX. The read-only capabilities this skill covers:

- Find a contact by email
- Find a contact by exact extension
- Search CRM-integrated contacts
- Search 3CX phonebooks
- List PBX users/extensions

## Common Workflows

### Resolve a caller

1. If you have an email address or an exact extension number, use the
   matching exact-match lookup first — it's the most reliable signal.
2. If that comes back empty, fall back to a phonebook search or a
   CRM-integrated contact search for a partial or fuzzy match.
3. If you only have a name, search the phonebook and the CRM-integrated
   contacts in parallel — one may have an entry the other doesn't.

### Cross-reference with the PSA or CRM

A miss on CRM-integrated contact search means "not synced to this PBX,"
not "doesn't exist in the CRM." The sync is whatever CRM connector is
configured on that specific PBX — confirm the connector is active before
concluding a contact genuinely doesn't exist anywhere.

## Gotchas

- **Extension lookup is exact-match, not fuzzy.** A partial or
  slightly-wrong extension number won't resolve — fall back to the user
  list or a phonebook search instead of retrying the same lookup.
- **CRM-integrated results reflect the PBX's own sync, not a live CRM
  query.** Staleness depends entirely on how that PBX's CRM connector is
  configured — this skill has no visibility into that connector's refresh
  interval.

## Related Skills

- [API Patterns](../api-patterns/SKILL.md) — connection setup and tool discovery
- [Calls, Queues & Profiles](../calls-queues/SKILL.md) — what a resolved contact is doing right now (on a call, in a queue)
