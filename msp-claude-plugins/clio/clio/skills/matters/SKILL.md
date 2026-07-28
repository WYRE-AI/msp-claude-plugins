---
name: "Clio Matters"
description: >
  Clio matters -- the case/client-file object that almost everything else
  in Clio hangs off of: the matter status lifecycle, linking a matter to a
  client contact, practice areas, custom fields, and matter numbering.
when_to_use: >-
  When creating, updating, searching, or summarizing a Clio matter, or when
  deciding what a matter's status means. Use when: clio matter, clio case,
  clio matter status, clio matter number, clio practice area, clio
  responsible attorney, or clio client matter.
---

# Clio Matters

## Overview

A **matter** is Clio's core object — the case or client file. It is the
hub that almost everything else in Clio (activities, tasks, communications,
documents, calendar entries, bills) references via `matter_id`. See the
[api-patterns skill](../api-patterns/SKILL.md) for the full matters-as-hub
picture and the deliberate v1 scope limits that apply across every domain.

Tools: `clio_matters_list`, `clio_matters_get`, `clio_matters_create`,
`clio_matters_update`. Navigate into the `matters` domain first
(`clio_navigate`) — these tools aren't visible until you do.

**No delete tool exists for matters.** A matter that shouldn't exist
anymore gets closed (status change), not removed — see below.

## Key Fields

A matter typically carries:

- **Client** — the contact (person or company) the matter is for. Every
  matter has exactly one client contact; see the
  [contacts skill](../contacts/SKILL.md) for how a contact can be party to
  many matters in different roles.
- **Responsible attorney** — the attorney of record on the matter
- **Status** — see lifecycle below
- **Practice area** — the area of law the matter falls under (e.g.
  Litigation, Real Estate, Family Law) — usually a firm-configured picklist
- **Matter number / display number** — Clio's human-readable matter
  identifier (distinct from the internal numeric ID)
- **Description** — free-text summary of what the matter is
- **Custom fields** — firm-specific fields configured in Clio; treat these
  as opaque key/value pairs unless the firm has told you what they mean

## Matter Status Lifecycle

Matters move through a small set of statuses. Typical values:

| Status | Meaning |
|---|---|
| Open | Active matter, currently being worked |
| Pending | Not yet fully active — e.g. awaiting engagement signature, conflict check, or intake completion |
| Closed | Matter has concluded — no more billable work expected |

Treat status as the primary signal for "is this matter live." When a user
asks for "my open matters" or "what's still active," filter on status
rather than trying to infer activity from recency of activities/tasks
alone — a matter can be quiet-but-open (waiting on a court date) or
closed-but-recently-touched (final billing cleanup).

**Closing a matter is a status update** (`clio_matters_update` with
`status: "Closed"`), not a delete. There is no way to remove a matter
through this integration — that's consistent with the no-delete-anywhere
rule and with legal records retention practice.

## Creating a Matter

Minimum viable create: a client contact and (usually) a responsible
attorney. Before calling `clio_matters_create`:

1. **Resolve the client contact first.** Search contacts
   (`clio_contacts_list` with a name/company filter) before creating a new
   one — duplicate client contacts are a real mess in a matter-centric
   system. See the [contacts skill](../contacts/SKILL.md).
2. **Confirm practice area and responsible attorney** if the firm uses
   them for routing/reporting — don't leave them blank silently if the
   user's context implies a specific practice group.
3. **Ask before guessing at custom fields.** Firm-specific custom fields
   often drive downstream automation (billing templates, conflict
   workflows) — don't populate them with assumptions.

## Updating a Matter

`clio_matters_update` — same shape as create, but scoped to an existing
`matter_id`. Common updates: status changes (open → pending → closed),
reassigning the responsible attorney, correcting the practice area, or
editing the description. There's no partial-vs-full-update ambiguity to
worry about here beyond the standard rule: only send the fields that are
actually changing plus the ID.

## Practice Area & Custom Field Considerations

- Practice areas are usually a closed, firm-configured list — if a value
  the user wants doesn't exist, say so rather than inventing a close match.
- Custom fields vary firm-to-firm and are not part of the fixed schema —
  when summarizing a matter for a user, surface custom fields you can read
  but don't assume you know what they mean without firm context.

## Linking a Matter to a Client Contact

The client relationship is set at creation (or via update) using the
contact's ID from `clio_contacts_list`/`clio_contacts_get`. A matter has
one client contact, but that contact may be party to many other matters —
always resolve by searching contacts rather than assuming a name is
unique; law firms frequently have multiple contacts with similar or
identical names across different matters.

## Related Skills

- [Clio API Patterns](../api-patterns/SKILL.md) — connection, navigation, matters-as-hub model, scope limits
- [Clio Contacts](../contacts/SKILL.md) — the client (and other-role) contacts linked to a matter
- [Clio Time & Billing](../time-billing/SKILL.md) — activities and bills scoped to a matter
