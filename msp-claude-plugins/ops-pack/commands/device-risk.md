---
description: Weekly device failure early-warning sweep with one draft proactive ticket per client
argument-hint: "[client]"
arguments: [client]
---

# Device Risk

Flags devices likely to fail in the next 2-4 weeks from 30-90 days of RMM
telemetry, using the `device-failure-early-warning` skill. Read-only.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one RMM connector.
  A PSA is optional and only needed if the user approves ticket creation.

## Steps

1. Call `conduit__search_tools` to find connected RMMs and the telemetry each exposes.
2. Resolve scope: `client` if given, otherwise every client.
3. Follow the `device-failure-early-warning` skill's weekly sweep workflow.
4. Return the ranked list and one draft ticket per client.
5. Create tickets only after the user approves them.

## Examples

```
/ops-pack:device-risk
/ops-pack:device-risk "Acme Co"
```
