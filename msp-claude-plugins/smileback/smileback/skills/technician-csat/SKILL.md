---
name: "SmileBack Technician and Board CSAT"
description: >
  Reporting CSAT by technician and by PSA service board from SmileBack:
  mapping reviews to the agents and boards on each ticket, per-tech
  response rate and satisfaction with minimum sample sizes, handling
  tickets credited to several agents and techs who have left, surfacing
  praise for recognition and negatives for coaching, and keeping the
  output fair enough to use in a one-to-one.
when_to_use: >-
  When a service manager wants to see how each technician or board is
  rated, prepare a one-to-one, or find praise worth recognising. Use when:
  smileback technician csat, tech scorecard, agent satisfaction, csat by
  board, csat leaderboard, coaching csat, which tech gets the best
  reviews, or service desk csat breakdown.
---

# SmileBack Technician and Board CSAT

## Overview

SmileBack attaches every review to a ticket, and every ticket to a
board and the technicians who worked it. That makes it the most direct
measure of how customers experience each tech and each board. This
skill turns a period of reviews into a fair per-tech and per-board view
for coaching and recognition. All tools used are Conduit **read** tier;
none is admin-gated.

## Anti-triggers

- **A client's satisfaction for a QBR**: use
  `smileback-csat-qbr-summary`.
- **Calling back an unhappy customer**: use
  `smileback-detractor-follow-up`.
- **Badges, contests and prizes for techs**: use `crewhu-surveys` or
  the rest of the Crewhu plugin. SmileBack has no recognition features.

## Workflow

### 1. Reference lists

Call `smileback_csat_agents_list` for the active technicians and
`smileback_csat_boards_list` for the PSA boards. The agent list holds
active techs only; techs who have left still appear on older reviews.
Report them under "former staff" rather than dropping their reviews.

### 2. Pull the period

`smileback_reviews_list` with `modified_since` at the period start and
`include_unrated: true`, paged to the end. Keep reviews, rated or not,
whose `ticket.closed_on` is in the period (fall back to `rated_on` when
`closed_on` is missing), so rated and unrated reviews come from the same
cohort and the response rate is not skewed. A month is the shortest useful period for one tech;
a quarter is better.

### 3. Attribute

- **Per tech:** credit each review to every agent in `ticket.agents`.
  Say in the output that multi-agent tickets count once per agent, so
  per-tech totals add up to more than the board total.
- **Per board:** group by `ticket.segment`. Each review counts once.

### 4. Compute

For each tech and board: surveys sent, response rate, and the
positive / neutral / negative counts, with net satisfaction (positive
share minus negative share). Check the `rating` values on the first
page before counting.

Do not rank anyone with fewer than 10 rated reviews in the period. List
them separately with their counts and no score.

### 5. Pick the stories

- **Recognition:** positive reviews with a comment that names the tech
  or describes something specific. These are worth reading out in a
  team meeting.
- **Coaching:** negatives where the comment points at something the
  tech controls (communication, follow-through, tone) rather than at
  the client's environment or a vendor outage. Quote the comment and
  link the `permalink`.

## Output

```
Technician CSAT - <period>

Tech        Sent  Resp.  +  =  -   Net   Notes
Sam          96   41%   37  2  0  +95
Priya        88   36%   28  2  2  +81   2 negatives on Projects board
Alex         71   30%   20  1  0  +95
Jordan        9    -     6  0  1   -    under 10 rated, not scored

Board          Rated  Net
Service Desk    118   +90
Projects         24   +71

Multi-agent tickets count once per agent.
```

## Gotchas

- **Response rate shapes the score.** A tech whose customers rarely
  answer can look perfect on six reviews. Show response rate beside
  every score.
- **Board mix.** Techs on a projects or onboarding board get harder
  tickets. Compare techs on the same board before comparing across
  boards.
- **Context before conclusions.** A cluster of negatives during a
  vendor outage is not a coaching issue. Check ticket titles before
  attributing a dip to a person.
- **Sharing.** Comments include customers' names and words. A per-tech
  report is for the tech and their manager, not a team-wide channel.
