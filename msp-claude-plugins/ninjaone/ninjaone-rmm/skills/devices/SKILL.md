---
name: "ninjaone-devices"
description: >
  NinjaOne device management: device details and updates, Windows service
  control, inventory, maintenance windows, reboot modes, and health-check
  workflows for Windows, Mac, and Linux endpoints running the NinjaRMM agent.
when_to_use: >-
  When querying or acting on NinjaRMM-enrolled endpoints — inventory lookups, service
  control, maintenance scheduling, or reboots. Use when: ninjaone device, ninjarmm
  device, ninja device list, device inventory ninja, ninja services, ninja maintenance,
  device reboot ninja, or ninja endpoint.
---

# NinjaOne Device Management

Manage NinjaRMM-enrolled endpoints: query details, control Windows services, schedule maintenance, and reboot devices safely.

## Anti-triggers

- **A device managed by a different RMM** — the endpoint has to be running
  the NinjaRMM agent. Use `atera-devices`, `ncentral-devices`,
  `datto-rmm-devices`, `syncro-assets`, or
  `connectwise-automate-computers` for those fleets. "Device", "endpoint",
  and "agent" mean the same thing in all six; only the enrolment differs.
- **What a device is alerting on** — this skill covers the endpoint's own
  state; the alert queue and its severity model are `ninjaone-rmm-alerts`.
- **Every device belonging to a client** — that is an organization-scoped
  query; use `ninjaone-rmm-organizations`.
- **The documented record of a machine rather than the live one** — an
  asset record in a documentation platform is not the RMM's view of the
  endpoint; use `hudu-assets` or `it-glue-configurations`.

## Core API Operations

### Get Device Details

```http
GET /api/v2/device/{id}
Authorization: Bearer {token}
```

Response (key fields):

```json
{
  "id": 42, "systemName": "WS-ACCT-017",
  "offline": false, "lastContact": "2025-04-10T14:32:00Z",
  "os": { "name": "Windows 11 Pro" },
  "nodeRoleId": 1, "organizationId": 5, "policyId": 12
}
```

### Update Device

```http
PATCH /api/v2/device/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{ "displayName": "WS-ACCT-017-Renamed", "nodeRoleId": 2, "policyId": 45 }
```

### Get Device Alerts / Activities

```http
GET /api/v2/device/{id}/alerts
GET /api/v2/device/{id}/activities
Authorization: Bearer {token}
```

## Windows Services

```http
GET  /api/v2/device/{id}/windows-services                          # list all
POST /api/v2/device/{id}/windows-service/{serviceId}/control       # control
Authorization: Bearer {token}
Content-Type: application/json
```

Control body — actions: `START`, `STOP`, `RESTART`:

```json
{ "action": "RESTART" }
```

If the service does not exist, the API returns 404. Verify `serviceId` by listing services first.

## Maintenance Windows

```http
PUT    /api/v2/device/{id}/maintenance    # schedule
DELETE /api/v2/device/{id}/maintenance    # cancel
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{ "start": "2025-04-16T02:00:00Z", "end": "2025-04-16T06:00:00Z" }
```

## Reboot Device

```http
POST /api/v2/device/{id}/reboot/{mode}
Authorization: Bearer {token}
```

Modes: `NORMAL` (graceful, notifies user) | `FORCED` (immediate, no warning).

> **Destructive operation** — always validate before rebooting. See safe-reboot workflow below.

## Workflows

### Safe Reboot with Validation

```text
1. GET /api/v2/device/{id}           → assert "offline": false
2. GET /api/v2/device/{id}/alerts    → review severity; abort if critical
3. POST /api/v2/device/{id}/reboot/NORMAL
4. Poll GET /api/v2/device/{id} every 30s (up to 10 min) → wait for "offline": false
5. If still offline after 10 min → GET /api/v2/device/{id}/alerts for new alerts; escalate
```

**Error recovery**: If step 1 shows `"offline": true`, do not reboot. Check `lastContact` and alerts to diagnose.

### Restart a Windows Service

```text
1. GET /api/v2/device/{id}/windows-services → find target service, note serviceId
2. If state is "STOPPED", use "START"; otherwise use "RESTART"
3. POST /api/v2/device/{id}/windows-service/{serviceId}/control  Body: { "action": "RESTART" }
4. GET /api/v2/device/{id}/windows-services → confirm state is "RUNNING"
```

**Error recovery**: 404 means wrong `serviceId` — re-list and match by `serviceName` (case-sensitive). 409 means device offline — check device status first.

### Check Server Health

```text
1. GET /api/v2/device/{id}                  → confirm online, note OS and role
2. GET /api/v2/device/{id}/volumes          → flag volumes with < 10% free space
3. GET /api/v2/device/{id}/alerts           → triage by severity
4. GET /api/v2/device/{id}/windows-services → verify critical services are RUNNING
```

## Best Practices

1. **Check `offline` before issuing commands** — control requests to offline devices return 409.
2. **Default to `NORMAL` reboot** — `FORCED` skips user notification and risks data loss.
3. **Poll after destructive operations** — confirm device/service status at 30s intervals before proceeding.
4. **Scope maintenance windows tightly** — minimize alert suppression gaps.

## Reference

See [REFERENCE.md](./REFERENCE.md) for device roles, hardware inventory endpoints, device approval, regional API base URLs, and error codes.

## Related Skills

- [Organizations](../organizations/SKILL.md) — Organization management
- [Alerts](../alerts/SKILL.md) — Alert monitoring
- [API Patterns](../api-patterns/SKILL.md) — Authentication and request patterns
