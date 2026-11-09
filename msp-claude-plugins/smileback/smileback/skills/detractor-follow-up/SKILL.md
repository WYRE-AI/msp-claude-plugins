---
name: "SmileBack Detractor Follow-Up"
description: >
  Finding and triaging unhappy customers in SmileBack: negative and neutral
  CSAT reviews on recent tickets and NPS detractors, enriching each with the
  ticket, board, technicians and comment, spotting repeat detractors and
  at-risk clients, checking what follow-up SmileBack already records, and
  handing each case to the PSA because SmileBack's API cannot record a
  follow-up.
when_to_use: >-
  When reviewing bad feedback so someone can call the customer back, or
  checking a client for churn signals. Use when: smileback negative review,
  smileback detractor, unhappy customer, bad csat, frowny face, csat
  follow-up, nps detractor follow-up, at-risk client, or "who gave us a bad
  review this week".
---

# SmileBack Detractor Follow-Up

## Overview

A negative reaction on a closed ticket is the cheapest churn signal an
MSP gets, and it goes stale in days. This workflow finds the recent
negative and neutral CSAT reviews and NPS detractors, gives the service
manager enough context to call the customer, and flags patterns that
point at a client relationship rather than a single ticket.

SmileBack's API is read-only. Every tool here is Conduit **read** tier,
none is admin-gated, and none can mark a review as handled. The
follow-up itself (call, ticket, note) is recorded in the PSA.

## Anti-triggers

- **Quarterly satisfaction numbers for a client**: use
  `smileback-csat-qbr-summary`.
- **A technician's overall CSAT record**: use
  `smileback-technician-csat`. This skill is about the customer, not
  the tech's scorecard.

## Workflow

### 1. Collect recent negatives

- **Daily or weekly sweep:** `smileback_reviews_list_recent`, paged to
  the end.
- **A specific window:** `smileback_reviews_list` with
  `modified_since` at the window start, paged to the end, then keep
  reviews whose `rated_on` is inside the window.

Keep negative reviews. Include neutral ones as a second tier: a
neutral with a comment is often a complaint in polite form. Check the
`rating` values on the first page to see how the three reactions are
encoded.

### 2. Collect NPS detractors

`smileback_nps_responses_list` with `score_lt: 7` and `created_since`
at the window start. A detractor with a comment goes in the main list;
a bare 5 or 6 with no comment goes in the second tier.

### 3. Enrich each case

For each review, `smileback_reviews_get` gives the full record:

- `ticket` (`id`, `title`, `segment`, `agents`, `closed_on`): which
  ticket, which board, who worked it, and how long ago it closed.
- `comment`: the customer's words. A negative with no comment needs a
  call more than one with a clear explanation.
- `status` and `tags`: what SmileBack already records about follow-up.
  If they show the review was already handled, do not open a second
  follow-up.
- `permalink`: the link the service manager opens in SmileBack.

For an NPS detractor, `smileback_nps_responses_get` gives the contact's
title and company. A detractor who is the client's owner or IT contact
matters more than one who is a seasonal user.

### 4. Look for patterns

Group the cases before reporting:

- **Repeat contact:** the same contact negative more than once in 90
  days. Pull 90 days with `smileback_reviews_list` if the window was
  shorter.
- **Client cluster:** three or more negatives, or a negative plus an
  NPS detractor, from one `company` in the window. That is a
  relationship conversation for the account manager, not a ticket
  call-back.
- **Board cluster:** negatives concentrated on one `ticket.segment`
  point at a process problem on that board.

### 5. Hand off to the PSA

SmileBack cannot record the follow-up. For each case, give the service
manager what they need to open or update the PSA ticket: the PSA ticket
ID from `ticket.id`, the contact, the comment, and the suggested owner.
If a PSA plugin is connected, offer to add a note to the original
ticket, and wait for the operator to confirm before writing anything.

## Output

```
Detractor follow-up - <window>

Call today (3)
  Acme Dental - Jane (Office Manager) - negative, 2 days ago
    Ticket 48812 "Email not syncing on phone" - Service Desk - worked by Sam
    "Third time this month. Nobody called me back."
    Repeat contact (2 negatives in 30 days) - open in SmileBack: <permalink>

Watch (2)
  Brightline Law - NPS 5, no comment - Partner

Patterns
  Acme Dental: 3 negatives + 1 NPS detractor this month -> account manager
  Projects board: 4 of 6 negatives this week
```

Leave contact emails out of anything posted to a shared channel; the
permalink is enough to reach the full record.

## Gotchas

- **Speed matters more than completeness.** Report the call-today list
  first, then patterns.
- **Neutral is not positive.** Do not fold neutrals into "fine" when
  counting at-risk clients.
- **Multiple agents.** `ticket.agents` can list several technicians.
  Name all of them; do not blame the last one.
- **Old tickets resurfacing.** A review edited today on a ticket closed
  months ago shows up in a `modified_since` pull. Filter on `rated_on`.
