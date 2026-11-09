---
name: "SmileBack CSAT and NPS QBR Summary"
description: >
  Building a per-client customer-satisfaction section for a QBR or account
  review from SmileBack: resolving the client, pulling a quarter of CSAT
  reviews and NPS responses, computing satisfaction, response rate and NPS
  with period-over-period change, reading project survey results, picking
  representative comments, and the sample-size and data-protection caveats
  that keep the numbers honest.
when_to_use: >-
  When preparing a quarterly business review, account review or renewal
  conversation and the client's satisfaction data is needed. Use when:
  smileback qbr, csat for a client, nps for a client, customer satisfaction
  report, satisfaction trend this quarter, client happiness score, or
  "how happy is this client with our service".
---

# SmileBack CSAT and NPS QBR Summary

## Overview

A QBR satisfaction slide answers three questions for one client: how
satisfied were they with ticket support this quarter, is that better or
worse than last quarter, and what are they telling us in their own
words. SmileBack holds the raw feedback; it has no per-client score
endpoint, so the numbers are computed here from the individual reviews
and responses. All tools used below are Conduit **read** tier; none is
admin-gated.

## Anti-triggers

- **Acting on a bad review** (calling the contact back, opening a
  follow-up ticket): use `smileback-detractor-follow-up`.
- **Ranking or coaching technicians**: use `smileback-technician-csat`.
  A client QBR reports the service, not individual techs.
- **Crewhu survey data**: use `crewhu-surveys`. This skill reads
  SmileBack only.

## Workflow

### 1. Resolve the client

Call `smileback_csat_companies_list` and find the client by name. Note
its `id` (for reviews) and exact `name` (for NPS, which groups by
contact company name). If two companies match, ask which one; do not
merge them silently.

### 2. Pull two quarters of reviews in one pass

Call `smileback_reviews_list` with `modified_since` set to the start of
the previous quarter and `include_unrated: true`, paging until `next`
is null (see `smileback-api-patterns` for truncated pages). One pull
covers this quarter and the comparison quarter for every client, so
reuse it if you are preparing several QBRs.

Keep rows where `company.id` is the client. Assign each to a quarter:

- Rated reviews by `rated_on`.
- Unrated reviews (no `rated_on`) by `ticket.closed_on`.

`modified_since` returns anything edited since that date, so drop rows
rated or closed before the previous quarter.

### 3. Compute CSAT

For each quarter:

| Metric | Formula |
|---|---|
| Surveys sent | rated + unrated reviews |
| Response rate | rated / surveys sent |
| Positive share | positive / rated |
| Negative share | negative / rated |
| Net satisfaction | positive share minus negative share |

Check the `rating` values on the first page before counting. If
SmileBack's own dashboard shows a different headline number,
say which formula you used rather than adjusting yours to match.

Break the quarter down by `ticket.segment` (the PSA board) when the
client has tickets on more than one board; a dip is often one board.

### 4. Compute NPS

Call `smileback_nps_campaigns_list` to see which campaigns ran, then
`smileback_nps_responses_list` with `created_since` at the start of the
previous quarter (add `campaign_name` if the MSP runs more than one).
Keep responses whose `contact.company` matches the client name.

NPS = % promoters (9-10) minus % detractors (0-6), from -100 to +100.
Report the response count next to the score. List any responses whose
company you could not match to a CSAT company instead of dropping them.

### 5. Project surveys, if any

If the client had a project this quarter, call
`smileback_project_surveys_list` and `smileback_project_responses_list`
with `created_since` at the quarter start. Filter to the client using
the contact or company on each response if present; if the responses do
not identify the client, say so instead of guessing.

### 6. Choose comments

Pick two or three comments that represent the quarter: the most common
positive theme, and any negative theme that appears more than once.
Quote the comment text and the ticket title. Leave out contact emails;
use first names only if the QBR audience is the client's own staff.
For NPS promoters, only reuse a comment outside the QBR (case study,
website) when `has_marketing_permission` is true.

## Output

```
Customer satisfaction - <Client>, <Quarter>

CSAT (ticket feedback)            This quarter   Last quarter
  Surveys sent                    142            128
  Response rate                   38%            41%
  Positive / neutral / negative   49 / 3 / 2     46 / 4 / 3
  Net satisfaction                +87            +81

NPS (<campaign>)                  +45 (n=11)     +30 (n=10)

By board: Service Desk +90 (n=44), Projects +70 (n=10)

What they said
  + "Fixed before I finished my coffee" - Printer offline at reception
  - "Took three days to hear back" - VPN drops in the afternoon (2 similar)
```

## Gotchas

- **Small samples.** Under about 20 rated reviews, one negative moves
  net satisfaction by several points. Show `n` next to every score and
  describe a change between small samples as a direction, not a trend.
  NPS with fewer than 10 responses is anecdotal; say so.
- **Response rate matters as much as the score.** A falling response
  rate with a rising score usually means fewer unhappy people are
  bothering to answer.
- **One credential, every client.** The pull returns every client's
  feedback. Make sure nothing from other clients reaches this client's
  deck.
- **Departed contacts and techs** still appear on old reviews. That is
  expected; report the service, not the people.
