---
name: "Meraki API Patterns"
description: >
  Cisco Meraki MCP fundamentals: the full tool catalog, gateway header
  authentication, Dashboard API v1 structure, Link-header cursor
  pagination, per-org rate limiting, the read-only /
  confirm_destructive_action safety model, the meraki_raw_request escape
  hatch, and error handling.
when_to_use: >-
  When authenticating to Meraki, navigating its MCP tool catalog, paging results, reaching for
  the raw-request passthrough, or interpreting a Dashboard API error. Use when: meraki api,
  meraki authentication, meraki pagination, meraki rate limit, meraki mcp, meraki tools, meraki
  raw request, meraki error, meraki read only, or dashboard api.
---

# Meraki MCP Tools & API Patterns

## Overview

The Cisco Meraki MCP server provides AI tool integration with the Meraki cloud-managed networking platform via the **Dashboard API v1**. It exposes 27 tools spanning organizations, networks, devices, clients, wireless (MR), switching (MS), and the security appliance (MX), plus a `meraki_raw_request` passthrough that reaches any Dashboard API v1 endpoint. Meraki models everything as **organizations -> networks -> devices**, where a device is identified by its immutable serial number (e.g. `Q2XX-XXXX-XXXX`).

## Connection & Authentication

### Conduit Authentication

Through Conduit, the `meraki` connector is **Cisco's hosted Meraki MCP server** (`https://mcp.meraki.com/mcp`), not a WYRE sidecar. Connect it once in the Conduit web UI with a single field:

| Conduit field | Required | Description |
|---------------|----------|-------------|
| API Key | Yes | Your Meraki Dashboard API key |

Conduit stores the key and sends it upstream as `Authorization: Bearer <key>`. There are no client-side headers or environment variables, and there is **no default-organization field**: pass the organization explicitly on every call.

Cisco's hosted connection is in beta, read-only, and works with Meraki.com dashboards only. Create the key from a read-only dashboard admin, and note that organization IP restrictions are not enforced on Cisco's hosted MCP; organizations that require IP allowlisting should not use this connection.

Generate credentials at: **Meraki Dashboard > Organization > API & Webhooks**. The key inherits the permissions of the Dashboard account that generated it, so prefer a least-privilege, read-only admin.

> The tool tables below describe WYRE's self-hosted `meraki-mcp` server (environment variables `MERAKI_API_KEY`, `MERAKI_ORG_ID` and `MERAKI_BASE_URL` apply only there). Cisco's hosted server, which Conduit brokers, publishes its own tool surface; check `tools/list` on the connector before relying on a tool name from these tables.

### Regional Clouds

Meraki operates isolated regional clouds. Override `MERAKI_BASE_URL` to target a non-global cloud:

| Cloud | Base URL |
|-------|----------|
| Global (default) | `https://api.meraki.com/api/v1` |
| China | `https://api.meraki.cn/api/v1` |

Keys are not shared across clouds. Using the wrong base URL returns authentication errors or empty results.

## Available MCP Tools

The server exposes exactly 27 tools, grouped by domain.

### Navigation

| Tool | Description |
|------|-------------|
| `meraki_navigate` | Discover available tool domains and entry points |
| `meraki_status` | Check MCP server / API connectivity and credential validity |

### Organizations

| Tool | Description |
|------|-------------|
| `meraki_organizations_list` | List organizations the API key can access |
| `meraki_organizations_get` | Get details for a specific organization |
| `meraki_organizations_inventory_list` | List device inventory (claimed, unassigned, licensed) for an org |

### Networks

| Tool | Description |
|------|-------------|
| `meraki_networks_list` | List networks in an organization |
| `meraki_networks_get` | Get details for a specific network |
| `meraki_networks_update` | Update network attributes (name, tags, timezone) |
| `meraki_networks_delete` | Delete a network (**destructive** -- requires `confirm_destructive_action=true`) |

### Devices

| Tool | Description |
|------|-------------|
| `meraki_devices_list` | List devices in a network |
| `meraki_devices_get` | Get a device by serial number |
| `meraki_devices_reboot` | Reboot a device by serial |
| `meraki_devices_remove` | Remove a device from a network (**destructive** -- requires `confirm_destructive_action=true`) |

### Clients

| Tool | Description |
|------|-------------|
| `meraki_clients_list` | List clients seen on a network |
| `meraki_clients_get` | Get a client by ID/MAC |
| `meraki_clients_get_policy` | Get a client's network access policy |
| `meraki_clients_update_policy` | Set a client's policy (allowed / blocked / group policy) |

### Wireless (MR)

| Tool | Description |
|------|-------------|
| `meraki_wireless_ssids_list` | List SSIDs for a wireless network |
| `meraki_wireless_ssids_update` | Update an SSID (auth mode, encryption, VLAN) -- high-impact |
| `meraki_wireless_rf_profiles_list` | List RF profiles for a wireless network |

### Switching (MS)

| Tool | Description |
|------|-------------|
| `meraki_switch_ports_list` | List configured switch ports for a switch (by serial) |
| `meraki_switch_ports_update` | Update a switch port (VLAN, type, PoE, enabled) |
| `meraki_switch_port_statuses_list` | List live port statuses (link, speed, usage, errors) |

### Security Appliance (MX)

| Tool | Description |
|------|-------------|
| `meraki_appliance_firewall_l3_get` | Get L3 outbound firewall rules for a network |
| `meraki_appliance_firewall_l3_update` | Replace the L3 firewall ruleset -- high-impact |
| `meraki_appliance_vpn_status_get` | Get site-to-site VPN status for the appliance |

