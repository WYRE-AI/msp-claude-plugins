---
name: ticket-summary
description: Summarize a single Freshdesk ticket and its full conversation thread — the request, what has happened, current SLA state, and the recommended next action
arguments:
  - name: ticket_id
    description: The Freshdesk ticket id to summarize (required)
    required: true
---

# Freshdesk Ticket Summary

Produce a concise, handoff-ready summary of one Freshdesk ticket and its conversation history. Built for shift handovers, escalation context, and "catch me up on ticket 12345" moments where reading the whole thread yourself is slow.

## How it works

1. **Fetch the ticket with everything embedded** — `freshdesk_tickets_get` with
   `include=conversations,requester,company,stats`. One call pulls the ticket
   fields, the full reply/note thread, requester and company context, and the
   SLA timestamps.
2. **Reconstruct the thread** — walk the conversation entries in order,
   distinguishing `incoming` requester messages, outgoing agent replies, and
   `private` internal notes. Internal notes inform the summary but are flagged
   as internal, not quoted back as if they were sent to the customer.
3. **Read SLA state** — compare `due_by` (resolution-due) and `fr_due_by`
   (first-response-due) from `stats` against now to classify the ticket as
   breached, at-risk, or healthy.

## What it produces

- **Header** — ticket id, subject, requester + company, current status and
  priority (as labels, translated from the integer encodings: status 2 Open /
  3 Pending / 4 Resolved / 5 Closed; priority 1 Low - 4 Urgent), and assigned
  group/agent.
- **The request** — a one-to-two sentence statement of what the requester
  actually wants/reported.
- **What has happened** — a short chronological digest of the conversation:
  requester messages, agent replies, and the gist of internal notes.
- **SLA state** — breached / at-risk / healthy, with the relevant `due_by` /
  `fr_due_by` timestamp.
- **Recommended next action** — the single most useful next step (reply, route,
  escalate, await customer), framed for whoever picks the ticket up.

## Notes

- This command is **read-only**. It does not reply, update, or close the ticket
  — summarizing a thread should never email the requester. To act on the
  summary, use the ticketing tools (`freshdesk_tickets_reply`,
  `freshdesk_tickets_update`, `freshdesk_tickets_add_note`) deliberately.
- If the ticket id is unknown (404), re-search via `/search-tickets` to confirm
  the id before retrying.

## Related

- `/search-tickets` - find the ticket id to summarize
- `freshdesk-triage` agent - queue-wide triage and routing across many tickets
