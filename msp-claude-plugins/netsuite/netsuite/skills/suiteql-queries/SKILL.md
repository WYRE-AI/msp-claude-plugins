---
name: "NetSuite SuiteQL Queries"
description: >
  Running read-only SuiteQL queries against NetSuite data and discovering
  queryable fields and joins via SuiteQL metadata. The flexible ad-hoc
  query surface for questions no existing report or saved search already
  answers.
when_to_use: >-
  When you need to query NetSuite data with custom criteria that no
  existing report or saved search covers, or when you need to know what
  fields and joins a record type supports for SuiteQL. Use when: suiteql,
  netsuite query, netsuite sql, ad hoc query, netsuite join, or netsuite
  field metadata.
---

# NetSuite SuiteQL Queries

## Overview

SuiteQL is NetSuite's SQL-like query language over its record data —
`SELECT` statements with `WHERE`, `JOIN`, `ORDER BY`, and similar clauses,
scoped to whatever the connected role can see. It's the right tool when a
question needs custom filtering or joins that no existing report or saved
search already provides.

## Anti-triggers

- **A question an existing report or saved search already answers** — use
  `reports-and-saved-searches` instead of re-deriving something NetSuite
  has already computed.
- **Retrieving one specific, already-known record** — use
  `records-and-metadata`; `ns_getRecord` is simpler than a SuiteQL query
  for a single record by ID.
- **Creating, updating, or deleting data** — SuiteQL here is read-only.
  `ns_runCustomSuiteQL` is documented by Oracle as accepting **read-only
  queries only** — write statements are not a workaround this skill
  supports, or one NetSuite will honor.
- **Auth, role permissions, or error handling** — use `api-patterns`.

## Core Concepts

SuiteQL queries NetSuite's underlying record tables (which broadly mirror
record types like `customer`, `transaction`, `item`) using SQL syntax.
It's a subset of SQL, not full ANSI SQL — some familiar constructs may not
be supported. Query results respect the connected role's view permissions
the same way direct record retrieval and reports do.

## API Patterns

The confirmed read tool family for this domain:

- `ns_runCustomSuiteQL` — runs a custom SuiteQL query (Oracle's
  documentation states explicitly: read-only queries only)
- `ns_getSuiteQLMetadata` — retrieves metadata for records queryable via
  SuiteQL, including available fields, data types, and joinable fields;
  can be scoped to a specific record type

Both are documented by Oracle at
[Available Tools in the MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0902023508.html).

## Common Workflows

### Finding a record's internal ID before a direct lookup

1. `ns_runCustomSuiteQL` with a targeted `SELECT id, ... FROM <type> WHERE ...`
2. Take the resolved ID to `records-and-metadata`'s `ns_getRecord` if a
   full record retrieval is needed next

### Building a query against an unfamiliar record type

1. `ns_getSuiteQLMetadata` for the record type in question, to confirm
   real field names and available joins
2. Write the SuiteQL query against the confirmed fields, rather than
   guessing at column names from the NetSuite UI's field labels (which
   don't always match the underlying SuiteQL field name)

### Answering a cross-record question a report doesn't cover

1. Confirm no existing report or saved search already answers it (check
   `reports-and-saved-searches` first — don't re-derive what NetSuite
   already computes)
2. Write a targeted, bounded SuiteQL query — filter by date range or
   specific criteria rather than pulling an entire table
3. Report results plainly, noting if the result set was truncated or if
   the query should be narrowed further

## Gotchas

- **SuiteQL is a subset of SQL.** Not every construct from full ANSI SQL
  is guaranteed to work — if a query fails unexpectedly, simplify it
  before assuming the data doesn't exist.
- **Bound queries.** An unbounded `SELECT *` against a large table (e.g.
  `transaction`) is a way to exhaust rate limits and return far more data
  than the question needs — prefer explicit columns and a `WHERE` clause.
- **Field names in SuiteQL don't always match NetSuite UI labels.** Use
  `ns_getSuiteQLMetadata` rather than guessing from what a field is called
  on screen.
- **Read-only is enforced by NetSuite here, not just by this plugin's
  documentation.** `ns_runCustomSuiteQL` itself is documented as
  read-only-queries-only — but this plugin does not independently verify
  that constraint; it is Oracle's own stated behavior. See
  [GOVERNANCE.md](../../GOVERNANCE.md).

## Related Skills

- [Records & Metadata](../records-and-metadata/SKILL.md) — Direct record retrieval by ID
- [Reports & Saved Searches](../reports-and-saved-searches/SKILL.md) — Pre-built views to check before writing a custom query
- [API Patterns](../api-patterns/SKILL.md) — Auth, roles, and error handling
