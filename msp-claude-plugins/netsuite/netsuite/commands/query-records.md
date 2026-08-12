---
description: Run a read-only SuiteQL query against NetSuite
argument-hint: "<suiteql_query>"
arguments: [suiteql_query]
---

# Query NetSuite Records (SuiteQL)

Run a read-only SuiteQL query and report the results.

## Arguments

- `suiteql_query` (required) — A SuiteQL `SELECT` statement

## Prerequisites

- NetSuite connected in Conduit, with the connected role granted view
  access to the record types referenced in the query

## Steps

1. If the query references fields whose availability or joinability isn't
   already known, call `ns_getSuiteQLMetadata` for the relevant record type
   first (see `skills/suiteql-queries/SKILL.md`)
2. Call `ns_runCustomSuiteQL` with `suiteql_query`
3. Report the returned rows. If the query is unbounded and the result set
   is large, say so and suggest narrowing with a `WHERE` clause rather than
   dumping everything
4. This command only ever issues read queries — `ns_runCustomSuiteQL`
   itself is documented by NetSuite as accepting read-only queries only;
   do not attempt `INSERT`/`UPDATE`/`DELETE` statements, they will not
   succeed

## Examples

### List active customers

```
/query-records "SELECT id, entityid, companyname FROM customer WHERE isinactive = 'F'"
```

### Recent sales orders for a customer

```
/query-records "SELECT id, tranid, trandate, total FROM transaction WHERE type = 'SalesOrd' AND entity = 12345 ORDER BY trandate DESC"
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Syntax error | Check the SuiteQL statement's syntax; SuiteQL is a subset of SQL, not full ANSI SQL |
| Permission denied on a table/field | The connected NetSuite role isn't granted view access to that record type or field |
| Query rejected as non-read | `ns_runCustomSuiteQL` accepts read-only queries only — remove any write statement |

## Related Commands

- `/get-record` — Retrieve a single known record directly, without writing SuiteQL
