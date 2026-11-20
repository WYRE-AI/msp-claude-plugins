---
description: Find recurring problems across 90 days of closed and open tickets and draft one problem ticket per pattern
argument-hint: "[client]"
arguments: [client]
---

# Repeat Tickets

Groups the last 90 days of PSA tickets, closed ones included, by device, user
and issue type to find problems that keep returning, using the
`repeat-ticket-root-cause` skill. Read-only.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with a PSA connector. Without a PSA
  there is no ticket history to analyze.

## Steps

1. Call `conduit__search_tools` to find the connected PSA and its ticket tools.
2. Resolve scope: `client` if given, otherwise every client, one client at a
   time.
3. Follow the `repeat-ticket-root-cause` skill's weekly sweep workflow.
4. Return the ranked patterns per client with a draft problem ticket for each.
5. Create problem tickets only after the user approves them.

## Examples

```
/ops-pack:repeat-tickets
/ops-pack:repeat-tickets "Acme Co"
```
