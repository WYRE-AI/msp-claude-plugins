---
name: "NetSuite Reports & Saved Searches"
description: >
  Running NetSuite's standard and custom reports and saved searches, plus
  the filter-lookup helpers (accounting books, accounting contexts,
  nexuses, subsidiaries) many of them need. Read-only — running existing
  reports and searches, not building or editing them.
when_to_use: >-
  When running a NetSuite financial report, a saved search, or looking up
  the subsidiary/nexus/accounting-book values a report needs to be scoped
  correctly. Use when: netsuite report, netsuite saved search, balance
  sheet, income statement, subsidiary, nexus, accounting book, accounting
  context, or financial report.
---

# NetSuite Reports & Saved Searches

## Overview

NetSuite reports (standard financial reports like a Balance Sheet, plus
any custom reports the client has built) and saved searches (reusable,
criteria-based lookups defined in the NetSuite UI) are both pre-built
views over the account's data. This skill covers running them and
retrieving their results — not authoring or editing either.

## Anti-triggers

- **Ad-hoc questions no existing report or search answers** — use
  `suiteql-queries` instead of trying to force a report to answer
  something it wasn't built for.
- **Retrieving a single known record directly** — use
  `records-and-metadata`.
- **Building or editing a report or saved search** — this plugin is
  read-only; there is no tool in this plugin's surface for authoring
  either. Build or change it in the NetSuite UI directly.
- **Auth, role permissions, or error handling** — use `api-patterns`.

## Core Concepts

A **report** is one of NetSuite's standard financial/operational reports
(Balance Sheet, Income Statement, and similar) or a custom report the
client has built; many require filter context — which subsidiary, which
accounting book, which nexus — to run correctly in a multi-entity or
multi-book NetSuite account. A **saved search** is a reusable,
criteria-based lookup defined once in the NetSuite UI and re-run on
demand, returning whatever columns it was configured with.

## API Patterns

The confirmed read tool family for this domain:

- `ns_listAllReports` — lists all standard and custom reports in the account
- `ns_runReport` — runs a report and returns its results
- `ns_getSubsidiaries` — lists subsidiaries, for scoping a report
- `ns_getAccountingBooks` — lists accounting books, for scoping a report
- `ns_getAccountingContexts` — lists accounting contexts, for scoping a report
- `ns_getNexusIds` — lists nexuses, for scoping a report
- `ns_listSavedSearches` — lists all saved searches in the account
- `ns_runSavedSearch` — runs an existing saved search

All eight are documented by Oracle at
[Available Tools in the MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0902023508.html).
This plugin exposes only these read tools — there is no report- or
saved-search-authoring tool in this plugin's surface.

## Common Workflows

### Running a standard financial report for a QBR

1. `ns_listAllReports` to confirm the report's exact name if not already
   known
2. If the account has multiple subsidiaries or accounting books, call
   `ns_getSubsidiaries` / `ns_getAccountingBooks` / `ns_getAccountingContexts`
   to find the correct filter value
3. `ns_runReport` with the resolved filters
4. Report the numbers with the reporting period the report actually used

### Running a saved search a client already relies on

1. `ns_listSavedSearches` to find the search by name if the ID isn't known
2. `ns_runSavedSearch` for the matched search
3. Report results using the search's own configured columns — don't
   re-aggregate or re-shape what the saved search already defines

## Gotchas

- **Many reports require filter context to run correctly.** A multi-
  subsidiary or multi-book NetSuite account can return misleading or
  incomplete results if a report is run without the right subsidiary,
  accounting book, or nexus — use the filter-lookup tools rather than
  guessing.
- **A report or saved search reflects only what the connected role can
  see.** The same role-based visibility that governs direct record access
  governs report and saved-search results too.
- **Report results reflect a point in time, not necessarily "right now."**
  Note the reporting period or as-of date a report used rather than
  presenting the numbers as live.

## Related Skills

- [Records & Metadata](../records-and-metadata/SKILL.md) — Single-record lookups
- [SuiteQL Queries](../suiteql-queries/SKILL.md) — Ad-hoc questions no report or search covers
- [API Patterns](../api-patterns/SKILL.md) — Auth, roles, and error handling
