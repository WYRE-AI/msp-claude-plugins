---
name: "ImmyBot Endpoint Management"
description: >
  ImmyBot computers/endpoints and their tenant grouping: the computer tool
  surface, workflows for surveying a tenant fleet, locating a device, auditing
  inventory against desired state, onboarding a new computer record, and forcing
  an agent check-in, plus the filtering caveats around online status and serials.
when_to_use: >-
  When listing, searching, inspecting, or onboarding ImmyBot-managed Windows computers, reviewing
  per-device inventory, or triggering agent check-ins. Use when: immybot computer, immybot
  endpoint, immybot device list, immybot inventory, immybot check-in, immybot agent, or immybot
  fleet.
---

# ImmyBot Endpoint Management

ImmyBot manages Windows endpoints (computers) grouped under tenants
(client organizations). This skill covers querying and onboarding
those computers and inspecting their state.

## Anti-triggers

- **The same machine under the RMM** — ImmyBot sees only Windows
  computers enrolled in this instance, and an endpoint is normally
  enrolled in an RMM as well: `atera-agents`, `syncro-assets`,
  `superops-assets`, `ncentral-devices`, `ninjaone-devices`, or
  `datto-rmm-devices`. Inventory from the two will legitimately differ.
- **What *should* be installed on a computer** — this skill reads what
  is actually there; desired state is
  `immybot-software-deployment`.
- **Fleet-wide or per-tenant rollups** — use
  `immybot-tenant-compliance`.

## API Tools

| Tool | Purpose |
|------|---------|
| `immybot_computers_list` | List computers with tenant/online/OS/status filters |
| `immybot_computers_get` | Full detail for one computer by ID |
| `immybot_computers_search` | Search by name, serial number, etc. |
| `immybot_computers_inventory` | Installed-software / hardware inventory for a computer |
| `immybot_computers_deployments` | Deployments targeting a specific computer |
| `immybot_computers_create` | Create a new computer record |
| `immybot_computers_trigger_checkin` | Force an agent check-in now |

## Common Workflows

### Survey a tenant's fleet

1. `immybot_tenants_search` → resolve the tenant ID.
2. `immybot_computers_list` filtered by that tenant ID.
3. Group results by online status and OS to spot stale or offline
   endpoints.

### Locate one computer

`immybot_computers_search` accepts hostname or serial number. Drill
in with `immybot_computers_get` for OS, last-seen, tenant, and
agent state.

### Inventory audit

1. `immybot_computers_get` for the device.
2. `immybot_computers_inventory` for what is actually installed.
3. `immybot_computers_deployments` for what desired-state expects.
4. The gap between (2) and (3) is the remediation list — hand it to
   the software-deployment workflow.

### Onboard a new computer

`immybot_computers_create` registers a record (name, tenant ID, and
optional serial / MAC / location). The ImmyBot agent must still be
installed on the endpoint for it to come online.

### Force a check-in

`immybot_computers_trigger_checkin` asks the agent to phone home
immediately rather than waiting for its next scheduled interval —
useful after staging a deployment when you want fast feedback.

## Filtering Notes

- `online` status is a point-in-time snapshot; a computer can be
  enrolled but offline.
- Always scope `immybot_computers_list` by tenant when working a
  specific client — the unscoped list spans the whole MSP fleet.
- Serial number is the most reliable search key when hostnames are
  not unique across tenants.

## Best Practices

- Confirm a computer is online before triggering a maintenance
  session against it — an offline endpoint just queues work.
- Use inventory data to validate a deployment actually landed rather
  than trusting the deployment's reported status alone.

## Related Skills

- [software-deployment](../software-deployment/SKILL.md) — deploy software to these computers
- [maintenance-sessions](../maintenance-sessions/SKILL.md) — reconcile desired state
- [api-patterns](../api-patterns/SKILL.md) — auth and the desired-state model
