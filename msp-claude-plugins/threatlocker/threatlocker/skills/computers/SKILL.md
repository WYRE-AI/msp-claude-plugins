---
name: "ThreatLocker Computers"
description: >
  ThreatLocker-protected endpoints: fleet inventory, identifying offline agents, a
  single computer's check-in history, and correlating computers across organizations and
  groups.
when_to_use: >-
  When listing, inspecting, or auditing ThreatLocker computers across one or many
  organizations, including offline-agent triage and check-in history. Use when:
  threatlocker computer, threatlocker endpoint, threatlocker agent inventory,
  threatlocker offline, threatlocker last seen, threatlocker checkin, threatlocker
  fleet, or endpoint inventory threatlocker.
---

# ThreatLocker Computers

Computers (endpoints) are the unit of protection in ThreatLocker.
Every protected machine has an agent that checks in periodically and
is bound to a computer group, which in turn carries the policies that
govern allow/deny behavior. This skill covers fleet inventory, offline
agent identification, and drilling into a single endpoint's history.

## Anti-triggers

- **Machines without a ThreatLocker agent.** This list is the protected
  fleet only, so it can never answer "what else is on this network".
  Discovery of unmanaged, IoT, and OT devices is `runzero-assets`; live
  network devices and topology are `auvik-devices`.
- **Another vendor's sensor fleet.** Agent counts do not reconcile
  across products — use `sentinelone-inventory` or `huntress-agents`.
- **Which policies apply to a machine.** Policy is attached to the group,
  never to the computer — use `threatlocker-computer-groups`.

## API Tools

### List Computers

```
threatlocker_computers_list
```

POST-based `GetByParameters` endpoint — see `api-patterns` for the
request body shape. Common parameters:

- `pageNumber`, `pageSize`, `isAscending`, `orderBy`
- `searchText` — substring match on computer name, hostname, OS, etc.
- `childOrganizations` — set `true` to roll up across all child orgs
- `organizationId` header — scope to a single tenant

Each returned computer typically includes `computerId`, `computerName`,
`hostname`, `operatingSystem`, `lastCheckin`, `computerGroupId`,
`computerGroupName`, `organizationId`, `organizationName`, and
`agentVersion`.

### Get Computer

```
threatlocker_computers_get
```

Pulls full detail for one computer including hardware, current
policy mode (Learning/Secured/Lockdown), enforcement status, and
recent activity counts.

### Get Check-ins

```
threatlocker_computers_get_checkins
```

Returns recent check-in records for a computer — useful for
distinguishing a healthy-but-quiet endpoint from a true offline one,
and for identifying flapping agents that come and go.

## Common Workflows

### Fleet Inventory

1. Call `threatlocker_computers_list` with `pageSize: 100`,
   `orderBy: "computerName"`.
2. Page through `totalItems`, accumulating results.
3. For an MSP-wide view, set `childOrganizations: true` and group
   results by `organizationName` after fetching.

### Offline Agent Triage

Recency tiers we use in practice:

| Bucket | `lastCheckin` age | Action |
|--------|-------------------|--------|
| Fresh | < 24h | Healthy |
| Stale | 24h–7d | Investigate (reboot, network) |
| Cold | 7d–30d | Open ticket; possible decommission |
| Dead | > 30d | Confirm decommissioned and remove |

1. Pull computers with `orderBy: "lastCheckin"`, `isAscending: true`.
2. The oldest check-ins surface first — bucket them and produce a
   per-bucket count.
3. For Stale endpoints, call `threatlocker_computers_get_checkins`
   to see whether check-ins are flapping vs. truly stopped.

### Drilling From a Group to its Computers

1. Identify the group with the `computer-groups` skill.
2. Filter `threatlocker_computers_list` results client-side by
   `computerGroupId` (the API does not currently expose a group filter
   parameter on the list endpoint — fetch and filter).
3. For each computer in the group, optionally call
   `threatlocker_computers_get` for policy mode and enforcement state.

### Per-OS Breakdown

Use `searchText` to scope results to an OS string (e.g. `"Windows
Server 2019"`, `"macOS"`, `"Windows 10"`), or fetch the full set and
bucket on `operatingSystem` client-side. Substring match means partial
strings like `"Windows 11"` work.

## Edge Cases

- **Multi-org agents** — A single API key may see computers across many
  child organizations. Always include `organizationId` /
  `organizationName` in your output so an analyst can see which tenant
  a computer belongs to.
- **Recently re-imaged hosts** — A re-imaged endpoint can register as a
  new computer with the same hostname. If you see two records with the
  same `hostname` but different `computerId`, prefer the one with the
  most recent `lastCheckin`.
- **Time zones** — `lastCheckin` is UTC. Convert before showing it to a
  human, especially for "X hours ago" framing.
- **Search performance** — Avoid `searchText: ""` plus `pageSize: 1000`.
  Stick to 50–200 per page.

## Best Practices

- Treat `lastCheckin` as your primary health signal; other fields lag.
- For MSP fleet reports, always group by organization first, then by
  group, before listing individual machines.
- Cross-reference with the RMM device count per org — a delta usually
  means an unprotected endpoint, which is the highest-priority gap.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — Pagination and auth
- [computer-groups](../computer-groups/SKILL.md) — Policy scoping
- [audit-log](../audit-log/SKILL.md) — Per-computer event timeline
- [organizations](../organizations/SKILL.md) — Multi-tenant pivot
