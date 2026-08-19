---
name: "Axcient Clients"
description: >
  Axcient x360Recover clients: the health_status model, client_code,
  the three-way protected-system counter breakdown (appliance_based, d2c,
  cloud_archive), and minting direct-to-cloud agent enrollment tokens.
when_to_use: >-
  When looking up, listing, or auditing Axcient clients, or enrolling a new
  direct-to-cloud (D2C) backup agent. Use when: axcient client, client
  health, protected systems, d2c agent, d2c token, client code, or
  x360recover client.
---

# Axcient Clients

## Overview

A "client" in x360Recover is the tenant/customer boundary — roughly
equivalent to a PSA company. Every device, job, vault, and appliance belongs
to exactly one client. Client health is a rollup Axcient computes from the
devices underneath it, not a value you set.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `axcient_list_clients` | Every client visible to this credential | `include_appliances?` |
| `axcient_get_client` | One client's detail | `client_id`, `include_appliances?` |
| `axcient_get_d2c_agent_token` | Mint a D2C agent enrollment token | `client_id`, `vault_id` |

### List Clients

```
axcient_list_clients
```

**Example response (one client):**

```json
{
  "id": 26,
  "name": "Acme Corp",
  "client_code": "ACME",
  "active": true,
  "health_status": "NORMAL",
  "devices_counters": {
    "appliance_based": [
      { "type": "SERVER", "count": 0 },
      { "type": "WORKSTATION", "count": 4 }
    ],
    "d2c": [
      { "type": "SERVER", "count": 2 },
      { "type": "WORKSTATION", "count": 7 }
    ],
    "cloud_archive": [
      { "type": "SERVER", "count": 2 },
      { "type": "WORKSTATION", "count": 0 }
    ]
  }
}
```

### Protected-System Counters

`devices_counters` breaks the client's protected systems into three
independent buckets, each split by `SERVER`/`WORKSTATION`:

| Bucket | Meaning |
|--------|---------|
| `appliance_based` | Backed up to a local Axcient appliance |
| `d2c` | Direct-to-cloud — no local appliance, agent replicates straight to Axcient's cloud |
| `cloud_archive` | Long-term cloud archive copies |

A device can appear in more than one bucket (e.g. appliance-based **and**
cloud-archived via vault replication). Sum the buckets to get a client's
total protected-system count; do not assume they're mutually exclusive.

### Client Health Status

`health_status` is a client-level rollup (values observed: `NORMAL`, and
presumably `WARNED`/`CRITICAL` mirroring the device-level status model — see
the `devices` skill). It reflects the worst device under that client, not an
independently-computed value. To find *which* device is dragging a client's
health down, call `axcient_list_devices_by_client` and inspect each
device's own `current_health_status`.

### Minting a D2C Agent Token

```
axcient_get_d2c_agent_token
```

Parameters:
- `client_id` -- The client to enroll the new agent under (required)
- `vault_id` -- The vault the agent will replicate to (required)

Returns short-lived credential material for installing a **new**
direct-to-cloud backup agent. This is a provisioning action, not a
read — every call issues fresh token material. It does not affect any
agent already enrolled, and it cannot be used to recover or inspect an
existing agent's credentials.

## Common Workflows

### Client Health Triage

1. `axcient_list_clients` — scan `health_status` across all clients
2. For any client not `NORMAL`, `axcient_list_devices_by_client` on that
   `client_id` to find the specific device(s) failing
3. `axcient_get_device` on the failing device(s) for
   `current_health_status.reason` and timestamps
4. Cross-reference with `axcient_list_jobs_by_device` /
   `axcient_get_job_history` — a device can be "healthy" by its own status
   while its most recent job run failed

### Enrolling a New D2C Agent

1. Confirm the target client with `axcient_get_client`
2. Confirm the target vault exists and is reachable with `axcient_get_vault`
   (see the `vaults` skill — private vaults may have connectivity
   constraints a cloud vault doesn't)
3. `axcient_get_d2c_agent_token` with that `client_id`/`vault_id`
4. Hand the returned token to whoever is installing the agent — it is not
   something this tool surface can retrieve again after the fact

## Error Handling

### Client Not Found

**Cause:** Invalid `client_id`, or the client belongs to a different
organization than the API key's
**Solution:** Verify against `axcient_list_clients`. A non-numeric
`client_id` surfaces as a 401, not a 400 — see the `api-patterns` skill.

### D2C Token Request Fails with 403

**Cause:** The API key's account lacks permission to provision new agents
**Solution:** This is an admin-gated operation on Axcient's side; the key
needs elevated permissions, not a retry.

## Best Practices

- Treat `health_status` as a starting point for triage, not the final
  answer — it tells you *which* client needs attention, not *why*.
- `client_code` is the short human identifier used elsewhere in Axcient's
  UI and reports; surface it alongside `name` when presenting client lists
  to a technician who already knows the codes.
- Don't call `axcient_get_d2c_agent_token` speculatively — each
  call provisions real enrollment material. Confirm the client and vault
  first.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [devices](../devices/SKILL.md) - Device-level health and protection detail
- [vaults](../vaults/SKILL.md) - Vault selection for D2C enrollment
- [appliances](../appliances/SKILL.md) - Appliance inventory per client
