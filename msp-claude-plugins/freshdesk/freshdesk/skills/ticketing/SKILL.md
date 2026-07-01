---
name: "Freshdesk Ticketing"
when_to_use: "When listing, searching, creating, updating, replying to, or summarizing Freshdesk tickets and their conversations"
description: >
  Use this skill when working with Freshdesk tickets — creating, updating,
  searching, replying, and adding notes, plus pulling full conversation
  threads. Covers status/priority/source integer encodings, key ticket fields,
  the search query language, and common MSP triage workflows through the
  Freshdesk REST API v2.
triggers:
  - freshdesk ticket
  - freshdesk reply
  - freshdesk ticket note
  - freshdesk conversation
  - create ticket freshdesk
  - search tickets freshdesk
  - ticket triage freshdesk
  - resolve ticket freshdesk
  - ticket status freshdesk
---

# Freshdesk Ticket Management

## Overview

Tickets are the core unit of service delivery in Freshdesk. Every customer
request, incident, and task flows through the ticketing system. This skill
covers listing, getting, searching, creating, updating, replying, adding
notes, and reading conversation threads via the Freshdesk REST API v2,
surfaced through tools named `freshdesk_tickets_<action>`.

## Status, Priority & Source Encodings

Freshdesk encodes these fields as integers in both the API payloads and the
search query language.

### Status

| Value | Status | Business Logic |
|-------|--------|----------------|
| 2 | Open | Default for new tickets; needs action |
| 3 | Pending | Waiting on customer or third party; clock may pause |
| 4 | Resolved | Issue addressed; awaiting confirmation |
| 5 | Closed | Ticket complete; no further action |

### Priority

| Value | Priority | Typical Response |
|-------|----------|------------------|
| 1 | Low | Next business day |
| 2 | Medium | Same business day |
| 3 | High | 1-2 hours |
| 4 | Urgent | Immediate response |

### Source

| Value | Source |
|-------|--------|
| 1 | Email |
| 2 | Portal |
| 3 | Phone |

(Additional source codes exist for chat, feedback widget, and other channels.)

## Key Ticket Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | System | Auto-generated unique identifier |
| `subject` | String | Yes | Brief issue summary |
| `description` | String (HTML) | Yes (on create) | Detailed description |
| `status` | Integer | No | 2 Open, 3 Pending, 4 Resolved, 5 Closed |
| `priority` | Integer | No | 1 Low, 2 Medium, 3 High, 4 Urgent |
| `source` | Integer | No | 1 Email, 2 Portal, 3 Phone |
| `type` | String | No | Ticket type (e.g. Incident, Service Request) |
| `tags` | Array | No | Free-form labels |

### Requester & Assignment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requester_id` | Integer | One of requester fields | Contact ID of the requester |
| `email` | String | One of requester fields | Requester email (creates a contact if new) |
| `responder_id` | Integer | No | Assigned agent ID |
| `group_id` | Integer | No | Assigned group ID |
| `company_id` | Integer | No | Associated company ID |

### SLA Fields

| Field | Type | Description |
|-------|------|-------------|
| `due_by` | Timestamp | Resolution-due deadline (driven by SLA policy + business hours) |
| `fr_due_by` | Timestamp | First-response-due deadline |

When creating a ticket you must supply `subject`, `description`, and a
requester (`requester_id` **or** `email`). Status defaults to Open (2) and
priority to Low (1) if omitted.

## Operations

### List Tickets

```http
GET /api/v2/tickets?per_page=100&page=1
```

Common query params: `filter` (e.g. `new_and_my_open`, `watching`,
`spam`, `deleted`), `updated_since`, `order_by`, `order_type`. Use
`include=requester,stats` to embed related data.

### Get a Single Ticket

```http
GET /api/v2/tickets/{id}?include=conversations,requester,company,stats
```

`include=conversations` embeds the reply/note thread; `include=stats` adds
resolution and first-response timestamps useful for SLA checks.

### Search Tickets

```http
GET /api/v2/search/tickets?query="status:2 AND priority:4"
```

The query language wraps the whole expression in double quotes, combines
clauses with `AND` / `OR`, and supports fields such as `status`, `priority`,
`agent_id`, `group_id`, `type`, `tag`, `created_at`, and `updated_at`. Search
returns up to 30 results per page and a maximum of 10 pages (300 records) —
narrow the query when a result set would exceed that.

