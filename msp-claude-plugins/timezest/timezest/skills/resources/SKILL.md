---
name: "TimeZest Resources"
description: >
  TimeZest's combined resource pool — the unified list of agents and teams
  available for scheduling — including filtering by resource type and
  surveying what is bookable before drilling into a specific agent or team.
when_to_use: >-
  When you need the combined pool of TimeZest bookable resources, or the dispatcher has not
  named a specific resource. Use when: timezest resources, list all resources, what can i book,
  timezest resource pool, all agents and teams, or timezest availability survey.
---

# TimeZest Resources

The `resources` domain is TimeZest's combined view of everything
bookable — agents and teams together in one list. It is the right
starting point when a dispatcher has not named a specific technician
or team and you need to survey the pool first.

## Anti-triggers

A TimeZest resource is always a **person or a pool of people**. Every
other plugin means something else by the word:

- **A room or equipment mailbox** — meeting rooms and projectors are
  Exchange resource mailboxes, and TimeZest does not list them; use
  `m365-calendar`.
- **A PSA resource** — in Autotask a "resource" is an employee record
  carrying rates, hours, and permissions; use the `autotask` plugin.
- **An Azure resource** — VMs, storage accounts, resource groups; use
  `azure-mcp` or the `cloudops-pack`.
- **A managed device or configuration item** — use the RMM
  (`kaseya/datto-rmm`, `ncentral`, `ninjaone`) or
  `kaseya/it-glue`.

## Domain & Tools

Enter the domain with `timezest_navigate` to `resources`.

| Tool | Purpose |
|------|---------|
| `timezest_resources_list` | List all resources (agents and teams) available for scheduling |

`timezest_resources_list` accepts:

- `pageSize` — results per page (1–100, default 50)
- `type` — `agent` or `team` to filter by resource type
- `filter` — a TQL filter string (e.g. `active:true`)

Each resource entry indicates whether it is an agent or a team, so a
single call surveys the whole bookable surface.

## Resources vs Agents/Teams Domains

| Use the `resources` domain when | Use `agents` / `teams` when |
|---------------------------------|------------------------------|
| You want a combined survey of everything bookable | You already know it is an agent or a team |
| The dispatcher said "whoever's available" | The dispatcher named a person or team |
| Producing a roster or capacity report | Fetching detail for one named resource |

`timezest_resources_list` is list-only — it has no companion `_get`
tool. To fetch full detail for one resource, drop into the `agents` or
`teams` domain and use its `_get` tool.

## Common Workflows

### Survey the bookable pool

1. `timezest_navigate` to `resources`.
2. Call `timezest_resources_list` with `filter: "active:true"`.
3. Group the result by `type` (agents vs teams) to give the dispatcher
   the full menu.

### Resolve a vague request

1. List resources with `active:true`.
2. Narrow with `type: "agent"` or `type: "team"` if the dispatcher
   leaned one way.
3. Once a candidate is chosen, switch to the `agents` or `teams`
   domain for full detail before booking.

### Build a resource roster

1. List with `pageSize: 100` to capture the full pool.
2. Report a roster: each resource's name, type, and active status.

## Edge Cases

- **List-only domain** — There is no get-by-id here; use `agents` or
  `teams` for detail.
- **Mixed types** — A single result set contains both agents and
  teams; always check the `type` of each entry before treating it as
  one or the other.
- **Pagination** — Large MSPs exceed 50 resources; raise `pageSize` or
  page through for a complete roster.

## Best Practices

- Use `resources` for surveys and rosters; use `agents` / `teams` for
  named lookups and detail.
- Always filter `active:true` for booking work — inactive resources
  cannot be scheduled.
- Treat the resource list as the menu, not the booking target — the
  actual scheduling request still books a specific `agentId` or
  `teamId`.

## Related Skills

- [agents-and-teams](../agents-and-teams/SKILL.md) — Detail lookups for a named agent or team
- [scheduling](../scheduling/SKILL.md) — Booking technicians against PSA tickets
