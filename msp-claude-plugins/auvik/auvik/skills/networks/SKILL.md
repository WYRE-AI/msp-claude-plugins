---
name: "Auvik Networks"
description: >
  Use this skill when working with Auvik network and interface entities -
  the network entity model, IP-range scoping, interface-to-device
  relationships, and admin vs oper status.
when_to_use: >-
  When listing or inspecting Auvik networks and interfaces, or correlating interfaces back to
  their devices. Use when: auvik network, auvik interface, auvik vlan, auvik subnet, auvik link,
  or auvik topology.
---

# Auvik Networks and Interfaces

A `network` in Auvik is an IP scope - typically a subnet that Auvik has discovered devices on. An `interface` is a port on a device. Both are distinct entity types with their own list endpoints. This skill clarifies the data model and the relationships.

## Tools

| Tool | Use For |
|------|---------|
| `auvik_networks_list` | List networks for a tenant |
| `auvik_networks_get` | Detail for one network |
| `auvik_interfaces_list` | List interfaces for a tenant |

## Network Entity

Fields you'll see:

- `networkName` - usually the subnet in CIDR form
- `networkType` - `private`, `internet`, `unknown`
- `scanStatus` - whether discovery scans for this network are healthy
- `gatewayIp`, `dhcpEnabled`
- `description` - free-form, often blank

Networks are not VLANs in the Auvik model - VLAN information lives on interface records and switch configurations. A single VLAN typically maps to a single network, but the network entity is keyed on subnet, not VLAN ID.

## Interface Entity

Fields you'll see:

- `interfaceName` - e.g. `GigabitEthernet1/0/24`
- `interfaceType` - `ethernet`, `wireless`, `virtual`, `loopback`, `tunnel`, etc.
- `adminStatus` - `up` or `down` - operator-set
- `operStatus` - `up` or `down` - actual current state
- `linkSpeed` - in bps
- `parentDeviceId` - the device that owns the interface
- `description` - administrator-set port description (when populated)

### adminStatus vs operStatus

| adminStatus | operStatus | Meaning |
|-------------|------------|---------|
| up | up | Healthy |
| up | down | Link down - real condition (flap, cable, upstream) |
| down | down | Administratively shut down - usually deliberate |
| up | testing | In test mode - transient |

A flapping interface will move between `up` and `down` on `operStatus` while `adminStatus` stays `up`. Capacity and statistics tools only return useful data for `up/up` interfaces.

## Relationships

- Interface -> Device via `parentDeviceId` -> `auvik_devices_get`
- Device -> Networks via the device's IP addresses (in `auvik_devices_get_details`)
- Network -> Devices via the address scope - a device with an IP in the network's range belongs to that network

There is no direct "list devices in this network" call - you list devices, list networks, and join on IP membership client-side.

## Common Workflows

### Network footprint of a tenant

1. `auvik_networks_list` - count, list IP ranges.
2. Note `scanStatus` for each - any in error state is a discovery problem.

### Find flapping interfaces

1. `auvik_interfaces_list` for the tenant.
2. Filter `adminStatus = up`, `operStatus = down`.
3. Resolve owning device via `parentDeviceId`.
4. Pull `auvik_statistics_interface` over a short window to see flap frequency.

### Cross-reference an alert to an interface and device

1. Alert references `entityId` with `entityType = interface`.
2. The interface record has `parentDeviceId`.
3. `auvik_devices_get` on the parent for the human-readable context.

## Edge Cases

- Virtual interfaces (SVIs, port-channels, tunnels) appear in `auvik_interfaces_list` alongside physical ones. Their `interfaceType` distinguishes them. For capacity reporting, exclude `interfaceType in {loopback, tunnel, virtual}` unless the question is specifically about them.
- Some devices expose hundreds of interfaces (large modular switches) - paginate aggressively.
- `linkSpeed` is 0 for down interfaces on some platforms - guard against divide-by-zero in utilization math.

## Related Skills

- [devices](../devices/SKILL.md)
- [alerts](../alerts/SKILL.md)
- [api-patterns](../api-patterns/SKILL.md)
