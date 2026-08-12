---
description: Run a NetSuite saved search by name or ID
argument-hint: "<saved_search>"
arguments: [saved_search]
---

# Run NetSuite Saved Search

Run an existing saved search and report its results.

## Arguments

- `saved_search` (required) — Saved search name or ID to run

## Prerequisites

- NetSuite connected in Conduit, with the connected role granted view
  access to the saved search and the record type it's built on

## Steps

1. If `saved_search` looks like an ID, run it directly; otherwise call
   `ns_listSavedSearches` first to find the matching search by name (see
   `skills/reports-and-saved-searches/SKILL.md`)
2. Call `ns_runSavedSearch` for the matched search
3. Report the results as returned by the saved search's own configured
   columns — do not re-shape or re-aggregate them
4. If nothing matches, say so plainly rather than guessing at a similarly
   named search

## Examples

### Run by name

```
/run-saved-search "Open Sales Orders by Customer"
```

### Run by ID

```
/run-saved-search 481
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Not found | No saved search exists with that name or ID — confirm spelling or call `ns_listSavedSearches` with no filter |
| Permission denied | The connected role can't view the saved search or its underlying record type |

## Related Commands

- `/run-report` — Run a standard or custom NetSuite report instead of a saved search
- `/query-records` — Ask an ad-hoc question a saved search doesn't already answer
