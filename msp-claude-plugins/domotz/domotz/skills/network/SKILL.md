---
name: "Domotz Network"
description: >
  Domotz network observation: the collector's topology graph, its own
  interfaces, detected IP conflicts, and the two SNMP surfaces — polled
  variables and custom sensors — with their history endpoints and the
  tools and error modes for each.
when_to_use: >-
  When reading network topology, checking for IP conflicts, or pulling SNMP
  metrics and their history through Domotz agents. Use when: domotz network, snmp,
  network topology, ip conflict, duplicate ip, interface counters, snmp sensor,
  snmp variable, bandwidth counters, or snmp polling.
---

# Domotz Network Operations

## Overview

Domotz agents observe the network they sit on: they map how devices connect,
detect addressing collisions, and poll SNMP-capable devices for operational
metrics. Everything in this skill is read-only and scoped to one agent.

Domotz discovery is **passive and continuous** — the agent scans on its own
schedule. There is no tool that triggers a scan on demand, so "rescan the
network" is not an action available here; a fresh census means re-reading
`domotz_devices_list` and comparing.

## Anti-triggers

- **A switch port's VLAN, PoE, or link state** — Domotz exposes the
  collector's own interfaces and SNMP counters, not switch port
  configuration. Meraki switch ports are `meraki-devices`.
- **TCP service-port checks on a host** — Domotz's MCP surface has no
  port-probe tool. Synthetic service checks are `betterstack-monitors`.
- **Bandwidth speed tests** — no speed-test tool exists here; use
  `betterstack-monitors` or the ISP's own reporting.
- **Interface counters across a whole MSP fleet** — Domotz polls one
  site at a time; fleet-wide interface and utilisation history is
  `auvik-networks`.
- **Scanning to enumerate an attack surface** — Domotz discovery feeds
  monitoring, not security assessment; use `runzero`.

## Key Concepts

### Topology

The agent builds a connectivity graph of the devices it has discovered —
which device is reachable through which, and how the site hangs together.
It is derived from what the collector can observe from its own vantage
point, so it reflects one LAN, not a routed multi-site estate.

### IP Conflicts

Domotz flags addressing collisions it observes — the same IP answering for
more than one MAC. These are usually a static address colliding with a DHCP
lease, and they present as intermittent, hard-to-reproduce faults.

### SNMP: two distinct surfaces

Domotz has two separate SNMP lists per device, and they are not
interchangeable:

- **Variables** — the metrics Domotz polls by default once it identifies
  a device as SNMP-capable (interface counters, system resources).
  Addressed by `variable_id`.
- **Custom sensors** — SNMP sensors an operator configured explicitly on
  that device. Addressed by `sensor_id`.

Each has its own history endpoint. A `variable_id` will not resolve
against the sensor history tool, or vice versa.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `domotz_network_topology` | Connectivity graph for the agent's network | `agent_id` |
| `domotz_network_interfaces` | Network interfaces on the **collector itself** | `agent_id` |
| `domotz_network_ip_conflicts` | Detected IP address conflicts | `agent_id` |
| `domotz_metrics_variables_list` | SNMP metrics/variables polled for a device | `agent_id`, `device_id` |
| `domotz_metrics_variable_history` | Time series for one variable | `agent_id`, `device_id`, `variable_id` |
| `domotz_metrics_snmp_sensors_list` | Custom SNMP sensors configured on a device | `agent_id`, `device_id` |
| `domotz_metrics_sensor_history` | History for one custom sensor | `agent_id`, `device_id`, `sensor_id` |

All IDs are numbers. None of these tools takes a time range, a page, or a
limit — history endpoints return whatever window Domotz retains, and you
narrow it after the fact.

## Common Workflows

### Bandwidth review for a network device

1. Call `domotz_metrics_variables_list` for the device to see what is
   actually being polled.
2. Identify the interface counters (`ifInOctets` / `ifOutOctets` style
   entries) and note their `variable_id`.
3. Call `domotz_metrics_variable_history` per variable.
4. Counters are cumulative — derive utilisation from the delta between
   samples and the interval, not from the raw value.
5. Flag interfaces trending toward capacity.

### Custom sensor review

1. Call `domotz_metrics_snmp_sensors_list` for the device.
2. For any sensor of interest, call `domotz_metrics_sensor_history` with
   its `sensor_id`.
3. An empty sensor list means nobody configured custom sensors on that
   device — it does not mean SNMP is unavailable. Check
   `domotz_metrics_variables_list` before concluding the device is not
   polled.

### IP conflict triage

1. Call `domotz_network_ip_conflicts` for the agent.
2. For each conflicting address, call `domotz_devices_list` and match on
   IP to identify which devices are involved.
3. Resolve at the DHCP scope or the statically-addressed device.

### Site topology review

1. Call `domotz_network_topology` for the agent.
2. Cross-reference node IDs against `domotz_devices_list` for names,
   vendors, and status.
3. Identify the devices everything else depends on, and check their
   uptime with `domotz_devices_uptime`.

Treat the output as sensitive: a topology graph plus the device census is
close to what an attacker would want for lateral movement. See
`GOVERNANCE.md`, *Data handling*.

### Detecting new devices without a scan trigger

1. Call `domotz_devices_list` for the agent.
2. Compare against your previous snapshot, or sort by `first_seen`.
3. New entries appear as the agent's own scan cycle finds them — there
   is no way to force that cycle from here, so a device plugged in
   moments ago may not be present yet.

## Error Handling

### Empty SNMP variable list

**Cause:** Device does not support SNMP, SNMP is not enabled, or the
community string on the agent does not match the device.
**Solution:** Verify SNMP is enabled on the device and configured on the
collector in the Domotz portal. This cannot be fixed through the API.

### `variable_id` or `sensor_id` returns 404

**Cause:** The ID came from the other list, or belongs to a different
device.
**Solution:** Re-read the correct list for that exact `agent_id` /
`device_id` pair.

### Topology looks incomplete

**Cause:** The collector can only map what it observes; devices behind a
routed segment or on a VLAN the agent cannot reach are absent.
**Solution:** Confirm agent placement; a site with multiple isolated
segments may need more than one collector.

### Stale metrics

**Cause:** The agent is offline, so history stops but last-known values
still return.
**Solution:** Check `domotz_agents_get` status and `last_seen` before
trusting any metric as current.

## Best Practices

- Read `domotz_metrics_variables_list` before assuming which counters
  exist — what is polled varies by device
- Derive rates from deltas; SNMP counters are cumulative and wrap
- Check for IP conflicts when a device reports intermittent
  connectivity; the symptom is easily misread as a failing device
- Verify collector health before drawing conclusions from any of these
  reads
- Restrict topology output if agents run unattended or transcripts are
  retained

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [agents](../agents/SKILL.md) - Collector health and placement
- [devices](../devices/SKILL.md) - The device census these tools reference
- [alerts](../alerts/SKILL.md) - Alert profiles for threshold conditions
- [power](../power/SKILL.md) - PDU outlet control
