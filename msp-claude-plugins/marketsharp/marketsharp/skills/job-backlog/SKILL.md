---
name: "MarketSharp Job Backlog"
description: >
  Using MarketSharp's opportunities list and job records to report sold
  jobs, contract totals, contract status, sale and completion dates and
  balance due: new sales for a period, the open (sold, not complete)
  backlog, and jobs carrying a balance. Includes the opportunities list's
  no-paging limit. Read-only; no tool is admin-gated in Conduit.
when_to_use: >-
  When someone wants sold-job revenue, the install backlog, or outstanding
  balances from MarketSharp. Use when: marketsharp jobs, sold jobs this
  month, contract totals, backlog, jobs not complete, balance due,
  receivables, sales revenue by rep.
---

# MarketSharp Job Backlog

## Overview

When an inquiry sells, MarketSharp creates a **job** with a contract
total, contract status, sale date, completion date and balance due.
Owners and office managers use this for three questions: what did we sell
this period, what is sold but not yet installed, and who still owes us
money. `marketsharp_opportunities_list` answers all three from one call.

All tools here are reads at Conduit's read tier. None is admin-gated.
MarketSharp's own payment and QuickBooks features are not reachable
through this connection, so balance due here is MarketSharp's figure,
not the accounting system's.

## Anti-triggers

- **Close rate and appointment results** - use
  [sales-appointments](../sales-appointments/SKILL.md).
- **Everything about one customer** - use
  [customer-history](../customer-history/SKILL.md).

## Workflow

1. `marketsharp_companies_get` for the time zone.
2. `marketsharp_opportunities_list` with `fromDate` at the start of the
   period and `numberOfRecords` sized to the expected volume (default
   100, maximum 1000). It returns jobs **and** leads changed since that
   date, with job numbers, sale and contract dates, contract totals,
   contract status and balance due.
3. **Check for truncation.** The tool cannot page. If it returns exactly
   `numberOfRecords` rows, raise the number. If it is already 1000, move
   `fromDate` later and run the earlier slice separately, or say plainly
   that the result may be incomplete.
4. Keep only jobs (entries with a job number or sale date); leads in the
   result have no contract figures.
5. Slice the job set:
   - **New sales**: sale date inside the period. Total the contract
     amounts.
   - **Backlog**: sold, no completion date. Sort by sale date, oldest
     first, and give age in days.
   - **Balance due**: balance above zero. Sort by balance, then by
     completion date, since a completed job with a balance is a
     collections question.
6. For detail on a single job, `marketsharp_jobs_get` (name, type, status,
   site address, dates, contract total). For a job found by number or
   customer, `marketsharp_jobs_search` (needs an Employee ID) or
   `marketsharp_search_global` with `type: "Job"`.

## Output

New sales (count, total contract value, by salesperson where the data
carries it), backlog (count, value, oldest five), and balances (count,
total, largest five). State the date range, the time zone, and whether
the opportunities list could have been truncated.

## Gotchas

- `marketsharp_opportunities_list` filters on *changed* date. A job sold
  last year and edited this week is included; use the sale date for "sold
  this period".
- It needs MarketSharp's View Opportunity permission on the connection's
  employee. A 403 means that permission, not a broken connection.
- Contract totals are what was entered in MarketSharp. Change orders and
  payments recorded only in accounting will not show here.
