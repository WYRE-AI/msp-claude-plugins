---
description: List PostHog early-access feature flags and their current status
argument-hint: "[query]"
arguments: [query]
---

# List PostHog Feature Flags

List early-access feature flags in the connected PostHog project, with an
optional name filter.

## Arguments

- `query` (optional) — Filter by feature name; omit to list all

## Prerequisites

- PostHog connected in Conduit with a personal API key scoped at least to
  `feature_flag:read`

## Steps

1. Call `early-access-feature-list`, filtering by `query` if provided
2. For each match, call `early-access-feature-retrieve` if targeting or
   status detail is needed beyond the list view
3. Report name, status, and targeting/rollout summary for each result
4. This command is read-only — it never calls `early-access-feature-create`,
   `early-access-feature-destroy`, or `early-access-feature-partial-update`.
   If the user asks to change a flag's status, say that this plugin can't do
   that and point to `GOVERNANCE.md` for why

## Examples

### List all early-access features

```
/list-feature-flags
```

### Filter by name

```
/list-feature-flags "dark mode"
```

## Error Handling

| Error | Resolution |
|-------|------------|
| 403 Forbidden | The connected key isn't scoped for `feature_flag:read` |
| 404 Not Found | No feature matches the given query — confirm spelling or list without a filter |
| 429 Rate Limited | Back off and retry — see `skills/api-patterns/SKILL.md` |

## Related Commands

- `/check-insight` — Look up the metric an experiment is measuring
