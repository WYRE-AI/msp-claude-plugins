---
name: "Inforcer Identity Governance"
description: >
  Inforcer's read-only identity inventory for a managed Microsoft 365
  tenant: users, groups, and role assignments. Answers "who and what
  exists" for governance and review rather than performing user
  administration. Covers the integer Client Tenant ID scoping every
  identity call requires.
when_to_use: >-
  When reading a tenant's users, groups, or role assignments through Inforcer.
  Use when: inforcer users, inforcer groups,
  inforcer roles, identity inventory, tenant users inforcer, role assignments inforcer, who has
  access inforcer, or identity governance inforcer.
---

# Inforcer Identity Governance

Inforcer exposes a **read-only** view of a managed tenant's identity
objects — users, groups, and role assignments. This is an inventory and
governance surface: it answers "who exists, what groups exist, and who
holds which roles" so you can review identity posture alongside baseline
alignment. It does **not** create, edit, disable, or offboard
users — there is no identity *administration* here.

Read [api-patterns](../api-patterns/SKILL.md) first for the gateway
headers, the region requirement, the envelope, and pagination, and
[tenant-management](../tenant-management/SKILL.md) for resolving a tenant
to its **integer Client Tenant ID**. Every identity call is tenant-scoped
by that integer id.

## Anti-triggers

- **Any change to a user, group, or role** — create, edit, disable,
  reset MFA, revoke sessions, offboard, or strip a privileged role are
  all absent here. Use `cipp-users` and `cipp-groups`, or the `m365`
  plugin.
- **The word "governance" meaning policy configuration** — this skill
  inventories identity *objects*; policy state and its drift are
  `inforcer-baseline-alignment`.
- **Who did what, and when** — role membership is a snapshot, not a
  history; use `inforcer-audit-events`.

## Tools

### `inforcer_users_list`

List the users in a tenant. Returns user objects (display name, UPN/email,
enabled state, and — where present — assigned roles or licensing hints).

```
inforcer_users_list(clientTenantId=1423)
```

Use this to enumerate the identity surface of a tenant: who has accounts,
which look stale or disabled, and which are candidates for closer review.

### `inforcer_groups_list`

List the groups in a tenant. Returns group objects (name, type, and
membership where the API exposes it).

```
inforcer_groups_list(clientTenantId=1423)
```

Groups frequently gate access (security groups, distribution lists,
role-assignable groups). Listing them shows the access-grouping structure
without changing it.

### `inforcer_roles_list`

List role assignments in a tenant — who holds which administrative or
privileged roles.

```
inforcer_roles_list(clientTenantId=1423)
```

This is the highest-signal identity call for security review: privileged
role membership (Global Admin and equivalents) is where the blast radius
of a compromised account is largest. Surface unexpected or excessive
privileged assignments as findings.

## What to look for in an identity review

| Finding | Why it matters |
|---------|----------------|
| Many users holding privileged roles | Over-broad admin assignment widens the attack surface |
| Privileged role on a generic / shared account | Hard to attribute actions; weakens accountability |
| Stale or disabled accounts still present | Dormant accounts are a credential-theft target |
| Groups granting broad access | Membership sprawl quietly expands who can reach what |

## Workflow patterns

### Single-tenant identity snapshot

```
ctid   = resolve("Acme")              # integer Client Tenant ID
users  = inforcer_users_list(clientTenantId=ctid)
groups = inforcer_groups_list(clientTenantId=ctid)
roles  = inforcer_roles_list(clientTenantId=ctid)
```

Page each list to completion on `continuationToken` before reporting
counts — a partial page understates the inventory. Pair the role list with
the user list to attribute each privileged role to a named identity.

### Portfolio privileged-access sweep

For each tenant from `inforcer_tenants_list`, pull `inforcer_roles_list`
and flag tenants with excessive or unexpected privileged-role membership.
This complements a baseline drift sweep: alignment tells you the tenant
diverges from policy; the role list tells you *who could change things*.

## Caveats

- This surface is strictly **read-only**. You can inventory users, groups,
  and roles, but you **cannot** create/edit/disable users, change group
  membership, or alter role assignments through this API. Identity
  *administration* is not part of Inforcer's surface — surface remediation
  as a recommendation (e.g. "remove the standing Global Admin from this
  service account"), to be actioned in the appropriate admin tool.
- The API is **community-sourced** (no official public docs); field names
  for user, group, and role objects are illustrative and credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
  Verify the exact shape on first use.
- Identity calls are tenant-scoped by the **integer Client Tenant ID**.
  A GUID or domain that reaches the path unresolved is the most common
  cause of an empty result — re-resolve via `inforcer_tenants_list`.

## Related Skills

- [tenant-management](../tenant-management/SKILL.md) - resolve a tenant to the integer Client Tenant ID before scoping
- [baseline-alignment](../baseline-alignment/SKILL.md) - identity-control drift against the assigned baseline
- [audit-events](../audit-events/SKILL.md) - what those identities actually did (event history)
- [api-patterns](../api-patterns/SKILL.md) - headers, region, envelope, pagination, and the integer-id gotcha
