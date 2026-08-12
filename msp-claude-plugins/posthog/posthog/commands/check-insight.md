---
description: Look up a PostHog insight by ID or name and report its current result
argument-hint: "<insight>"
arguments: [insight]
---

# Check PostHog Insight

Look up a saved PostHog insight and report its current computed result.

## Arguments

- `insight` (required) — Insight ID or name to look up

## Prerequisites

- PostHog connected in Conduit with a personal API key scoped at least to
  `insight:read`

## Steps

1. If `insight` looks like an ID, retrieve it directly; otherwise search
   dashboards and insights by name first (see
   `skills/insights-and-dashboards/SKILL.md` for the confirmed read tool
   family — insight run/read)
2. Run or retrieve the insight's current result
3. Report the result with its "as of" / computed timestamp — insight
   results can be served from cache, so surface the timestamp rather than
   implying the number is live right now
4. If nothing matches, say so plainly rather than guessing at a similarly
   named insight

## Examples

### Look up by name

```
/check-insight "Weekly Active Users"
```

### Look up by ID

```
/check-insight 48213
```

## Error Handling

| Error | Resolution |
|-------|------------|
| 404 Not Found | The insight doesn't exist in this project, or the name doesn't match anything — confirm spelling or list dashboards to find it |
| 403 Forbidden | The connected key isn't scoped for `insight:read`, or belongs to the wrong PostHog organization |
| 429 Rate Limited | Back off and retry — see `skills/api-patterns/SKILL.md` |

## Related Commands

- `/list-dashboards` — Find which dashboard an insight lives on
