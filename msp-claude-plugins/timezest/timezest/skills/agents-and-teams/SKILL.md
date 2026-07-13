---
name: "TimeZest Agents & Teams"
when_to_use: >-
  When resolving which technician or team to book in TimeZest — listing agents, listing teams, and
  choosing between an individual agent and a round-robin team for a scheduling request. Use when:
  timezest agents, timezest teams, list technicians, which tech is available, timezest round
  robin, resolve technician, book a team, or timezest agent lookup.
description: >
  Use this skill to resolve the right bookable resource in TimeZest
  before creating a scheduling request — listing agents (individual
  technicians) and teams (round-robin / shared availability pools),
  fetching detail for a named resource, and deciding when to book an
  agent versus a team.
---

# TimeZest Agents & Teams

Every TimeZest scheduling request books against a resource — either an
individual agent or a team. Picking the right one is the first step of
any booking, and TimeZest treats agents and teams differently enough
that the choice matters.

## Domains & Tools

TimeZest's MCP server is navigation-based. Enter a domain with
`timezest_navigate` before its tools are available; return with
`timezest_back`.

### Agents — individual technicians

| Tool | Purpose |
|------|---------|
| `timezest_agents_list` | List all agents (technicians) available for scheduling |
| `timezest_agents_get` | Get full detail for one agent by `agentId` |

`timezest_agents_list` accepts `pageSize` (1–100, default 50) and a
`filter` TQL string (e.g. `active:true AND department:"IT Support"`).

### Teams — round-robin / shared pools

| Tool | Purpose |
|------|---------|
| `timezest_teams_list` | List all teams available for scheduling |
| `timezest_teams_get` | Get full detail for one team by `teamId` |

`timezest_teams_list` accepts `pageSize` and a `filter` TQL string
(e.g. `active:true`).

## Agent vs Team — which to book

| Situation | Book |
|-----------|------|
| The dispatcher named a specific technician | An **agent** |
| The customer needs the soonest slot from any qualified tech | A **team** (round-robin) |
| Work requires a named specialist (e.g. a security lead) | An **agent** |
| Tier-1 / general support where any tech will do | A **team** |

A team request shows the customer combined availability across the
team's members and lets TimeZest assign whoever the round-robin lands
on. An agent request shows only that one technician's calendar.

## Common Workflows

### Resolve a technician by name

1. `timezest_navigate` to `agents`.
2. Call `timezest_agents_list`. Use a `filter` like `active:true` to
   skip deactivated technicians.
3. Match the dispatcher's name against the result. If two agents have
   similar names, call `timezest_agents_get` on each to disambiguate.
4. Carry the resolved `agentId` forward to the scheduling request.

### Resolve a team

1. `timezest_navigate` to `teams`.
2. Call `timezest_teams_list` with `active:true`.
3. Match by team name (e.g. "Network", "Onsite Dispatch").
4. Carry the resolved `teamId` forward.

## Edge Cases

- **Inactive resources** — `timezest_agents_list` and
  `timezest_teams_list` can return deactivated entries. Always filter
  `active:true` unless you specifically need historical resources.
- **Name collisions** — Two technicians named "Chris" is common. Never
  pick the first match; confirm with `_get`.
- **Pagination** — Large MSPs exceed the 50-row default. Raise
  `pageSize` to 100 or page through before assuming a name is absent.

## Best Practices

- Always resolve agents and teams by name through a `list` call in the
  current session — do not hard-code or cache IDs across days.
- Prefer a team for "soonest available" requests; an agent only when a
  named person is genuinely required.
- Confirm ambiguous matches with `_get` before booking.

## Related Skills

- [scheduling](../scheduling/SKILL.md) — Booking technicians against PSA tickets
- [resources](../resources/SKILL.md) — Querying agents and teams together as one pool
- [appointment-types](../appointment-types/SKILL.md) — Choosing the right appointment type
