---
name: "Cove API Patterns"
description: >
  How the Cove Data Protection MCP tools talk to N-able's JSON-RPC API through
  Conduit: the three X-Cove-* headers and the API user behind them, the
  15-minute visa session, finding partner (customer) IDs, statistics column
  codes and units, paging and truncation, Cove error numbers, and which tool
  is admin-gated in Conduit.
when_to_use: >-
  When a Cove tool call fails, returns an error number, or returns less than
  expected, or before building a cove_device_statistics_list query. Use when:
  cove api, cove authentication, cove error 2100, cove error 13501, cove
  partner id, cove column codes, cove paging, cove truncated, or n-able backup
  api.
---

# Cove API Patterns

## Overview

Cove Data Protection (N-able, formerly SolarWinds Backup) exposes a JSON-RPC
API at the fixed endpoint `https://api.backup.management/jsonapi`. The
`cove-mcp` server behind Conduit wraps 29 read methods as tools. None of them
writes. Tool arguments are snake_case; the server maps them to Cove's
case-sensitive names (`partner_id` becomes `partnerId`, `records_count`
becomes `query.RecordsCount`).

## Authentication

The three fields are entered once in the Conduit web UI (`/connect/cove`).
Conduit stores them and sends three headers on every call; nothing is set on
the client, and Conduit drops any `X-Cove-*` header a client sends:

| Header | Conduit field | What it is |
|--------|---------------|------------|
| `X-Cove-Partner` | Partner (customer name) | The exact name of the customer the API user was created under, as the console shows it, often with an email in parentheses |
| `X-Cove-Username` | API user login name | The login name including the suffix Cove adds |
| `X-Cove-Api-Token` | API token | The token shown once when the API user was created |

The server sends these in a JSON-RPC `Login` call and gets a **visa**, a
session token valid for 15 minutes. Every response returns a fresh visa. The
server caches it per credential set, logs in again before 15 minutes pass,
and retries once if Cove rejects the visa (error 1701). You never handle the
visa yourself.

The API user only sees its own customer and the customers below it.

## Permissions

| Tool | Conduit tier | Cove role |
|------|--------------|-----------|
| `cove_audit_actions_list` | **admin-gated**: Conduit refuses it for members below the admin tier | Needs "View user actions logs", which only Administrator and SuperUser have. Other roles get error 13501. |
| The other 28 tools | read | Supporter is enough |

If the user is not a Conduit admin, do not plan a workflow that depends on
`cove_audit_actions_list`. Say that the audit log needs a Conduit admin and an
Administrator API user.

## Finding IDs

Almost every tool takes a `partner_id` (a customer ID), and Cove has no
"current customer" default.

1. `cove_auth_context_get` returns the `PartnerId` the API user is bound to.
   Call it first. It is also the connection test.
2. `cove_partners_list` with `parent_partner_id` set to that ID and
   `fetch_recursively: true` lists every customer below it. Ask for
   `fields: [0, 1, 5, 18]` (name, level, state, external code) to keep the
   response small.
3. `cove_partner_get_by_name` takes an exact name only. When the user gives a
   partial name, list the tree and match it yourself.

Device IDs (`device_id`) are Cove account IDs. They come from
`cove_devices_list` or from the statistics rows.

## Statistics Columns

`cove_device_statistics_list` returns the columns you ask for, by code.
Codes the server documents:

| Code | Meaning | Unit |
|------|---------|------|
| `I1` | Device name | text |
| `I18` | Computer name | text |
| `I14` | Used storage | bytes |
| `I78` | Active data sources | text list, e.g. `D01D02` |
| `D09F00` | Last session status (all data sources) | status number |
| `D09F09` | Last successful session (all data sources) | Unix seconds |

Codes are `D<data source>F<field>`. Data source numbers are zero-padded
(`D01`, not `D1`). `cove_columns_list` returns every code available for a
customer; use it before guessing any code not in the table.

Session status numbers in `F00` columns, from N-able's column reference:

| Value | Status |
|-------|--------|
| 1 | In process |
| 2 | Failed |
| 3 | Aborted |
| 5 | Completed |
| 6 | Interrupted |
| 7 | Not started |
| 8 | Completed with errors |
| 9 | In progress with faults |
| 10 | Over quota |
| 11 | No selection |
| 12 | Restarted |

If a device shows a value not in this table, report the raw number.

Column `I3` (also `QW`) is the device's password. The server refuses it in
`columns`, `filter`, `totals` and `order_by`. It also refuses the `ANY`
pseudo-column, because that may match across `I3`. Filter on a named column.

## Paging and Truncation

- Only `cove_device_statistics_list` pages: `start_record_number` (zero-based,
  default 0) and `records_count` (default 100, capped at 1000). The server
  makes one call per tool call and never pages for you. Keep requesting the
  next offset until a page returns fewer rows than `records_count`.
- `cove_audit_actions_list` takes `count_limit` (default 100, max 1000).
- `cove_partner_tree_get` takes `children_limit` (max 1000 per node).
- Every other list returns everything in one response.
- When a response is larger than the server's output cap, rows are dropped
  from the end and the response carries `truncated: true`,
  `returned_items`, `total_items_in_page` and a `truncation_hint`. Never
  report a truncated list as complete. Ask for fewer columns, a smaller
  `records_count`, a `filter`, or one child customer at a time.
- A response over the server's byte cap fails with an error asking you to
  narrow the query. Do the same.

## Units

- Statistics column `I14` is **bytes**.
- `cove_storage_statistics_list` returns **megabytes** (`UsedStorageInMb`,
  `TotalStorageInMb` and similar).
- Timestamps are Unix seconds, both in columns such as `D09F09` and in the
  `from` and `to` arguments of `cove_audit_actions_list`.

## Errors

Cove answers errors with HTTP 200 and a JSON-RPC `error`. Tool errors carry
the Cove error number, the JSON-RPC code, the message, and a `request_id`.

| Error | Meaning | What to do |
|-------|---------|------------|
| 2100 | Login failed: unknown partner, username, or bad token | Check the partner name first: it must match the console exactly. Then the login name with its suffix, then the token. Fix it in Conduit under Connections. |
| 13501 | The API user's role does not allow this method | Usually `cove_audit_actions_list` with a Supporter API user. Say so; do not retry. |
| 1701 | Visa rejected even after a fresh login | Retry once later. If it repeats, reconnect in Conduit. |
| HTTP 429 | Rate limited | Wait for the `Retry after` time in the message. Cove documents no limits, so pace large sweeps. |
| Timeout | No answer within the request timeout | Narrow the query; split by child customer. |

Quote the `request_id` when you report an error the user cannot fix.

## Gotchas

- `cove_partner_children_list` returns a **count**. Cove may answer with
  `Children: null` and an `ActualChildCount`; that does not mean there are
  no children. List them with `cove_partners_list` or `cove_partner_tree_get`.
- `cove_devices_list` lists only devices **directly** under one customer and
  has no paging. For backup health across a tree, use
  `cove_device_statistics_list`, which includes sub-customers.
- `cove_user_roles_list` takes an optional `partner_id`; whether Cove uses it
  is unconfirmed.
- The storage-node tools (`cove_storage_nodes_list`, `cove_storage_node_get`,
  `cove_storage_nodes_by_device_list`) are not yet confirmed against a live
  Supporter API user. If they return 13501, the role does not allow them.
- Password, installation token and storage credential fields always come back
  redacted. That is the server, not missing data.

## Related Skills

- `cove-backup-health`: failed and stale backup triage
- `cove-customer-inventory`: customer tree, products, storage and residency
- `cove-access-review`: console users, roles and the audit log
