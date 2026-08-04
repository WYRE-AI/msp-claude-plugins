---
name: "Clio Contacts"
description: >
  Clio contacts -- the people and companies connected to matters: person
  vs. company contact types, and how a contact relates to the matters they
  are party to (client, opposing party, witness, and other roles).
when_to_use: >-
  When creating, updating, or searching for a Clio contact, or when
  figuring out how a contact relates to a matter. Use when: clio contact,
  clio person, clio company, clio client contact, clio opposing counsel,
  clio witness, or clio contact search.
---

# Clio Contacts

## Overview

A **contact** in Clio is a person or a company. Contacts exist
independently of any single matter — the same contact can be the client on
one matter, opposing counsel on another, and a witness on a third. Tools:
`clio_contacts_list`, `clio_contacts_get`, `clio_contacts_create`,
`clio_contacts_update`. Navigate into the `contacts` domain first.

**No delete tool exists for contacts** — same rule as everywhere else in
this integration (see [api-patterns](../api-patterns/SKILL.md)). A contact
that's no longer relevant doesn't get removed through this integration.

## Anti-triggers

- **An MSP client, its billing entity, or a service-desk contact** — every
  other plugin here says "contact", "client", and "company" too, and none
  of them mean a party to a legal matter. Use `autotask-crm`,
  `connectwise-psa-contacts`, `halopsa-clients`, `hubspot-contacts`, or
  `quickbooks-online-customers`.
- **Everyone connected to a case** — a contact is a party record, not the
  case file. The relationship (client, opposing party, witness) is carried
  on the matter; use `clio-matters` to resolve the matter first.
- **Removing someone's data on request** — no delete tool exists here, and
  legal retention obligations are exactly why. That request goes to the
  firm, in Clio, with a human deciding.

## People vs. Company Contacts

Clio contacts come in two shapes:

| Type | Examples | Notes |
|---|---|---|
| **Person** | An individual client, an opposing party who is a person, a witness, an individual attorney at another firm | Has first/last name fields |
| **Company** | A corporate client, an opposing party that's a business entity, a vendor | Has a company/organization name; may have associated people (e.g. a primary contact at the company) |

When creating a contact, get the type right up front — person vs. company
determines which fields are meaningful (a company doesn't have a
first/last name; a person isn't "incorporated"). If a user describes an
entity ambiguously ("Acme" could be a company or could be shorthand for a
person at Acme), ask rather than guess, especially before creating a new
contact — search first (see below).

## Contact ↔ Matter Relationships

A contact's relationship to a given matter is contextual, not a fixed
property of the contact itself. The same contact record might be:

- **Client** — the party the firm represents on the matter (every matter
  has exactly one client contact — see the
  [matters skill](../matters/SKILL.md))
- **Opposing party** — the other side in the matter
- **Witness** — someone with relevant testimony or evidence, not a party
- Other matter-specific roles the firm tracks (co-counsel, expert,
  guardian ad litem, etc.), depending on how the firm uses Clio

Don't assume a contact's role from one matter carries over to another —
the same person can be a client on one file and a witness on an unrelated
file. When summarizing "who's involved" in a matter, resolve the
relationship per-matter rather than trusting a contact's role from a
different context.

## Searching Before Creating

Law firms accumulate large contact lists with overlapping names (multiple
"John Smith"s across different matters is normal, not a data quality
problem). Before calling `clio_contacts_create`:

1. Search existing contacts (`clio_contacts_list` with a name/company
   filter) — check email address and company affiliation, not just name,
   to disambiguate.
2. If there's a plausible existing match, confirm with the user rather
   than silently reusing it or silently creating a duplicate — both are
   real failure modes in a system where contacts persist across many
   matters and years.
3. Only create a new contact once you're confident it doesn't already
   exist.

## Creating and Updating Contacts

- **Person**: first name, last name are the minimum meaningful fields;
  email/phone are commonly expected for anyone who'll be communicated
  with directly.
- **Company**: the organization name is the minimum; consider whether the
  firm also wants a primary person contact linked at the company for
  day-to-day communication.
- **Updates** (`clio_contacts_update`) are scoped to a single contact ID —
  send only the fields actually changing.

Contact data is comparatively low-sensitivity relative to matter content
(communications, documents), but it's still client PII — don't populate
fields with guesses, and don't merge/overwrite existing contact data
without the user's explicit intent.

## Related Skills

- [Clio API Patterns](../api-patterns/SKILL.md) — connection, navigation, scope limits
- [Clio Matters](../matters/SKILL.md) — the matter a contact is linked to, and the client relationship
- [Clio Time & Billing](../time-billing/SKILL.md) — activities and bills, which reference the matter, not the contact directly
