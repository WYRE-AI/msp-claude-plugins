---
name: "Blackpoint Cyber API Patterns"
description: >
  Blackpoint Cyber (CompassOne) MCP fundamentals: API-token header auth
  and its internal Bearer forwarding, the partner-tenant-asset
  hierarchy, navigation tools, which tool domains are functional versus
  stubbed, pagination, and HTTP error causes.
when_to_use: >-
  When working with Blackpoint Cyber / CompassOne authentication, partner-tenant-asset hierarchy,
  or pagination through detections and vulnerabilities. Use when: blackpoint api, blackpoint
  authentication, blackpoint mcp, compassone api, compassone authentication, blackpoint tenant, or
  blackpoint asset.
---

# Blackpoint Cyber (CompassOne) MCP Tools & API Patterns

## Overview

Blackpoint Cyber is a managed detection and response (MDR) provider.
The CompassOne portal exposes a partner-tenant-asset hierarchy: a
partner (the MSP) sees many tenants (their customers), each tenant has
many assets (endpoints, identities, cloud accounts), and detections /
vulnerabilities are produced against those assets.

## Connection & Authentication

Blackpoint uses an API token passed via header. CompassOne issues the
token in the partner portal.

| Header | Value |
|--------|-------|
| `X-Blackpoint-Api-Token` | The raw CompassOne token |

The gateway maps the environment variable `BLACKPOINT_API_TOKEN` onto
the `X-Blackpoint-Api-Token` header automatically. Internally, the
Blackpoint MCP server forwards this to CompassOne as a `Bearer` token —
you do not need to add the `Bearer ` prefix yourself.

```bash
export BLACKPOINT_API_TOKEN="your-compassone-token"
```

Optional: `BLACKPOINT_BASE_URL` overrides the CompassOne base URL for
regional or partner-specific deployments.

## Hierarchy

```
Partner (MSP)
  └── Tenant (customer)
        └── Asset (endpoint / identity / cloud account)
              └── Detections / Vulnerabilities
```

Always pivot top-down: identify the tenant first, then drill into
assets, then look at detections/vulnerabilities for that asset.

## Navigation Tools

| Tool | Purpose |
|------|---------|
| `blackpoint_navigate` | Discover available domains |
| `blackpoint_back` | Pop back to the prior context |
| `blackpoint_status` | Health/status check |

## Functional Tool Surface (today)

Tools follow `blackpoint_<domain>_<action>`. Currently functional
domains:

- `tenants`
- `assets`
- `detections`
- `vulnerabilities`

Additional domains (alerts, cloud security, notifications, partners,
threat intel, tickets) are stubbed in the MCP server but not yet
implemented — do not call those.

## Pagination

Blackpoint list endpoints use page/limit-style pagination. Always
check whether more pages exist before claiming a result is complete,
especially for `detections` and `vulnerabilities` — those can run
into the thousands.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Bad/missing Bearer token | Re-check `BLACKPOINT_API_TOKEN` |
| 403 | Token valid but no access to the requested tenant | Check partner-tenant scoping |
| 404 | Unknown tenant / asset / detection | Re-list to confirm |
| 429 | Rate limit | Back off and retry |

## Best Practices

- For incident-response work, always list the affected tenant's
  assets and detections together — a detection without its asset
  context is hard to action.
- For multi-tenant rollups (partner view), iterate
  `blackpoint_tenants_list` first and then drill in per-tenant.
- The current tool surface is read-only — there are no write tools
  yet. Any "respond to detection" workflow must happen in the
  CompassOne portal itself.

## Related Skills

- [incident-response](../incident-response/SKILL.md) - Primary investigation skill
