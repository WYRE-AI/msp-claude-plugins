---
name: "Domotz API Patterns"
description: >
  Domotz API and MCP fundamentals: X-Api-Key header authentication, the
  region-selected base URL (us-east-1 / eu-central-1), the full 21-tool MCP
  catalog by domain, the agent-scoped call shape, why there are no pagination
  arguments, rate limiting, and HTTP error codes.
when_to_use: >-
  When authenticating to or calling the Domotz API directly or through the MCP
  tools, or when discovering which Domotz tool to use. Use when: domotz api, domotz authentication, domotz
  pagination, domotz rate limit, domotz mcp, domotz tools, domotz request, domotz error, domotz
  connection, or domotz region.
---

# Domotz MCP Tools & API Patterns

## Overview

The Domotz MCP server wraps the Domotz Public API v1 for network monitoring
and management. It registers 21 tools covering agents (collectors), devices,
SNMP metrics, network topology, alert profiles, and PDU power control.
Twenty of them are `GET` requests; one — `domotz_power_outlet_control` —
switches mains power.

## Connection & Authentication

### API Key Authentication

Domotz authenticates with a single HTTP header:

| Header | Value |
|--------|-------|
| `X-Api-Key` | Your Domotz API key |

There is no region header. **Region selects the base URL host**, not a
header value:

```
https://api-{region}-cell-1.domotz.com/public-api/v1
```

Generate credentials at: **Domotz Portal > User Menu > API Keys**

**Environment Variables (self-hosted / stdio mode):**

```bash
export DOMOTZ_API_KEY="your-api-key"
export DOMOTZ_REGION="us-east-1"   # default when unset
```

Through the WYRE Conduit gateway you set neither — Conduit holds the key
and injects both per request. See `GOVERNANCE.md`.

> **IMPORTANT:** Never hardcode credentials.

### Regional Endpoints

| Region | Base URL |
|--------|----------|
| `us-east-1` (default) | `https://api-us-east-1-cell-1.domotz.com/public-api/v1` |
| `eu-central-1` | `https://api-eu-central-1-cell-1.domotz.com/public-api/v1` |

A credential issued for one region cannot see the other's data. A region
mismatch surfaces as an authentication error, not an empty result.

## The call shape: everything is agent-scoped

There is no account-wide query except `domotz_agents_list`. Every device,
metric, network, and power tool requires an `agent_id`, and most also
require a `device_id`. A fleet-wide answer means iterating agents
explicitly — list agents, then loop. Omitting `agent_id` does not widen
the query; it fails.

All IDs are **numbers**, not strings.

## Available MCP Tools

### Navigation

| Tool | Description |
|------|-------------|
| `domotz_navigate` | Move to a domain (`agents`, `devices`, `metrics`, `network`, `alerts`, `power`) |
| `domotz_status` | Check the server's Domotz connection and list available domains |
| `domotz_back` | Return to the domain menu |

`domotz_status` reports the *server's* credential and connectivity state.
It says nothing about whether a given collector is online — that is the
`status` field on `domotz_agents_get`.

Through Conduit, `domotz_navigate` and `domotz_back` are refused for every
caller at every tier and never appear in the tool list. Use
`conduit__my_access` to discover what you can call. Direct/self-hosted
callers see all three.

### Agents

| Tool | Arguments |
|------|-----------|
| `domotz_agents_list` | *(none)* — every agent on the account |
| `domotz_agents_get` | `agent_id` |

### Devices

| Tool | Arguments |
|------|-----------|
| `domotz_devices_list` | `agent_id` |
| `domotz_devices_get` | `agent_id`, `device_id` |
| `domotz_devices_uptime` | `agent_id`, `device_id` |
| `domotz_devices_history` | `agent_id`, `device_id` |
| `domotz_devices_inventory` | `agent_id`, `device_id` |

There is no device search tool. Matching by name, IP, or MAC is done
client-side over the `domotz_devices_list` result.

### Metrics (SNMP)

| Tool | Arguments |
|------|-----------|
| `domotz_metrics_variables_list` | `agent_id`, `device_id` |
| `domotz_metrics_variable_history` | `agent_id`, `device_id`, `variable_id` |
| `domotz_metrics_snmp_sensors_list` | `agent_id`, `device_id` |
| `domotz_metrics_sensor_history` | `agent_id`, `device_id`, `sensor_id` |

Variables are the metrics Domotz polls by default; sensors are custom
SNMP sensors configured on the device. They are separate lists with
separate history endpoints.

### Network

| Tool | Arguments |
|------|-----------|
| `domotz_network_topology` | `agent_id` |
| `domotz_network_interfaces` | `agent_id` |
| `domotz_network_ip_conflicts` | `agent_id` |

`domotz_network_interfaces` returns the *collector's* own network
interfaces. It is not a per-device port or interface list.

### Alerts

| Tool | Arguments |
|------|-----------|
| `domotz_alerts_profiles_list` | *(none)* — every alert profile on the account |
| `domotz_alerts_device_list` | `agent_id`, `device_id` |

Both describe alert *configuration*. Neither returns a fired alert — see
the `alerts` skill.

### Power

| Tool | Arguments |
|------|-----------|
| `domotz_power_outlets_list` | `agent_id`, `device_id` |
| `domotz_power_outlet_control` | `agent_id`, `device_id`, `outlet_id`, `action` (`on`/`off`/`cycle`), `confirm` |

`domotz_power_outlet_control` is the only tool here that changes anything,
and what it changes is mains power. Read the `power` skill before calling
it.

## Pagination

**No Domotz MCP tool accepts a page, page_size, offset, or limit
argument.** Each list tool returns its full result set in one response.

The practical consequence is the opposite of a pagination loop: a large
site returns its entire device census in a single payload, so scope by
`agent_id` and expect big responses rather than many small ones. If you
need a subset, filter the returned array — do not look for a filter
argument that does not exist.

## Rate Limiting

Domotz enforces API rate limits per API key.

- HTTP 429 indicates the limit was exceeded
- Back off exponentially before retrying
- The main way to reduce call volume is to avoid fanning out over every
  agent when one `agent_id` would do — there are no batch arguments

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Check API key; verify region matches account |
| 403 | Forbidden | Insufficient permissions for this resource |
| 404 | Not Found | Resource doesn't exist, or the ID belongs to a different agent |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry; contact support if persistent |

The server surfaces failures as `Domotz API error <status>: <body>`; the
upstream body is passed through unmodified.

A denial through Conduit looks different from a Domotz error — most Domotz
tools are unclassified and therefore require `admin`. Check
`conduit__my_access` before treating a refusal as a credential problem.

## Best Practices

- Scope by `agent_id`; fan out over agents only when the question really
  is fleet-wide
- Cache agent and device lists — they change slowly and every other call
  needs their IDs
- Check the agent's own status before trusting device status; a dead
  collector serves last-known data that reads as current
- Monitor `last_seen` timestamps to detect offline agents and devices

## Related Skills

- [agents](../agents/SKILL.md) - Agent and site management
- [devices](../devices/SKILL.md) - Device inventory and discovery
- [alerts](../alerts/SKILL.md) - Alert profiles and device bindings
- [network](../network/SKILL.md) - Topology, interfaces, and SNMP metrics
- [power](../power/SKILL.md) - PDU outlet control
