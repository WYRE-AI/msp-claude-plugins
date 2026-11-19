---
description: Weekly per-client health roll-up with trend, top fixes, QBR talking points and unbilled-time flag
argument-hint: "[client]"
arguments: [client]
---

# Client Health

Weekly roll-up across the managed portfolio, or one client, using the
`client-health-score` skill. Read-only; outputs a digest and draft actions only.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`). A PSA gives repeat-ticket and
  unbilled-time results; RMM, backup and distributor tools add the other
  dimensions. Dimensions without data are shown as "not assessed".

## Steps

1. Call `conduit__search_tools` to find which PSA, RMM, backup, security and
   billing connectors are live.
2. Resolve scope: `client` if given, otherwise every client.
3. Follow the `client-health-score` skill's weekly digest workflow.
4. Return the ranked digest. If a client was given, add QBR talking points.
5. Stop before creating any ticket; ask the user which drafts to submit.

## Examples

```
/ops-pack:client-health
/ops-pack:client-health "Acme Co"
```