### Long-Tail Passthrough

| Tool | Description |
|------|-------------|
| `meraki_raw_request` | Reach **any** Dashboard API v1 endpoint not covered by a curated tool |

`meraki_raw_request` is the escape hatch for the hundreds of Dashboard API v1 endpoints the curated tools do not wrap -- live tools (ping, cable test, throughput), sensor readings (MT), camera endpoints (MV), licensing, alerts/uplink history, traffic analytics, and more. See "The Raw Request Escape Hatch" below.

## Pagination

Meraki uses **Link-header cursor pagination**, not offset/page numbers.

- Pass `perPage` to control page size (endpoint-specific max, commonly 1000)
- The response `Link` header contains `rel="next"` / `rel="prev"` URLs carrying opaque `startingAfter` and `endingBefore` cursors
- To page forward, extract the `startingAfter` cursor from the `next` link and pass it on the following call
- Continue until no `rel="next"` link is present

**Example workflow:**

1. Call a list tool (or `meraki_raw_request`) with `perPage=1000`
2. Inspect the `Link` header for a `rel="next"` cursor
3. Re-call with `startingAfter=<cursor>` until the `next` link disappears
4. Never rely on page numbers -- cursors are opaque and must be passed through verbatim

## Rate Limiting

Meraki enforces a **~10 requests/second per-organization** limit (shared across all callers using that org).

- HTTP 429 responses include a `Retry-After` header (seconds) -- honor it exactly
- Use exponential backoff on repeated 429s
- Prefer organization-wide aggregate endpoints (e.g. org device statuses) over looping per-device
- Increase `perPage` to reduce the number of round-trips
- Serialize bulk operations; do not fan out concurrent writes against a single org

## Read-Only Mode & Destructive Actions

The MCP server defaults to `READ_ONLY_MODE=true`.

- **Read tools** always work.
- **Write tools** (`meraki_networks_update`, `meraki_wireless_ssids_update`, `meraki_switch_ports_update`, `meraki_clients_update_policy`, `meraki_appliance_firewall_l3_update`) are exposed; whether they execute depends on server configuration.
- **Destructive tools** (`meraki_networks_delete`, `meraki_devices_remove`) always require an explicit `confirm_destructive_action=true` argument. Without it, the call is rejected.

**Convention:** Always read and present the current state (e.g. current firewall rules, current SSID config) before proposing a write, and require explicit user confirmation before setting `confirm_destructive_action=true`.

## The Raw Request Escape Hatch

`meraki_raw_request` reaches any Dashboard API v1 endpoint the curated tools do not cover. Provide:

- `method` -- `GET`, `POST`, `PUT`, or `DELETE`
- `path` -- the API path relative to the v1 base (e.g. `/networks/{networkId}/appliance/uplinks/statuses`)
- `body` -- request payload for POST/PUT (optional)

**Common uses:**

| Goal | Method + path |
|------|---------------|
| Trigger a ping live tool | `POST /devices/{serial}/liveTools/ping` |
| Trigger a cable test | `POST /devices/{serial}/liveTools/cableTest` |
| Read appliance uplink status | `GET /networks/{networkId}/appliance/uplinks/statuses` |
| Org-wide device statuses | `GET /organizations/{organizationId}/devices/statuses` |
| Sensor (MT) readings | `GET /organizations/{organizationId}/sensor/readings/latest` |
| Camera (MV) snapshot | `POST /devices/{serial}/camera/generateSnapshot` |
| Licensing overview | `GET /organizations/{organizationId}/licenses/overview` |

Live tools are asynchronous: the initial `POST` returns a job ID and status URL; poll the corresponding `GET .../liveTools/ping/{id}` until `status` is `complete`.

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 400 | Bad Request | Malformed body or invalid parameter -- check the endpoint schema |
| 401 | Unauthorized | Invalid/revoked API key; API access not enabled for the org |
| 403 | Forbidden | Account lacks access to this org/network/resource; needs higher admin role |
| 404 | Not Found | Wrong serial, network ID, or org ID; resource does not exist |
| 429 | Rate Limited | Exceeded ~10 req/s per org -- wait `Retry-After` seconds and retry |
| 5xx | Server Error | Transient Meraki cloud issue -- retry with backoff; check status.meraki.com |

### Error Response Format

```json
{
  "errors": [
    "Invalid API key"
  ]
}
```

Meraki returns errors as an `errors` array of human-readable strings.

## Best Practices

- Resolve the hierarchy top-down: `meraki_organizations_list` -> `meraki_networks_list` -> `meraki_devices_list`
- Identify devices by **serial**, never by name -- names are mutable and non-unique
- Set a default `MERAKI_ORG_ID` when you manage a single org to skip the selection step
- Always page with cursors (`startingAfter`) via the `Link` header; never assume all results fit in one page
- Honor `Retry-After` on 429 and keep to the ~10 req/s per-org budget
- Read current state before any write; require explicit confirmation before destructive actions
- Reach for `meraki_raw_request` for live tools, sensors, cameras, licensing, and uplink history -- these are not curated tools
- Prefer org-wide aggregate endpoints over per-device loops to conserve the rate budget

## Related Skills

- [devices](../devices/SKILL.md) - Device inventory and lifecycle
- [troubleshooting](../troubleshooting/SKILL.md) - Live-tools workflows via raw_request
- [security-appliance](../security-appliance/SKILL.md) - MX firewall and VPN
