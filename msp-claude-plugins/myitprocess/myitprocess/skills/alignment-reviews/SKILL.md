---
name: "myITprocess Alignment Reviews"
description: >
  The myITprocess alignment-review pipeline: review status stages (New through
  Complete), engineer and vCIO due dates, standards categories that are up for
  review or overdue per client, and client-level staleness signals (last review
  date, last assigned-member activity, alignment score). Covers preparing the
  next alignment review for a client and a portfolio sweep for reviews that are
  behind schedule. Read-only.
when_to_use: >-
  When planning or preparing an alignment review, checking which reviews are late
  or stuck with the engineer or the vCIO, finding clients whose standards
  categories are overdue, or ranking clients by alignment score or review
  staleness. Use when: alignment review prep, overdue reviews, overdue
  categories, review backlog, stale clients, alignment score, or vCIO workload.
---

# myITprocess Alignment Reviews

## Overview

An alignment review is how an MSP measures a client against its own technology
standards. In myITprocess an engineer answers the review first, then the vCIO
completes it and turns gaps into findings and recommendations. This skill covers
the review side of that loop: what is due, what is late, and what to review
next. See [api-patterns](../api-patterns/SKILL.md) for filters, paging and the
rate limit.

Every tool used here is a Conduit **read** tool. None is admin-gated, and none
can change a review: status, assignee and due dates are edited in the
myITprocess UI.

## Anti-triggers

- **What the review found, and what to do about it** (findings,
  recommendations, budget) — use [roadmap](../roadmap/SKILL.md).
- **A brief for one client's upcoming QBR** — use [qbr-prep](../qbr-prep/SKILL.md).

## Key Concepts

### Review status (`myitprocess_reviews_list`)

| Status | Meaning | Who owns the next step |
|--------|---------|------------------------|
| `New` | Created, not started | Engineer |
| `EngineerInProgress` | Engineer answering | Engineer |
| `EngineerComplete` | Engineer done, waiting on vCIO | vCIO |
| `VcioInProgress` | vCIO reviewing | vCIO |
| `Complete` | Finished | - |

Each review carries `engineerDueDate` / `engineerCompleteDate`,
`vcioDueDate` / `vcioCompleteDate`, `assignedEngineer.fullName`,
`assignedVCIO.fullName`, `client.id` / `client.name`, `createdDate` and
`lastUpdatedDate`. The tool returns active reviews only.

### Overdue categories (`myitprocess_reviews_overdue_categories_list`)

myITprocess schedules each standards category on a review cadence. This tool
lists, per client, the categories that are **up for review or overdue**
(`client.id`, `client.name`, category `id`, `name`, `fullName`). It is the
direct answer to "what should the next review for this client cover?"

### Client signals (`myitprocess_clients_list`)

`alignmentScore`, `lastReviewDate`, `lastAssignedMemberActivityDate`,
`isActive`, `createdDate`, `deactivatedDate`. A low score or an old
`lastReviewDate` marks a client that needs attention even when no review is
open.

## Common Workflows

### Prepare the next alignment review for one client

1. Resolve the client: `myitprocess_clients_list` with a `name` `contains`
   filter. Confirm the match with the user if more than one client comes back.
   Note `alignmentScore` and `lastReviewDate`.
2. `myitprocess_reviews_overdue_categories_list` filtered by `client.id`. This
   is the scope of the next review.
3. `myitprocess_reviews_list` filtered by `client.id` to see whether a review is
   already open and where it sits.
4. Optional context: `myitprocess_findings_list` filtered by the last completed
   review's `review.id`, to show which gaps from last time are still open
   (finding type `UnassignedReviewFinding` means a gap never turned into a
   recommendation).
5. Report: client, score, last review date, open review (if any) with owner and
   due date, and the list of overdue categories grouped as the reviewer will
   work them.

### Reviews behind schedule (portfolio)

1. `myitprocess_reviews_list` filtered `status` `notEqual` `Complete`, sorted by
   `engineerDueDate` ascending. Page until you have `totalCount`.
2. Classify each open review against today's date:
   - **Engineer late**: status `New` or `EngineerInProgress` and
     `engineerDueDate` in the past.
   - **vCIO late**: status `EngineerComplete` or `VcioInProgress` and
     `vcioDueDate` in the past.
   - **Stalled**: `lastUpdatedDate` older than about 14 days, whatever the due
     date.
3. Group by `assignedEngineer.fullName` and `assignedVCIO.fullName` to show
   whose queue is the bottleneck.
4. Report counts per bucket, then the late reviews oldest first: client, review
   name, status, owner, due date, days late.

Do the date comparison yourself on the returned items unless a date filter
clearly works; date filter formats are not documented in the spec.

### Clients due for a review (portfolio)

1. `myitprocess_clients_list` filtered `isActive` `equal` `true`, sorted by
   `lastReviewDate` ascending.
2. `myitprocess_reviews_overdue_categories_list` (no filter, paged) and count
   overdue categories per `client.id`.
3. Rank clients by number of overdue categories, then by age of
   `lastReviewDate`; show `alignmentScore` alongside. A client with no open
   review in `myitprocess_reviews_list` and many overdue categories is the one
   to schedule first.

### vCIO / engineer workload

Join open reviews (`myitprocess_reviews_list`) to staff
(`myitprocess_users_list`: `firstName`, `lastName`, `roleName`,
`lastLoginDate`) by name. A reviewer with many late reviews and an old
`lastLoginDate` usually means the work has been dropped, not that it is
in progress.

## Gotchas

- **Client names are free text.** Use `contains`, then confirm; two clients can
  share a prefix.
- **Rate limit.** A full portfolio sweep is three or four list calls plus
  paging. Do not loop per client when one unfiltered, paged call answers the
  question (50 requests per minute, shared with other integrations).
- **No write path.** If the user asks to reassign, re-date or close a review,
  say that this connector is read-only and the change is made in myITprocess.
