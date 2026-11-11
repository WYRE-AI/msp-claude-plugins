---
name: "Meraki Troubleshooting"
description: >
  Read-only Cisco Meraki diagnostics through the hosted Meraki MCP: site and
  device outages from availability history and WAN uplink loss/latency,
  switch port status and error counters, LLDP/CDP topology, wireless
  connection failures and packet loss, client lookup by MAC, and "what
  changed?" from the change log and event log. Live tests are handed to a
  human in the Dashboard.
when_to_use: >-
  When diagnosing a Meraki problem -- a site or device is down, a WAN link is lossy, a switch port
  keeps dropping, Wi-Fi users cannot connect, a client cannot be found, or something broke after a
  change. Use when: meraki troubleshoot, site down, device offline, wan down, packet loss,
  latency, port not working, link flapping, crc errors, wifi not connecting, slow wifi, find
  client by mac, what changed, meraki event log, meraki ping, or cable test.
---

# Meraki Troubleshooting

## Overview

Troubleshooting through the hosted Meraki MCP is evidence-gathering: availability history, uplink loss and latency, port counters, wireless failure logs, client records, the change log and the event log. All of it is read with `execute_api`, using capability IDs found with `semantic_search`. Tool schemas and pagination are in `meraki-api-patterns`.

The hosted server cannot run live tests. Ping, traceroute, cable test, throughput test, blink LEDs, cycle port and packet capture are jobs created by write operations, which the server does not offer, and it cannot reboot anything. When the evidence points to a live test or a reboot, tell the human exactly which test to run, on which device, and where to find it in the Dashboard (see "Handing off live tests" below).

`semantic_search` may return capabilities named `getDeviceLiveTools...`. They only read back a job someone already created through the API, and need that job's ID. Do not use them to try to run a test.

## Anti-triggers

- **"Is the customer's website up?"** -- Meraki sees the network from inside the customer site. External uptime checking is `betterstack-monitors`.
- **A workstation or server problem that is not a network problem** -- use `atera-devices` or `ncentral-devices`.
- **Deciding whether a firewall rule, NAT rule or VPN policy is blocking traffic** -- use `meraki-security-appliance`.
- **Inventory, EOX or firmware questions** -- use `meraki-devices`.

## Triage Order

Work from the WAN inward: is the appliance online and its uplinks healthy, then the switch and port, then the AP and RF, then the client. A fault upstream makes everything downstream look broken, so do not diagnose an AP while its MX is offline.

## Workflow: Site Down or Device Offline

1. **Who is down.** `getOrganizationDevicesAvailabilities` with `networkIds` for the site. Everything offline points at the site's MX, WAN or power; a single device points at that device, its cable or its switch port.
2. **Since when, and is it flapping.** `getOrganizationDevicesAvailabilitiesChangeHistory` with the `serials` and a `timespan` (max 31 days). Repeated online/offline transitions suggest a flapping WAN, power or PoE budget problem rather than a dead device.
3. **WAN status.** `getOrganizationApplianceUplinkStatuses` (MX and Z) or `getOrganizationUplinksStatuses` (also covers MG cellular gateways) with `networkIds`. Each uplink reports `active`, `ready`, `failed` or `not connected`. A site running on `cellular` while WAN1 is `failed` has failed over.
4. **Loss and latency now.** `getOrganizationDevicesUplinksLossAndLatency` returns the last few minutes (the newest point is about 2 minutes old) for every MX uplink and the destination IP it probes.
5. **Loss and latency over time.** `getDeviceLossAndLatencyHistory` needs both `serial` and `ip` -- the probe destination, taken from step 4 (often `8.8.8.8`). Add `uplink` (`wan1`, `wan2`, `cellular`), a `timespan` up to 31 days and a `resolution` (60, 600, 3600 or 86400 seconds).
6. **Active alerts.** `getOrganizationAssuranceAlerts` with `networkId` shows what the Dashboard itself has raised.

```
execute_api { "capability_id": "getDeviceLossAndLatencyHistory", "parameters": { "serial": "Q2XX-XXXX-XXXX", "ip": "8.8.8.8", "uplink": "wan1", "timespan": 86400, "resolution": 600 } }
```

**Reading it.** A `failed` uplink or sustained loss on one WAN is a carrier problem: give the human the circuit, the time window and the loss figures to quote to the ISP. Loss that appears only at busy hours suggests the circuit is saturated. If the MX is online with clean uplinks but its downstream devices are offline, move to the switch.

## Workflow: Switch Port Problems

1. **Find the switch.** `getOrganizationDevices` with `productTypes: ["switch"]` and `name`, or `meraki-devices` to resolve a serial.
2. **Port state.** `getDeviceSwitchPortsStatuses` with `serial` and a `timespan` (default 1 day, max 31 days) returns per-port status, speed, duplex, errors, warnings and the CDP/LLDP neighbour.
3. **Error counters.** `getDeviceSwitchPortsStatusesPackets` with `serial` returns per-port packet counters, including CRC/alignment errors, collisions and topology changes. Its `timespan` snaps to 5 minutes, 15 minutes, 1 hour or 1 day.
4. **Across many switches.** `getOrganizationSwitchPortsStatusesBySwitch` with `networkIds`. Its `perPage` maxes out at 20 switches.
5. **What is plugged in where.** `getOrganizationSwitchPortsTopologyDiscoveryByDevice` lists the most recent LLDP/CDP neighbour per port (also `perPage` max 20). Use it to confirm an uplink lands where the diagram says, or to find which port an AP or phone is on.

```
execute_api { "capability_id": "getDeviceSwitchPortsStatusesPackets", "parameters": { "serial": "Q2XX-XXXX-XXXX", "timespan": 3600 } }
```

