---
name: search-tickets
description: Search Freshdesk tickets with the Freshdesk query language — filter by status, priority, agent, group, type, tag, and date — and return a ranked, readable result list
arguments:
  - name: query
    description: A Freshdesk search expression (e.g. "status:2 AND priority:4") OR a plain-language description that gets translated into one
    required: false
  - name: status
    description: open (2), pending (3), resolved (4), closed (5), or unresolved (open+pending, the default when no query/status is given)
    required: false
  - name: priority
    description: low (1), medium (2), high (3), urgent (4)
    required: false
  - name: group
    description: Group id to scope to (routing/skillset queue)
    required: false
  - name: agent
    description: Agent id to scope to (responder)
    required: false
---

# Freshdesk Search Tickets

Search the Freshdesk ticket queue using `freshdesk_tickets_search`, which wraps `GET /api/v2/search/tickets` and the Freshdesk query language. Use it to pull a focused slice of the queue — an agent's backlog, a group's urgent tickets, this week's new requests — without paging the entire ticket list.

## How it builds the query

Freshdesk encodes `status`, `priority`, and `source` as **integers**, and wraps the whole expression in double quotes:

| Field | Encoding |
|-------|----------|
| `status` | 2 Open, 3 Pending, 4 Resolved, 5 Closed |
| `priority` | 1 Low, 2 Medium, 3 High, 4 Urgent |

- A raw `query` argument is passed through as-is (it already speaks the query language).
- Otherwise the `status` / `priority` / `group` / `agent` arguments are assembled into one expression, combined with `AND`, e.g. `"status:2 AND priority:4 AND group_id:7"`.
- With no arguments at all, defaults to the unresolved backlog: `"status:2 OR status:3"`.

```text
# Unassigned-feel: open + urgent
"status:2 AND priority:4"

# A group's high/urgent backlog this month
"group_id:7 AND (priority:3 OR priority:4) AND created_at:>'2024-02-01'"
```

## Result caps (important)

Search returns at most **30 results per page** and **10 pages** — a hard ceiling of **300 records** per query. When a result set would exceed that, this command narrows the query (tighter date window, add a status/group filter) and runs multiple targeted searches rather than silently returning a truncated queue. It tells you when it has narrowed.

## What it produces

A ranked list (urgent/high first, then by SLA pressure where `include=stats` is available):

| Column | Source |
|--------|--------|
| Ticket id + subject | search result |
| Requester / company | `include=requester,company` |
| Status / priority (as labels) | integer fields, translated |
| Assigned group / agent | `group_id` / `responder_id` |
| SLA state (`due_by`, `fr_due_by`) | `include=stats` |

## Use the agent for

This command returns the matching tickets. For "what should we work first and where should it route?" hand off to the `freshdesk-triage` agent — it ranks the queue by SLA-and-impact and recommends routing. This command is the search; the agent is the triage narrative.
