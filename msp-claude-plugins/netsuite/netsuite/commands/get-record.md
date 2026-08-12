---
description: Retrieve a NetSuite record by type and internal ID
argument-hint: "<record_type> <id>"
arguments: [record_type, id]
---

# Get NetSuite Record

Look up a single NetSuite record by its record type and internal ID, and
report its fields.

## Arguments

- `record_type` (required) — NetSuite record type, e.g. `customer`,
  `vendor`, `salesorder`, `invoice`
- `id` (required) — Internal ID of the record

## Prerequisites

- NetSuite connected in Conduit, with the connected role granted view
  access to the target record type (see `GOVERNANCE.md`)

## Steps

1. If the record type's fields aren't already known for this session, call
   `ns_getRecordTypeMetadata` for `record_type` to confirm what's available
   (see `skills/records-and-metadata/SKILL.md`)
2. Call `ns_getRecord` with `record_type` and `id`
3. Report the record's fields plainly; do not infer or fill in fields the
   tool didn't return
4. If the record type isn't one the connected role can see, say so — this
   command cannot expand what the connected role is permitted to view

## Examples

### Retrieve a customer record

```
/get-record customer 12345
```

### Retrieve a sales order

```
/get-record salesorder 98765
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Not found | No record of that type exists with that internal ID |
| Permission denied | The connected NetSuite role isn't granted view access to this record type — this is enforced by NetSuite itself, not by this plugin |
| Unknown record type | Call `ns_getRecordTypeMetadata` with no type filter to list valid record types, or confirm spelling |

## Related Commands

- `/query-records` — Look up records by criteria instead of a known ID
