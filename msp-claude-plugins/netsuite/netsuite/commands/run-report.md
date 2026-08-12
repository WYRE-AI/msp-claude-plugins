---
description: List available NetSuite reports, or run one by name or ID
argument-hint: "[report]"
arguments: [report]
---

# Run NetSuite Report

List a NetSuite account's available reports, or run a specific one.

## Arguments

- `report` (optional) — Report name or ID to run; omit to list all
  available reports

## Prerequisites

- NetSuite connected in Conduit, with the connected role granted view
  access to the target report

## Steps

1. If `report` is omitted, call `ns_listAllReports` and list what's
   available
2. If `report` is given, confirm which filters it needs — subsidiary,
   accounting book/context, or nexus — using `ns_getSubsidiaries`,
   `ns_getAccountingBooks`, `ns_getAccountingContexts`, or `ns_getNexusIds`
   as needed (see `skills/reports-and-saved-searches/SKILL.md`)
3. Call `ns_runReport` for the matched report with the appropriate filters
4. Report the results as returned; note the reporting period or as-of date
   the report used rather than implying the numbers are live right now

## Examples

### List available reports

```
/run-report
```

### Run a specific report

```
/run-report "Balance Sheet"
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Not found | No report exists with that name or ID — run `/run-report` with no argument to list available reports |
| Permission denied | The connected role can't view this report |
| Missing required filter | Some reports require a subsidiary, accounting book, or nexus — use the filter-lookup tools to find a valid value |

## Related Commands

- `/run-saved-search` — Run a saved search instead of a standard report
- `/query-records` — Ask a question no existing report or search already answers
