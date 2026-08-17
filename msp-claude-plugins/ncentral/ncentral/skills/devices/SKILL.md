---
name: "N-central Devices"
description: >
  N-central device records: listing with saved device filters (filterId),
  asset and warranty lookups, lifecycle reads and updates, and
  service-monitor status triage on a single device.
when_to_use: >-
  When listing, filtering, or auditing N-central devices, looking up assets and warranty/lifecycle
  data, updating lifecycle records, or triaging failed service monitors. Use when: ncentral
  device, ncentral inventory, ncentral filter, ncentral asset, ncentral warranty, ncentral
  lifecycle, ncentral service status, or device filter.
---

# N-central Devices

Devices are the unit of inventory in N-central. Every agent- or
probe-discovered endpoint — server, workstation, network device — has a
device record scoped to a customer or site org unit. This skill covers
listing strategy (filters vs org-unit scoping), the asset/lifecycle data
model, and service-monitor triage.

## Anti-triggers

- **Doing something to the device** — everything here reads, apart from
  lifecycle writes. Running a script, restarting a service, or pushing a
  fix is `ncentral-monitoring-tasks` and its direct-task tool.
- **The same endpoint under a different RMM** — `atera-agents`,
  `syncro-assets`, `superops-assets`, `immybot-endpoint-management`,
  `ninjaone-devices`, `datto-rmm-devices`, and
  `connectwise-automate-computers` each see only their own fleet. Watch
  for `atera-devices` in particular, where "device" means an agentless
  SNMP or HTTP monitor rather than an endpoint.
- **Hardware refresh programmes** — N-central lifecycle fields are a
  free-text store someone has to populate; procurement-grade planning is
  `scalepad-lifecycle-manager`.
- **Which customer or site a device belongs to** — org-unit resolution
  is `ncentral-organizations`.

## Tools

| Tool | Use For |
|------|---------|
| `ncentral_list_devices` | Fleet-wide listing; accepts `filterId` for saved filters |
| `ncentral_list_devices_by_org_unit` | Devices scoped to one customer or site |
| `ncentral_list_device_filters` | Enumerate saved device filters and their IDs |
| `ncentral_get_device` | Single device core record |
| `ncentral_get_device_assets` | Hardware/software asset detail (CPU, RAM, disks, OS, installed software) |
| `ncentral_get_device_lifecycle` | Warranty expiry, purchase date, lease/expected replacement |
| `ncentral_update_device_lifecycle` | Write lifecycle fields (warranty, cost, dates) |
| `ncentral_get_device_service_status` | Per-service monitor status on one device |

## Listing Strategy: Filters First

N-central admins maintain **saved device filters** in the UI ("Windows
Servers", "Offline > 30 days", "Missing patches", …). These are the
cheapest way to slice a large fleet server-side:

1. `ncentral_list_device_filters` — get the filter names and `filterId`s
   visible to the API user.
2. `ncentral_list_devices` with `filterId` — the server applies the filter;
   you page through only the matching devices.

Prefer this over pulling the whole fleet and filtering client-side —
N-central deployments routinely exceed 10k devices, and pagination caps at
1000 per page. When the question is per-customer ("what does ACME have?"),
use `ncentral_list_devices_by_org_unit` with the customer or site `orgUnitId`
instead.

## Assets and Lifecycle

Two different data sets, two different tools:

- **Assets** (`ncentral_get_device_assets`) — what the agent discovered:
  OS and version, CPU, memory, disks and free space, NICs, installed
  software. Refreshed by the agent's asset scan; can be stale if the device
  has been offline.
- **Lifecycle** (`ncentral_get_device_lifecycle`) — what a human recorded:
  warranty expiry date, purchase date, expected replacement date, cost,
  lease information. Empty unless someone (or an integration) populated it.

`ncentral_update_device_lifecycle` writes lifecycle fields — useful for
bulk-stamping warranty expiry dates from a vendor export. It only touches
the lifecycle record; it never modifies monitoring or the device itself.
Still, confirm with the user before bulk updates: overwriting a populated
warranty date loses data with no undo.

For warranty/refresh audits, the standard pass is: list devices for the
org unit, pull lifecycle for servers and network devices, flag anything
expired or expiring within 90 days, and separately flag devices with *no*
lifecycle data at all (an untracked device is a hidden risk, not a healthy
one).

## Service-Monitor Triage

Each device runs a set of service monitors (agent status, disk, CPU,
backup jobs, AV status, application-specific checks).
`ncentral_get_device_service_status` returns the per-service state for one
device — the drill-down after `ncentral_list_active_issues` tells you
*which* devices are unhealthy:

1. Active issues sweep says device X has a failed service.
2. `ncentral_get_device_service_status` on X shows every monitor and its
   state (Normal / Warning / Failed / Misconfigured / Disconnected /
   Stale).
3. Distinguish real failures from data problems: **Stale** or
   **Disconnected** usually means the agent stopped reporting (device
   offline, agent broken) — every other monitor on that device is
   untrustworthy until the agent checks in. **Misconfigured** is a setup
   error, not an outage.

## Best Practices

- Resolve `filterId` by listing filters first — filter IDs differ per
  server; never hardcode them.
- Asset scan timestamps matter: quote when the asset data was collected if
  the device looks offline.
- Lifecycle updates are writes — echo the before/after values and get
  confirmation before applying them in bulk.
- Device IDs are per-server. When correlating with PSA or documentation
  tools, match on hostname/serial, not ID.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, filters, rate limits
- [organizations](../organizations/SKILL.md) - org-unit scoping for device lists
- [monitoring-tasks](../monitoring-tasks/SKILL.md) - active issues that lead into device triage
