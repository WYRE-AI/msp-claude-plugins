---
name: "Axcient Vaults"
description: >
  Axcient x360Recover vaults: Private vs Cloud vault types, storage
  capacity, and the connectivity-loss alert threshold — including
  axcient_set_vault_threshold, the one tool in this plugin that changes
  alerting configuration rather than just reading it.
when_to_use: >-
  When looking up Axcient vault capacity, connectivity status, or adjusting
  the connectivity-loss alert threshold. Use when: axcient vault, private
  vault, cloud vault, vault threshold, vault capacity, or x360recover vault.
---

# Axcient Vaults

## Overview

A vault is a replication target — either a **Private** vault (customer- or
partner-owned on-prem storage) or a **Cloud** vault (Axcient-hosted). Devices
replicate to one or more vaults; a vault's `storage_details` reports how
much of its capacity is in use.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `axcient_list_vaults` | Every vault visible to this credential | `vault_type?` (`Private`\|`Cloud`), `active?`, `with_url?`, `limit?`, `include_devices?` |
| `axcient_get_vault` | One vault's detail | `vault_id` |
| `axcient_get_vault_threshold` | Current connectivity-loss threshold | `vault_id` |
| `axcient_set_vault_threshold` | **Changes** the connectivity-loss threshold | `vault_id`, `threshold` (minutes) |

### Vault Type & Capacity

```json
{
  "storage_details": { "used_size": 40900613898, "drive_size": 58581416960 }
}
```

`drive_size` is only meaningful for **Private** vaults — it's the storage
allotted on customer-owned hardware. Cloud vaults are elastic; a
`drive_size` on a Cloud vault does not represent a hard ceiling the way it
does on a Private vault.

### Connectivity Threshold

```
axcient_get_vault_threshold
```

Returns `connectivity_threshold` — the number of minutes a vault can be
unreachable before Axcient raises a WARNED status on it. This is
vault-level, distinct from a job's own `vault_rp_threshold` (see the `jobs`
skill), which governs recovery-point age rather than reachability.

### Changing the Threshold

```
axcient_set_vault_threshold
```

⚠ **HIGH-IMPACT.** Raising this threshold delays how quickly a vault
connectivity loss surfaces as an alert; lowering it makes the vault more
sensitive to brief network blips. This changes what technicians and
monitoring integrations see as "healthy," not the underlying data. Confirm
the intended value and the business reason (e.g. a site with known
intermittent WAN) with the requester before calling this — a threshold set
too high silently masks a real outage for longer than expected.

Parameters:
- `vault_id` -- required
- `threshold` -- new value in minutes

This is reversible (call it again with the prior value), but the interval
between the change and its reversal is a real window where alerting
behavior differs from what was configured before.

## Common Workflows

### Capacity Check Before a Large Restore or New Enrollment

1. `axcient_get_vault` for the target vault
2. Compare `storage_details.used_size` against `drive_size` (Private vaults
   only — Cloud vaults don't need this check)
3. For a Private vault near capacity, flag it before recommending new
   device enrollment (`axcient_get_d2c_agent_token`) against it

### Investigating a Vault Connectivity Alert

1. `axcient_get_vault` for current state
2. `axcient_get_vault_threshold` to confirm what threshold is actually
   configured — an alert firing "too eagerly" is often a threshold that
   doesn't match the site's real network characteristics, not a genuine
   fault
3. Only call `axcient_set_vault_threshold` after confirming with the
   requester that adjusting sensitivity (rather than fixing connectivity)
   is the intended response

## Error Handling

### Vault Not Found

**Cause:** Invalid `vault_id`, or the vault belongs to a different
organization
**Solution:** Verify against `axcient_list_vaults`.

### Set Threshold Returns 403

**Cause:** Vault threshold mutation is a permissions-gated operation on
Axcient's side (per the upstream API's documented error shapes)
**Solution:** The API key needs elevated permissions; this is not a retry
situation.

## Best Practices

- Never call `axcient_set_vault_threshold` without an explicit, confirmed
  target value from the requester — see the destructive-tool note above.
- Filter `axcient_list_vaults` by `vault_type` when the question is
  specifically about on-prem capacity or specifically about cloud
  replication; the combined list mixes both and capacity semantics differ
  between them.
- Use `include_devices` on list/get calls when you need to know which
  devices depend on a given vault before touching its configuration.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [devices](../devices/SKILL.md) - Device-level vault usage and recovery-point timestamps
- [jobs](../jobs/SKILL.md) - Job-level recovery-point-age thresholds (distinct from vault connectivity thresholds)
- [clients](../clients/SKILL.md) - D2C agent enrollment targets a specific vault