**Reading it.** CRC errors climbing on one port point at the physical layer: cable, patch lead, SFP or the far-end NIC. A gigabit device linking at 100 Mbps or half duplex points the same way. Frequent topology changes suggest a loop or a flapping link. Port errors with clean counters can be configuration (VLAN, PoE, port security). For a physical-layer suspicion, ask the human to run a cable test on that port.

## Workflow: Wireless Complaints

1. **Scope it.** `getOrganizationWirelessDevicesPacketLossByNetwork`, `getOrganizationWirelessDevicesPacketLossByDevice` and `getOrganizationWirelessDevicesPacketLossByClient` (default 7 days, `timespan` from 5 minutes to 90 days) show whether the problem is one site, one AP or one client.
2. **Why connections fail.** `getNetworkWirelessFailedConnections` with `networkId` and a `timespan` (max 7 days); filter with `serial` (AP), `ssid`, `band` or `clientId` (the client MAC). Each failure records the step that failed.
3. **One client's experience.** `getNetworkWirelessClientConnectionStats` with `networkId` and `clientId`.
4. **Latency.** `getNetworkWirelessLatencyHistory` with `networkId`, narrowed by `clientId`, `deviceSerial` or `ssid`.
5. **RF congestion.** `getOrganizationWirelessDevicesChannelUtilizationByDevice` with `networkIds`. High utilization on an AP with complaints points at interference or too many clients on one radio.

**Reading the failure step.** Association failures are RF or capacity. Authentication failures are the PSK, RADIUS or certificate side. DHCP failures mean the VLAN's scope is exhausted or the VLAN is not trunked to the AP's switch port. DNS failures are upstream of the wireless network.

## Workflow: Find a Client by MAC

1. `getOrganizationClientsSearch` with `organizationId` and `mac` returns the client's ID and the network(s) it has been seen on (`perPage` 3 to 5).
2. `getNetworkClient` with `networkId` and `clientId` gives IP, VLAN, the AP or switch it was last seen on and the switch port.
3. Then, as needed: `getNetworkWirelessClientConnectionStats` for Wi-Fi problems, or `getNetworkApplianceClientSecurityEvents` for IDS or malware hits.

```
execute_api { "capability_id": "getOrganizationClientsSearch", "parameters": { "organizationId": "<orgId>", "mac": "aa:bb:cc:dd:ee:ff" } }
```

This usually answers the question an ARP or MAC table lookup would, without a live tool.

## Workflow: What Changed?

1. **Configuration changes.** `getOrganizationConfigurationChanges` with `networkId` and a short `timespan`. Its defaults are 365 days and 5000 rows, so always narrow it, e.g. `timespan: 172800` and `perPage: 100`.
2. **Event types.** `getNetworkEventsEventTypes` lists the event type codes valid for that network.
3. **Events.** `getNetworkEvents` with `productType` (required when the network has more than one product type), plus `includedEventTypes`, `deviceSerial` or `clientMac` and a `perPage` (default 10).
4. Line up the change timestamps against `getOrganizationDevicesAvailabilitiesChangeHistory`. A change made minutes before an outage is the first suspect; name the admin and the setting in the report.

```
execute_api { "capability_id": "getNetworkEvents", "parameters": { "networkId": "<networkId>", "productType": "switch", "deviceSerial": "Q2XX-XXXX-XXXX", "perPage": 50 } }
```

## Sensors and Cellular

- **MT sensors** (server room temperature, water leak, door): `getOrganizationSensorReadingsLatest` with `networkIds` and `metrics`, and `getNetworkSensorAlertsCurrentOverviewByMetric` for what is alerting now.
- **MG cellular gateways and cellular failover**: `getOrganizationCellularGatewayUplinkStatuses`, and `getOrganizationDevicesCellularUplinksBandsByDevice` for signal. Weak signal explains a slow site that has failed over to cellular.

## Handing Off Live Tests

When a live test or reboot is the next step, write the request so the human can act on it without reading the investigation: device name and serial, the test, the target, and what result would confirm or rule out the suspicion.

| Test | Where in the Dashboard | Typical use |
|------|------------------------|-------------|
| Ping, traceroute | The device's status page > Tools | Reachability from the site to a target |
| Cable test, cycle port | The switch's page > Tools (MS only) | Physical-layer suspicion; bouncing a PoE device |
| ARP table (MX), MAC forwarding table (MS) | The device's page > Tools | Where a host is learned when client search finds nothing |
| Blink LEDs | The device's page > Tools | Finding the physical box on site |
| Throughput test | The device's page > Tools, where offered for that model | "Slow internet" once uplinks look clean |
| Packet capture | Network-wide > Monitor > Packet capture | Protocol-level evidence |
| Reboot | The device's page > Tools | Last resort, after warning about site impact |

Example hand-off:

> On switch BR12-MS01 (serial Q2XX-XXXX-XXXX), run a cable test on port 14 (Switching > Monitor > Switches > BR12-MS01 > Tools > Cable test). Port 14 has logged 4,812 CRC errors in the last hour and is linking at 100 Mbps. An open or short pair confirms a bad cable run; a clean result points at the patch lead or the desk phone's NIC.

## Best Practices

- Confirm the device is online before suggesting a live test -- an offline device cannot run one.
- Prefer org-wide capabilities with `networkIds` or `serials` filters over looping per device.
- Always pass a `timespan`; several capabilities default to long windows.
- Summarise findings as loss %, latency, error counts and timestamps rather than dumping raw JSON, and say when a result is one page of a larger set.

## Related Skills

- `meraki-api-patterns` -- tool schemas, pagination, Conduit access tiers
- `meraki-devices` -- inventory, availability, reboot and removal hand-offs
- `meraki-security-appliance` -- firewall, NAT, VPN status and security events