```text
# Unresolved urgent tickets
"status:2 AND priority:4"

# A group's high/urgent backlog created this month
"group_id:7 AND (priority:3 OR priority:4) AND created_at:>'2024-02-01'"
```

### Create a Ticket

```http
POST /api/v2/tickets
```

```json
{
  "subject": "Unable to access email - Outlook disconnected",
  "description": "User reports Outlook showing disconnected since 9am. Webmail works fine.",
  "email": "john.smith@acme.com",
  "priority": 3,
  "status": 2,
  "source": 1,
  "group_id": 7
}
```

### Update a Ticket

```http
PUT /api/v2/tickets/{id}
```

Assign and re-prioritize:
```json
{
  "responder_id": 42,
  "status": 2,
  "priority": 4
}
```

Resolve:
```json
{
  "status": 4
}
```

### Reply to a Ticket (customer-facing)

```http
POST /api/v2/tickets/{id}/reply
```

```json
{
  "body": "<p>We've identified the cause and a technician is working on the fix. We'll update you within the hour.</p>"
}
```

A reply is added to the conversation thread and emailed to the requester.

### Add a Note (internal or public)

```http
POST /api/v2/tickets/{id}/notes
```

Internal note (private to agents):
```json
{
  "body": "<p>Event logs show KB5034441 correlation. Known Outlook cache issue.</p>",
  "private": true
}
```

Public note (visible to requester):
```json
{
  "body": "<p>Thanks for the additional screenshots — they confirm the cache issue.</p>",
  "private": false
}
```

### Read Conversations

```http
GET /api/v2/tickets/{id}/conversations
```

Returns the ordered thread of replies and notes. Each entry indicates whether
it is `private` (internal note), `incoming` (from the requester), or an
outgoing agent reply. Use this to reconstruct the full history of a ticket
before summarizing or responding.

## Common Workflows

### Ticket Creation Flow

1. **Resolve the requester** — look up the contact by email; if none exists,
   passing `email` on create will auto-create the contact.
2. **Check for duplicates** — search recent open tickets for the same
   requester/subject.
3. **Set defaults** — status Open (2), priority by impact/urgency.
4. **Create** — `POST /tickets` with `subject`, `description`, requester.
5. **Acknowledge** — optionally post a reply confirming receipt.

### Triage Workflow

1. **Pull the unresolved queue** — search
   `"status:2 OR status:3"`, ordered by priority descending.
2. **Identify unassigned tickets** — those with no `responder_id`.
3. **Check SLA pressure** — get each ticket with `include=stats` and compare
   `due_by` / `fr_due_by` against now to flag breached and at-risk tickets.
4. **Route** — set `group_id` / `responder_id` by category and skillset.
5. **Re-prioritize** — bump `priority` where impact warrants it.
6. **Document** — add an internal note recording the triage decision.

### Escalation

```http
PUT /api/v2/tickets/{id}
```
```json
{
  "priority": 4,
  "group_id": 9
}
```
Add an internal note capturing the escalation reason alongside the update.

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 400 Validation failed | Missing subject/description/requester, or bad encoding | Supply required fields; use integer status/priority |
| 404 Not found | Unknown ticket ID | Re-list or re-search to confirm the ID |
| 403 Forbidden | API key lacks scope for the action | Check the agent's permissions |
| 429 Rate limited | Over per-minute limit | Read `Retry-After` and back off |

## Best Practices

1. **Use integer encodings** — never send status/priority as strings.
2. **Validate the requester first** — confirm the contact or rely on `email`
   auto-creation deliberately.
3. **Keep internal detail in private notes** — public replies stay
   customer-appropriate.
4. **Pull conversations before replying** — avoid repeating prior answers.
5. **Check `due_by` / `fr_due_by`** — let SLA deadlines drive triage order.
6. **Tag consistently** — tags power later search and reporting.

## Related Skills

- [Freshdesk API Patterns](../api-patterns/SKILL.md) - Auth, pagination, search, rate limits
- [Freshdesk Contacts & Companies](../contacts-companies/SKILL.md) - Requester resolution
- [Freshdesk Knowledge Base](../knowledge-base/SKILL.md) - Suggesting KB articles on tickets
- [Freshdesk SLA & Business Hours](../sla-business-hours/SKILL.md) - SLA deadlines and breach detection
