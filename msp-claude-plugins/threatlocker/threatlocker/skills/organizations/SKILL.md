---
name: "ThreatLocker Organizations"
description: >
  The ThreatLocker MSP multi-tenant model: enumerating child organizations, retrieving
  per-org auth keys, and identifying valid move targets when relocating computers
  between tenants.
when_to_use: >-
  When fanning out reports across child orgs, retrieving an org's auth key, or moving
  computers between organizations. Use when: threatlocker organization, threatlocker
  tenant, threatlocker child orgs, threatlocker partner, threatlocker auth key, move
  computer threatlocker, threatlocker multi-tenant, or threatlocker mssp.
---

# ThreatLocker Organizations

ThreatLocker is built for MSPs and treats each customer as a child
organization beneath the partner organization. The API key you
authenticate with belongs to a parent (partner) org and can see all
of its children. Most fleet-wide reporting and any tenant pivot work
runs through this skill.

## Anti-triggers

- **Policy scope.** An organization is a tenant boundary; the thing that
  decides which allow/deny rules apply is the computer group — use
  `threatlocker-computer-groups`.
- **An M365 tenant.** ThreatLocker child orgs and Microsoft tenants are
  separate directories that happen to describe the same customer; tenant
  onboarding, GDAP, and standards live in `cipp-tenants`.

## API Tools

### List Child Organizations

```
threatlocker_organizations_list_children
```

Returns the full list of child organizations visible to the
authenticated key — typically `organizationId`, `organizationName`,
`isPartner`, `parentOrganizationId`, computer counts, and creation
timestamp. This is the first call in nearly every multi-tenant
workflow.

### Get Organization Auth Key

```
threatlocker_organizations_get_auth_key
```

Retrieves the auth key for a specific child organization. Used
during agent provisioning and when a per-org integration (e.g. a
client-facing dashboard) needs its own scoped credential.

> **Treat this output like any other secret.** Don't paste it into
> tickets, chat, or unencrypted notes.

### Organizations Eligible for Move

```
threatlocker_organizations_for_move_computers
```

Returns the orgs that are valid destinations when relocating a
computer — usually a subset of child orgs filtered by partnership and
permission. Not the same as the full child list.

## Key Concepts

### Partner vs Customer Org

- **Partner org** — Top-level MSP tenant. Holds the API key, owns
  global computer groups, and parents customer orgs.
- **Customer (child) org** — One per MSP client. Holds that client's
  computers, org-specific groups, approvals, and Action Log entries.

### How Tenant Scoping Works

Three ways to scope a call to a specific tenant:

1. Set the `organizationId` header on the HTTP call.
2. Send `childOrganizations: true` in a `GetByParameters` body to
   roll across all children at once.
3. Omit both — the API key's primary org is used.

See `api-patterns` for header/body details.

## Common Workflows

### MSP Multi-Tenant Pivot

The fan-out pattern for any per-client report:

1. `threatlocker_organizations_list_children` to enumerate.
2. For each child, scope subsequent calls via the `organizationId`
   header and produce per-tenant numbers.
3. Or, if the entity supports it, use `childOrganizations: true` once
   and bucket results client-side by `organizationId`.

### Onboarding a New Client Org

When a new customer is added in the ThreatLocker portal:

1. `threatlocker_organizations_list_children` and confirm the new
   org appears.
2. `threatlocker_organizations_get_auth_key` for the new org and
   securely transmit the key to the deployment team.
3. After agent rollout, validate computer count via the `computers`
   skill and confirm at least one Action Log entry per endpoint via
   `audit-log`.

### Moving Computers Between Orgs

This happens when a client splits, merges, or you discover a computer
was registered to the wrong tenant:

1. `threatlocker_organizations_for_move_computers` to confirm the
   target org is move-eligible.
2. Issue the move via the appropriate computer endpoint (the
   ThreatLocker portal also exposes this in the UI).
3. Re-pull the computer with `threatlocker_computers_get` and confirm
   the new `organizationId` and that the `computerGroup` reset to
   the destination org's default.

### Per-Tenant Approval Queue Audit

1. List children.
2. For each, set `organizationId` header and call
   `threatlocker_approvals_pending_count`.
3. Output a per-tenant pending count to spot the org generating the
   most queue pressure (often a sign of policy mode mismatch or a
   newly onboarded client still in baseline).

## Edge Cases

- **Inactive or hidden orgs** — Some child orgs are archived or
  hidden. The list endpoint may include a flag; ignore those for
  fleet reports.
- **Stale auth keys** — A previously retrieved auth key continues to
  work until rotated. Don't assume the key in your records is
  current; pull fresh when in doubt.
- **Move eligibility surprises** — `for_move_computers` filters by
  partner relationship. If an org isn't in the result, the source
  org's parent doesn't have permission to move into it.

## Best Practices

- Cache the child list for a session — it rarely changes mid-session.
- Always include both `organizationId` and `organizationName` in
  multi-tenant reports so a reader knows which client a number
  refers to.
- Treat auth keys as secrets in transit (encrypted vaults, not
  tickets) and at rest.
- Before any move, snapshot the source computer record so you can
  confirm post-move state.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — `organizationId` header
  and `childOrganizations` body flag
- [computers](../computers/SKILL.md) — Computers within an org
- [approval-requests](../approval-requests/SKILL.md) — Per-tenant queue
- [audit-log](../audit-log/SKILL.md) — Per-tenant Action Log
