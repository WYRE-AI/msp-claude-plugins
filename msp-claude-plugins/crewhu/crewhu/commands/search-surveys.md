---
description: Search recent Crewhu surveys, surfacing detractors and promoters
argument-hint: "[query]"
arguments: [query]
---

# Crewhu Survey Search

Search Crewhu CSAT/NPS responses, then break the result into detractors and promoters so a manager has actionable follow-ups.

## Arguments

- `query` (optional) — Optional keyword to filter survey responses

## Prerequisites

- Crewhu MCP server connected with a valid `X_CREWHU_APITOKEN`
- Tools available: `crewhu_surveys_search`, `crewhu_surveys_detractors`, `crewhu_surveys_promoters`

## Steps

1. **Search responses**

   Call `crewhu_surveys_search` with `query` if provided. Otherwise call `crewhu_surveys_list` for a recent window.

2. **Pull detractors**

   Call `crewhu_surveys_detractors` to get the negative end of the curve.

3. **Pull promoters**

   Call `crewhu_surveys_promoters` to get the positive end.

4. **Summarize**

   Output a short report:
   - Total responses in window, average score, response count
   - Top 5 detractors (score, customer, tech, comment) with suggested follow-up action
   - Top 5 promoters (score, customer, tech, comment) for recognition

## Examples

### Recent surveys, all topics
```
/search-surveys
```

### Filter by keyword
```
/search-surveys "outage"
```

## Related Commands

- (none yet)
