---
name: "Bitwarden Security Posture"
description: >
  Assessing a client's Bitwarden organization posture from the read-only
  Public API: which security policies are enabled and how they are set,
  two-step login coverage across confirmed members, owner and admin sprawl,
  members stuck in Invited or Accepted, and the SSO caveat on the 2FA flag.
  Produces a scored posture summary with remediation steps for the Admin
  Console.
when_to_use: >-
  When reviewing how well a client's Bitwarden organization is locked down,
  preparing a security review or QBR, or checking a compliance control that
  depends on the password manager. Use when: bitwarden policies, bitwarden
  2fa coverage, who lacks two-step login, bitwarden mfa posture, master
  password policy, vault timeout policy, bitwarden owners and admins, or
  password manager compliance check.
---

# Bitwarden Security Posture

## Overview

A password manager is only as strong as its policies and its weakest admin.
This skill turns three read calls into a posture summary an MSP can act on:
the policy set (`bitwarden_policies_list`), the membership with its roles
and 2FA flags (`bitwarden_members_list`), and, where needed, a single policy's
settings (`bitwarden_policies_get`).

All three tools are read tier in Conduit. None of the posture checks need the
admin-gated `bitwarden_events_list`; use it only to answer "when did this
policy change?" (see [event-log-review](../event-log-review/SKILL.md)).

This plugin cannot change a policy or a member. Every finding is a
recommendation for an owner or admin to carry out in the Admin Console.

## Anti-triggers

- **A specific departing user's access** — use
  [offboarding-access-review](../offboarding-access-review/SKILL.md).
- **Seat counts and billing** — use
  [license-reconciliation](../license-reconciliation/SKILL.md).

## Key Concepts

### Policies that matter in a review

`bitwarden_policies_list` returns every policy that has ever been configured,
each with `type`, `enabled` and a `data` object whose shape depends on the
type. A policy missing from the list was never configured; treat it as off.
`bitwarden_policies_get` answers 404 for the same case.

| Type | Policy | Why an MSP cares | Expected for a managed client |
|---|---|---|---|
| 0 | TwoFactorAuthentication | Requires members to use two-step login | On, unless SSO with IdP MFA covers everyone |
| 1 | MasterPassword | Minimum length and complexity for master passwords | On; read `data` for the settings |
| 3 | SingleOrg | Stops members joining other Bitwarden organizations | On (required by RequireSso) |
| 4 | RequireSso | Members log in through the client's identity provider | On where the client has an IdP |
| 5 | OrganizationDataOwnership | Items are saved to the organization, not personal vaults | On for most business clients |
| 8 | ResetPassword | Account recovery: admins can reset an enrolled member's master password | Deliberate choice; know which way it is set |
| 9 | MaximumVaultTimeout | Caps how long a vault stays unlocked | On; read `data` for the limit |
| 10 | DisablePersonalVaultExport | Blocks members exporting their individual vault | On where data loss prevention matters |
| 6 | DisableSend | Blocks Bitwarden Send | Client choice; note it |
| 14 | RemoveUnlockWithPin | Removes PIN unlock | Client choice; note it |

Check Bitwarden's
[policies documentation](https://bitwarden.com/help/policies/) for the exact
behaviour of each policy, including who it exempts, before telling a client
what it enforces.

### The 2FA flag and SSO

`twoFactorEnabled` on a member is Bitwarden's own two-step login. When the
organization uses RequireSso, members sign in through the identity provider,
which may enforce MFA itself. A `false` flag on an SSO organization is
therefore not proof of missing MFA: confirm the IdP's MFA rules (for
example Entra conditional access) before reporting it as a gap.

### Who counts

Only **Confirmed** members (`status` 2) can use organization data. Count 2FA
coverage over confirmed members. Report Invited (0) and Accepted (1) members
separately; Revoked (-1) members have no access and are excluded.

## Common Workflows

### Posture review for one client

1. Call `bitwarden_policies_list`. Build the table above with each policy's
   enabled state. For MasterPassword and MaximumVaultTimeout, read the
   `data` settings. Call `bitwarden_policies_get` only if you need one
   policy's detail on its own.
2. Call `bitwarden_members_list`. Check for `truncated: true` first (see
   [api-patterns](../api-patterns/SKILL.md)); if the list is cut, say the
   coverage figures are partial.
3. Over confirmed members, compute:
   - 2FA coverage: members with `twoFactorEnabled` true, as a count and
     a percentage.
   - Owners (`type` 0), Admins (1) and Custom (4), each with their 2FA
     state.
4. List members stuck in Invited or Accepted. Accepted members are waiting
   for an admin to confirm them and cannot see shared items yet.
5. Rank the findings (see below) and write the summary.

### Ranking findings

1. **Owner or admin without 2FA** (and no SSO-enforced MFA). An owner holds
   the organization API key and can export everything shared.
2. **TwoFactorAuthentication policy off** with confirmed members lacking
   2FA.
3. **No MasterPassword policy**, or one with weak settings.
4. **Too many owners or admins** for the size of the organization. Two
   owners (a primary and a break-glass account) is a common target; more
   needs a reason.
5. **SingleOrg or RequireSso off** where the client has an identity
   provider.
6. **Stale Invited / Accepted members**: access granted on paper, never
   completed.

### Output

A short verdict line, then a table of policies (on / off / not configured,
with key settings), the 2FA coverage figure with the denominator, the owner
and admin list, and a numbered remediation list. Each remediation names the
Admin Console area where an owner or admin makes the change. Never write
that the plugin made a change.

## Gotchas

- **An empty `data` object is normal** for policies without settings, such
  as SingleOrg.
- **A policy can be configured but disabled.** `enabled: false` means off,
  even though it appears in the list.
- **Custom role members** (`type` 4) can hold admin-like permissions.
  Look at what `bitwarden_members_get` returns for them (a `permissions`
  object where present) before calling them ordinary users.
- **Small organizations swing hard.** One member without 2FA in a team of
  four is 75% coverage. Always show the count next to the percentage.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - enums, truncation and errors
- [event-log-review](../event-log-review/SKILL.md) - when a policy or 2FA setting changed
- [license-reconciliation](../license-reconciliation/SKILL.md) - stale invites also distort seat counts
