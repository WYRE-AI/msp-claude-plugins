---
name: "NetSuite Records & Metadata"
description: >
  Retrieving individual NetSuite records by type and internal ID, and
  discovering a record type's available fields via record-type metadata.
  Read-only — retrieving existing records, not creating or updating them.
when_to_use: >-
  When looking up a specific NetSuite record (customer, vendor, sales
  order, invoice, or any other record type) by its internal ID, or when
  you need to know what fields a NetSuite record type has before querying
  or reading it. Use when: netsuite record, netsuite customer, netsuite
  vendor, netsuite invoice, netsuite sales order, record type, internal
  id, or netsuite field.
---

# NetSuite Records & Metadata

## Overview

NetSuite organizes almost everything as a typed record — `customer`,
`vendor`, `salesorder`, `invoice`, `employee`, and many more, each with its
own internal ID and field set. This skill covers looking a specific record
up directly when you already know (or can pin down) its type and ID, and
discovering what fields a record type actually has before you go looking
for one.

## Anti-triggers

- **Finding records by criteria you don't have an ID for** — use
  `suiteql-queries` to search, then retrieve the specific record here if
  needed.
- **Creating or updating a record** — this plugin is read-only. See
  [GOVERNANCE.md](../../GOVERNANCE.md), *Tool permission tiers*:
  `ns_createRecord` and `ns_updateRecord` are the two write tools this
  plugin deliberately excludes. Make the change directly in the NetSuite
  UI, with the same care you'd give any change to a client's financial
  system of record.
- **Reports or saved searches already built for this data** — use
  `reports-and-saved-searches` rather than re-deriving what a report
  already computes.
- **Auth, role permissions, or error handling** — use `api-patterns`.

## Core Concepts

Every NetSuite record has a record type (a fixed string like `customer`
or `salesorder`) and an internal ID (a number, unique within that type).
Record-type metadata describes the fields a given type carries — names,
data types, and (per NetSuite's `ns_getRecordTypeMetadata` tool) can be
requested for a single type or for all types at once. What a record
actually returns when retrieved depends entirely on the connected role's
view permissions on that type and its fields — the same way it would if a
human opened the record in the NetSuite UI.

## API Patterns

The confirmed read tool family for this domain:

- `ns_getRecord` — retrieves a record in NetSuite by type and internal ID
- `ns_getRecordTypeMetadata` — retrieves metadata (available fields and
  data types) for all NetSuite record types, or for a specific type

Both are documented by Oracle at
[Available Tools in the MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0902023508.html).
The corresponding write tools, `ns_createRecord` and `ns_updateRecord`,
are excluded from this plugin — see
[GOVERNANCE.md](../../GOVERNANCE.md).

**A note on record-type-specific commands:** this plugin does not ship a
separate command per record type (e.g. no dedicated "get customer" vs.
"get vendor" command). `ns_getRecord` is generic across record types by
design, and this plugin's `/get-record` command is built directly against
that generic tool rather than inventing per-type wrappers that don't
correspond to anything the underlying MCP surface exposes.

## Common Workflows

### Looking up a customer before an escalation

A support ticket references a customer by name, not ID:

1. If the internal ID isn't known, use `suiteql-queries` to find it (e.g.
   `SELECT id, companyname FROM customer WHERE companyname LIKE '...'`)
2. Call `ns_getRecord` with type `customer` and the resolved ID
3. Report the fields relevant to the escalation — don't dump the entire
   record if only a few fields matter

### Confirming a record type's fields before writing a SuiteQL query

Before querying an unfamiliar record type:

1. Call `ns_getRecordTypeMetadata` for that type
2. Use the returned field names and types to write an accurate SuiteQL
   query in `suiteql-queries`, rather than guessing at field names

## Gotchas

- **Retrieval respects the connected role's field-level permissions, not
  just record-level.** A role with view access to a record type can still
  have specific fields withheld — a retrieved record missing an expected
  field may be a permission boundary, not a data gap.
- **Internal IDs are per-type, not global.** Customer 12345 and sales
  order 12345 are unrelated records; always pair an ID with its record
  type.
- **This is a read-only lookup, with no exceptions.** Even a trivial
  correction (fixing an obviously wrong field) is outside this plugin —
  escalate to a human with direct NetSuite access.

## Related Skills

- [Reports & Saved Searches](../reports-and-saved-searches/SKILL.md) — Pre-built aggregations and lookups
- [SuiteQL Queries](../suiteql-queries/SKILL.md) — Finding records by criteria
- [API Patterns](../api-patterns/SKILL.md) — Auth, roles, and error handling
