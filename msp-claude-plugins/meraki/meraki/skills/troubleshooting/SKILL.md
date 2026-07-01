---
name: "Meraki Troubleshooting"
description: >
  Use this skill for hands-on Cisco Meraki troubleshooting -- running
  live tools (ping, cable test, throughput, wake-on-LAN) via
  meraki_raw_request, rebooting devices, and checking uplink/connectivity
  status. Explains that live tools ride the meraki_raw_request passthrough
  because they are not curated tools.
when_to_use: "When troubleshooting Meraki connectivity -- running live tools like ping and cable test via raw_request, rebooting devices, and checking uplinks"
triggers:
  - meraki troubleshoot
  - meraki ping
  - cable test
  - meraki live tools
  - meraki throughput
  - device unreachable
  - meraki connectivity
  - wan down
  - packet loss
  - port not working
---

# Meraki Troubleshooting & Live Tools

## Overview

Meraki's **live tools** run diagnostics on demand from a device against a target -- ping, cable test, throughput test, wake-on-LAN, ARP table, and more. These are **not curated MCP tools**; they ride the `meraki_raw_request` passthrough because they map to dozens of endpoints under `/devices/{serial}/liveTools/...`. This skill covers the async live-tools pattern, plus reboots (`meraki_devices_reboot`) and uplink checks for a complete connectivity-triage toolkit.

## Why Live Tools Use `meraki_raw_request`

The 27 curated tools cover inventory, config, and status. Live tools are transient diagnostics with an async job lifecycle and a long tail of endpoint variants -- wrapping each one individually adds little value. Instead, invoke them through `meraki_raw_request`, which reaches any Dashboard API v1 path directly.

## The Async Live-Tools Pattern

Every live tool follows the same two-phase lifecycle:

1. **Create the job (POST).** Returns a `liveToolsId` (often just `id`) and a `status` of `new` or `ready`, plus a `url` to poll.
2. **Poll for results (GET).** Re-fetch the job URL until `status` is `complete` (or `failed`), then read the results block.

```
# Phase 1 -- start a ping
meraki_raw_request
  method: POST
  path: /devices/{serial}/liveTools/ping
  body: { "target": "8.8.8.8", "count": 5 }

# -> { "pingId": "abc123", "status": "ready", "url": ".../liveTools/ping/abc123" }

# Phase 2 -- poll until complete
meraki_raw_request
  method: GET
  path: /devices/{serial}/liveTools/ping/abc123
```

Poll with a short delay between attempts; most tools complete within a few seconds. Respect the ~10 req/s per-org rate limit while polling.

## Live Tool Reference

### Ping

```
POST /devices/{serial}/liveTools/ping
  body: { "target": "<ip-or-host>", "count": 5 }
GET  /devices/{serial}/liveTools/ping/{pingId}
```

Results include `sent`, `received`, `loss.percentage`, and per-`latencies` (min/avg/max). Use to confirm reachability and measure packet loss / latency from a device.

### Ping Device (from the cloud to the device)

```
POST /devices/{serial}/liveTools/pingDevice
GET  /devices/{serial}/liveTools/pingDevice/{id}
```

Pings the device itself from the Dashboard cloud -- confirms the device's own reachability.

### Cable Test (MS switch ports)

```
POST /devices/{serial}/liveTools/cableTest
  body: { "ports": ["1", "2"] }
GET  /devices/{serial}/liveTools/cableTest/{id}
```

Reports per-pair cable status (`ok`, `open`, `short`, `crosstalk`) and estimated length. Use to diagnose bad runs, patch issues, or link-down ports on MS switches.

### Throughput Test

```
POST /devices/{serial}/liveTools/throughputTest
GET  /devices/{serial}/liveTools/throughputTest/{id}
```

Measures achievable throughput from the device -- useful when a site reports "slow internet."

### Wake-on-LAN

```
POST /devices/{serial}/liveTools/wakeOnLan
  body: { "vlanId": 10, "mac": "00:11:22:33:44:55" }
```

Sends a WoL magic packet from an MX/MS to wake a downstream host.

### ARP Table / MAC Table

```
POST /devices/{serial}/liveTools/arpTable
POST /devices/{serial}/liveTools/macTable
```

Snapshot the device's current ARP or MAC address table -- helps locate where a host or MAC is connected.

## Reboots and Uplink Checks

### Reboot a Device (curated tool)

```
meraki_devices_reboot
  serial: Q2XX-XXXX-XXXX
```

A reboot is the blunt-instrument fix. Warn the user first if the target is an MX appliance or a core MS switch -- rebooting interrupts the whole site.

### Uplink Status (raw_request)

```
meraki_raw_request
  method: GET
  path: /networks/{networkId}/appliance/uplinks/statuses
```

Shows WAN1/WAN2/cellular interface state (`active`, `ready`, `failed`, `not connected`). For an org-wide view:

```
meraki_raw_request
  method: GET
  path: /organizations/{organizationId}/appliance/uplink/statuses
```

### Device Online/Offline Status (raw_request)

```
meraki_raw_request
  method: GET
  path: /organizations/{organizationId}/devices/statuses
```

## Common Troubleshooting Workflows

### "Site is down"

1. Check the MX uplink status: raw_request GET `/networks/{networkId}/appliance/uplinks/statuses`
2. If a WAN is `failed`/`not connected`, the ISP or WAN link is the issue -- escalate to the carrier
3. If uplinks look healthy, run `pingDevice` against the MX to confirm cloud reachability
4. Confirm device online/offline via the org device statuses endpoint

### "This host can't reach the internet"

1. Start a `ping` from the site's MX to `8.8.8.8` -- confirms the site's egress works
2. Ping the specific host's IP from the MX -- confirms LAN reachability
3. Snapshot the `arpTable` to verify the host is actually learned on the network
4. If the host is on a switch port, run a `cableTest` on that port

### "Switch port link keeps dropping"

1. Identify the port and switch serial
2. Run `cableTest` on the affected port(s)
3. Interpret pair results: `open`/`short` indicates a physical cabling fault; `ok` points to config or device issues
4. Cross-check the live port status via `meraki_switch_port_statuses_list`

### "Internet is slow at this site"

1. Run a `throughputTest` from the site's device
2. Compare to the ISP's provisioned bandwidth
3. Check uplink status for failover to a lower-bandwidth cellular link
4. Reboot only as a last resort, with user confirmation

## Error Handling

### Live Tool Never Completes

**Cause:** Device offline, busy, or the job genuinely `failed`
**Solution:** Confirm the device is `online` first; poll a bounded number of times; treat `failed` as a definitive result, not a retry loop

### 404 on the Job URL

**Cause:** Wrong `serial` or the job ID expired
**Solution:** Re-create the job; use the exact `url`/`id` returned by the POST

### Cable Test Returns No Data

**Cause:** The target is not an MS switch, or the port number is invalid
**Solution:** Cable test only applies to MS switch ports; verify the port exists via `meraki_switch_ports_list`

## Best Practices

- Live tools are async -- always POST then poll the returned job URL to `complete`
- Confirm the device is `online` before launching diagnostics; an offline device cannot run live tools
- Bound your polling and honor the ~10 req/s per-org rate limit
- Triage from the WAN inward: uplink status -> egress ping -> LAN ping -> port cable test
- Reserve reboots for last, and always warn before rebooting appliances or core switches
- Capture and summarize results (loss %, latency, cable pair status) rather than dumping raw JSON

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - raw_request mechanics, rate limits, pagination
- [devices](../devices/SKILL.md) - Device inventory, reboot, status
- [security-appliance](../security-appliance/SKILL.md) - MX uplinks, firewall, VPN
