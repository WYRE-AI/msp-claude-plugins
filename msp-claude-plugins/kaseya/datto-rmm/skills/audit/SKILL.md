---
name: "Datto RMM Audit"
description: >
  Datto RMM audit data structure covering hardware inventory (CPU, RAM,
  disks, motherboard, BIOS), software inventory, network interfaces, and
  ESXi/printer audits, along with audit collection cadence and data
  freshness semantics.
when_to_use: >-
  When working with hardware inventory, software inventory, network interfaces, and system
  information in Datto RMM audit data. Use when: datto audit, device audit, software inventory,
  hardware inventory, system audit, device inventory, installed software, hardware specs, or
  network audit.
---

# Datto RMM Audit Data

## Overview

Audit data in Datto RMM provides detailed hardware and software inventory for managed devices. The agent periodically collects this information and reports it to the platform. This skill covers accessing audit data, understanding its structure, and common audit workflows.

## Anti-triggers

- **Software observed running rather than software installed** —
  RocketCyber reports application telemetry from its own sensor; use
  `rocketcyber-apps`.
- **Whether the device is reachable right now** — audit data is a
  periodic snapshot and goes stale; use `datto-rmm-devices`.
- **Inventory as documentation of record** — use
  `itglue-configurations`.

## Key Concepts

### Audit Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Hardware** | Physical components | CPU, RAM, disks, motherboard |
| **Software** | Installed applications | Programs, versions, publishers |
| **Network** | Network configuration | Interfaces, IPs, MACs |
| **Operating System** | OS details | Version, build, architecture |
| **ESXi** | VMware hypervisor info | VMs, datastores, hosts |
| **Printer** | Network printers | Name, model, status |

### Audit Freshness

Audit data is collected periodically:
- **Standard devices:** Every 24 hours
- **Software changes:** Real-time detection
- **On-demand:** Triggered by agent commands

## Field Reference

Audit responses are grouped into `hardware`, `operatingSystem`, `network`, plus
the ESXi-specific blocks. The most-used fields:

| Block | Key fields |
|-------|-----------|
| `hardware.processor` | `name`, `cores`, `logicalProcessors`, `speed` |
| `hardware.memory` | `totalRam`, `availableRam`, `slots[]` (bytes, not MB) |
| `hardware.disks[]` | `name`, `size`, `freeSpace`, `type` |
| `operatingSystem` | `name`, `version`, `architecture`, `installDate`, `lastBootTime` |
| `network.interfaces[]` | `name`, `macAddress`, `ipv4`, `dhcpEnabled` |
| root | `lastAuditDate` (epoch ms) |

See [references/fields.md](references/fields.md) for the complete field reference
(hardware, software, network, and ESXi host audits).

## API Patterns

| Purpose | Endpoint |
|---------|----------|
| Full device audit | `GET /api/v2/device/{deviceUid}/audit` |
| Software inventory | `GET /api/v2/device/{deviceUid}/audit/software` |
| ESXi host audit | `GET /api/v2/device/{deviceUid}/audit/esxi` |
| Printer audit | `GET /api/v2/device/{deviceUid}/audit/printers` |

All audit endpoints take the device **UID**, not the device ID, and all
timestamps (`lastAuditDate`, `lastScan`, `lastBootTime`) are epoch
**milliseconds**.

See [references/api.md](references/api.md) for the full request/response
examples for each endpoint.

## Workflows

Reference implementations for the common audit workflows — software compliance
check, hardware inventory report, find-devices-with-specific-software, disk
space analysis, and ESXi capacity report — are in
[references/examples.md](references/examples.md).

## Error Handling

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device not found | 404 | Invalid deviceUid | Verify device exists |
| Audit not available | 404 | No audit data yet | Wait for agent collection |
| Device offline | - | Agent not reporting | Check device connectivity |

A 404 from an audit endpoint is ambiguous: it means either the device UID is
wrong or the agent has never completed an audit. Check the device exists before
concluding the audit is missing.

See [references/errors.md](references/errors.md) for the audit freshness
validation helper.

## Best Practices

1. **Check audit freshness** - Verify data is recent before reporting
2. **Handle missing data** - Not all devices have complete audits
3. **Use software inventory for compliance** - Track required applications
4. **Monitor disk space trends** - Use audit data for capacity planning
5. **Track hardware lifecycle** - Use warranty and spec data
6. **ESXi-specific queries** - Use dedicated ESXi endpoints
7. **Filter software results** - Exclude Windows updates if needed
8. **Document hardware standards** - Use audit to verify standards

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Device management
- [Datto RMM Alerts](../alerts/SKILL.md) - Disk/hardware alerts
- [Datto RMM Variables](../variables/SKILL.md) - Store audit metadata
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
