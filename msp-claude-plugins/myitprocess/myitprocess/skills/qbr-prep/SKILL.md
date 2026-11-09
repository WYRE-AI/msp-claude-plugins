---
name: "myITprocess QBR Prep"
description: >
  Assembling a one-client brief from myITprocess before a QBR or strategy
  meeting: the meeting record and its agenda recommendations, the client's
  alignment score and review history, open and recently changed
  recommendations, budget for the coming quarters, initiatives, and open review
  gaps. Also covers a meetings calendar across clients. Read-only.
when_to_use: >-
  When preparing for a client QBR, business review or strategy meeting from
  myITprocess data, or listing upcoming and past client meetings. Use when:
  myitprocess qbr, qbr prep, business review prep, vcio meeting prep, meeting
  agenda, upcoming client meetings, or strategy meeting.
---

# myITprocess QBR Prep

## Overview

A QBR in myITprocess is a meeting record (`myitprocess_meetings_list`) with the
recommendations the vCIO wants to discuss on its agenda. The brief this skill
produces gives the vCIO the client's current position and the decisions to ask
for, in one page. It uses only Conduit **read** tools; none is admin-gated, and
nothing here can create or edit the meeting or its agenda (that is done in
myITprocess).

See [api-patterns](../api-patterns/SKILL.md) for filters and the rate limit,
[alignment-reviews](../alignment-reviews/SKILL.md) for review status, and
[roadmap](../roadmap/SKILL.md) for recommendation, finding and budget fields.

## Anti-triggers

- **A cross-vendor QBR built as a value conversation** (PSA ticket stats, RMM,
  security tooling, MSP Value Pyramid levels 3-5) — use the wyre-gateway
  plugin's QBR prep agent; it can take this skill's brief as its vCIO roadmap
  input.

## Key Concepts

### Meetings (`myitprocess_meetings_list`)

| Field | Notes |
|-------|-------|
| `status` | `Upcoming`, `InProgress`, `Past`, `Cancelled` |
| `title`, `purpose`, `summaryDescription`, `location` | Free text set by the vCIO |
| `startDate`, `endDate` | Meeting time |
| `client.id`, `client.name` | The client |
| `createdBy.fullName` | Usually the vCIO |
| agenda recommendation IDs | Array; returned but not filterable |

## Common Workflows

### One-client QBR brief

1. **Client.** `myitprocess_clients_list` with `name` `contains` the client
   name; confirm the match. Keep `id`, `alignmentScore`, `lastReviewDate`.
2. **Meeting.** `myitprocess_meetings_list` filtered by `client.id`, sorted by
   `startDate` `desc`. Take the next `Upcoming` meeting as the one being
   prepared, and the most recent `Past` meeting as the baseline for "since last
   time". If there is no upcoming meeting, say so and prepare against today.
3. **Recommendations.** `myitprocess_recommendations_list` filtered by
   `client.id` and `isArchived` `equal` `false`; page to `totalCount`. Mark the
   ones whose `id` is in the upcoming meeting's agenda.
4. **Initiatives.** `myitprocess_initiatives_list` filtered by `client.id` and
   `isArchived` `equal` `false`, to group recommendations under their initiative
   titles.
5. **Reviews and gaps.** `myitprocess_reviews_list` filtered by `client.id`;
   `myitprocess_reviews_overdue_categories_list` filtered by `client.id`; and
   for the latest completed review, `myitprocess_findings_list` filtered by its
   `review.id` and `findingType` `equal` `UnassignedReviewFinding`.

That is six to eight calls for one client, well inside the 50 per minute limit.

### Brief layout

1. **Header** — client, meeting title, date, purpose, vCIO.
2. **Position** — alignment score, last review date, open review and its status,
   number of overdue standards categories.
3. **Since last meeting** — agenda items from the last `Past` meeting and their
   status now (`Completed`, `InProgress`, still `NotDiscussed`).
4. **Decisions to ask for** — agenda recommendations that are `NotDiscussed` or
   `OnHold`, highest `priority` first, with budget, budget month, hours and
   responsible party.
5. **Roadmap by initiative** — remaining open recommendations grouped by
   initiative; budget totals for the next two to four quarters, committed
   (`Accepted`, `InProgress`) separate from proposed (`NotDiscussed`).
6. **Gaps without a plan** — unassigned findings from the last review, by
   `question.label`. Mark this section internal: findings describe security
   gaps.
7. **Next review** — the overdue categories, as the scope to schedule.

Keep sections that have nothing in them, with a one-line "none", so the reader
knows the data was checked.

### Meetings calendar (portfolio)

`myitprocess_meetings_list` filtered `status` `equal` `Upcoming`, sorted by
`startDate` ascending. Cross-check `myitprocess_clients_list` (active clients)
for clients with no upcoming meeting and an old `lastReviewDate`: those are the
QBRs that have not been booked.

## Gotchas

- **Agenda IDs are not filterable.** Fetch the client's recommendations once and
  match IDs locally; do not query recommendations one by one.
- **`summaryDescription` on past meetings is the vCIO's own note.** Quote it as
  written; do not paraphrase it into commitments the client did not make.
- **Read-only.** If the user asks to add an item to the agenda or mark a
  recommendation accepted after the meeting, say that it is done in myITprocess;
  this connector cannot write.
