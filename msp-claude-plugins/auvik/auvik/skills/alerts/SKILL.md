---
name: "Auvik Alerts"
description: >
  Use this skill when working with Auvik alerts - severity tiers,
  status lifecycle, dismissal semantics, and the common alertName
  patterns that show up in MSP NOC queues.
when_to_use: >-
  When listing, triaging, dismissing, or investigating Auvik alerts. Use when: auvik alert, auvik
  triage, auvik dismiss, auvik severity, auvik noc, auvik down, or auvik flap.
---

# Auvik Alerts

Auvik alerts are condition-based notifications generated when a monitored entity (device, interface, network, service) crosses a threshold or changes state. This skill covers the severity model, the status lifecycle, and the dismissal semantics that confuse new users.

## Tools

| Tool | Use For |
|------|---------|
| `auvik_alerts_list` | List alerts, filterable by status / severity / tenant |
| `auvik_alerts_get` | Full record for one alert |
| `auvik_alerts_dismiss` | Acknowledge and hide an alert |

## Severity

Severity values, in increasing order:

| Severity | Meaning |
|----------|---------|
| `info` | Informational - state change, no impact |
| `warning` | Worth attention but not service-affecting |
| `critical` | Service affecting; respond now |
| `emergency` | Highest tier; usually a managed infrastructure device down |

Default triage filter is `severity >= warning` - `info` alerts drown the queue and are rarely actionable.

## Status

| Status | Meaning |
|--------|---------|
| `open` | Currently active |
| `dismissed` | Acknowledged by a user; hidden from the default UI view |
| `closed` | Condition cleared on its own |

`closed` is the only "the problem is fixed" state. `dismissed` is "a human decided not to look at this" - the underlying condition may or may not still hold.

## Dismissal Semantics

**Dismissing an alert does not fix the underlying condition.**

Auvik's alert engine evaluates conditions on a recurring schedule. If you dismiss an alert and the condition still holds when the engine next evaluates, a new alert (with a new ID) will appear. This is the source of the "we keep dismissing the same alert" pattern in noisy tenants.

Three appropriate uses of dismissal:

1. **Known noise** - the condition is a confirmed false-positive for this tenant (e.g. link flap on a known-flaky access port on an unmanaged switch).
2. **Already-acknowledged** - someone has already opened a ticket and is working it; dismissal removes it from the queue.
3. **Transient that cleared** - the condition cleared between alert fire and triage; dismissing closes the loop.

Two inappropriate uses:

1. **Suppressing a real condition** - if the device is genuinely down, dismissing buys you 15 minutes of silence before the next alert. Fix the device.
2. **Bulk-clearing the queue** - if the queue is too noisy, the alert rules need tuning, not dismissal.

## Common alertName Patterns

The exact set varies, but in practice these dominate MSP NOC queues:

| alertName pattern | Typical real cause |
|-------------------|--------------------|
| `Device unreachable` / `Device down` | Real outage OR credentials problem |
| `Interface down` | Link flap, cable, or upstream issue |
| `Configuration changed` | Saved config differs from baseline |
| `New device discovered` | Discovery picked up an unmanaged device |
| `Backup failed` | Config backup attempt did not complete |
| `High CPU` / `High memory` | Device under load |
| `Interface utilization high` | Link saturation - cross-check via statistics |
| `SNMP poller failure` | Credentials or ACL problem |

## Entity Resolution

Every alert references an `entityId` and `entityType`. To make a good triage decision, you almost always need to pull the entity:

- `entityType = device` -> `auvik_devices_get`
- `entityType = network` -> `auvik_networks_get`
- `entityType = interface` -> the parent device via `auvik_devices_get`

Critical alerts on `manageStatus = unmanaged` devices are almost always discovery noise, not real incidents.

## Workflow

1. `auvik_alerts_list status=open` (scope by tenant if needed).
2. Order by severity desc, then detectedTime asc.
3. For top-of-queue items, `auvik_alerts_get` for the full record.
4. Resolve the entity for context.
5. Decide: action, investigate, or dismiss-with-justification.
6. Dismiss only after the user confirms.

## Edge Cases

- Some alerts have empty `description` fields - the alertName plus the entity is the whole signal.
- `detectedTime` is UTC.
- An alert can reference an entity that has since been deleted in Auvik - the entity fetch will 404. Treat this as evidence the alert is stale and a candidate for dismissal.

## Related Skills

- [devices](../devices/SKILL.md)
- [networks](../networks/SKILL.md)
- [api-patterns](../api-patterns/SKILL.md)
