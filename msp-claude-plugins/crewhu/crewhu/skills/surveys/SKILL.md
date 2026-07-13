---
name: "Crewhu Surveys"
when_to_use: >-
  When analyzing CSAT/NPS surveys, drilling into detractors and promoters, or pulling per-user /
  per-team satisfaction trends from Crewhu. Use when: crewhu csat, crewhu nps, crewhu survey,
  crewhu detractor, crewhu promoter, csat trend, customer satisfaction crewhu, or nps score.
description: >
  Use this skill when working with Crewhu CSAT/NPS surveys — listing
  recent responses, drilling into a specific survey, isolating
  detractors and promoters for follow-up, and rolling responses up by
  user.
---

# Crewhu Surveys (CSAT / NPS)

Surveys are Crewhu's primary product — short CSAT/NPS responses tied
to a ticket close, a specific tech, or a project milestone. This skill
covers listing surveys, finding a specific one, and isolating the two
ends of the curve (detractors and promoters) so MSP managers can react.

## API Tools

### List & Search

| Tool | Purpose |
|------|---------|
| `crewhu_surveys_list` | Paginated list of recent survey responses |
| `crewhu_surveys_search` | Search surveys by keyword / metadata |
| `crewhu_surveys_get` | Pull full detail for one survey response |

### Sentiment Slices

| Tool | Purpose |
|------|---------|
| `crewhu_surveys_detractors` | Detractor responses (low scores / negative comments) |
| `crewhu_surveys_promoters` | Promoter responses (high scores / positive comments) |

## Common Workflows

### Pull recent survey trend

1. Call `crewhu_surveys_list` with a wide enough window (90 days
   minimum).
2. Bucket results by week and compute average score and response count.
3. Surface the trend line, not just the latest week — single weeks are
   noisy.

### Detractor follow-up queue

1. Call `crewhu_surveys_detractors` to get the negative responses.
2. For each, call `crewhu_surveys_get` to retrieve the full comment
   and the responsible technician (the responses include user
   attribution — cross-reference with `crewhu_users_get`).
3. Produce a follow-up list: customer, ticket, tech, score, comment,
   suggested action (call-back, account-manager hand-off, escalation).

### Promoter recognition loop

1. Call `crewhu_surveys_promoters` to find positive responses.
2. Use the responsible tech to drive a recognition workflow:
   - `crewhu_badges_user_recognition` to see whether the tech is
     already trending in recognition.
   - Consider awarding a badge via the `badges` domain (see
     `crewhu_badges_history_list`).

### Per-user roll-up

1. Use `crewhu_users_list` to enumerate techs.
2. For each tech, use `crewhu_surveys_search` (keyed on the user) to
   pull their responses.
3. Compute average score, response count, and detractor rate per tech
   for a manager scorecard.

## Edge Cases

- **Sparse responses** — Some techs have few surveys; flag any
  per-user metrics with N < 10 as low-confidence rather than ranking.
- **Comment-only feedback** — Some responses have a comment without a
  score. Surface those separately; do not coerce them into the score
  average.
- **Time zones** — Survey timestamps are in the tenant's configured
  zone; normalize before comparing across tenants.

## Best Practices

- Always show denominators (response count) alongside averages.
- Pair detractor lists with promoter lists in a manager dashboard so
  the picture is balanced.
- Capture the tech for every response in your output so action items
  are unambiguous.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Auth and pagination
