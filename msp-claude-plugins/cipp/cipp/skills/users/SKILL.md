---
name: "cipp-users"
description: "The full multi-tenant M365 user lifecycle in CIPP: create/edit/disable, password and MFA resets, session revocation, the bundled offboarding call, BEC investigation reports, MFA gap reporting, and device/group lookups — plus the ordering constraints that make each sequence correct."
when_to_use: >-
  When creating, editing, disabling, offboarding, or auditing M365 users via CIPP — including
  password resets, MFA resets, session revocation, BEC checks, and MFA enrollment reports. Use
  when: cipp user, create m365 user, disable user, offboard user, reset password, reset mfa,
  revoke sessions, bec check, mfa status, user devices, user groups, m365 offboarding, or business
  email compromise.
---

# CIPP User Management

User management is the highest-volume MSP workflow against CIPP. Every step of the M365 user lifecycle — onboarding, role changes, security incidents, offboarding — has a dedicated tool. Most calls require `tenantFilter`; resolve it via `cipp_list_tenants` before you start.

## Anti-triggers

- **Mailbox-side work during an offboard** — delegate/full-access
  audits, out-of-office, and forwarding are Exchange operations with
  their own tools; use `cipp-mailboxes`. (`cipp_offboard_user` bundles
  OOO and forwarding, but only as offboarding parameters.)
- **A single tenant you hold direct credentials for** — CIPP routes
  through a CSP/GDAP delegation and needs `tenantFilter` on every call.
  Direct Graph work against one tenant is the `m365` plugin
  (`Microsoft 365 Users`) or `microsoft-graph-querying`.
- **Reading who exists for a governance or baseline review** — that is
  read-only identity inventory, not administration; use
  `inforcer-identity-governance`.
- **Creating or auditing the groups themselves** — this skill only
  reads a user's memberships (`cipp_list_user_groups`); use
  `cipp-groups`.
- **A "user" in a security or training console** — Blumira users are
  console operators and KnowBe4 users are training enrollees; neither
  is an Entra identity and neither is administered through CIPP. Use
  `blumira-users` or `knowbe4-users`.

## Tool surface

### Listing & lookup

```
cipp_list_users(tenantFilter='contoso.onmicrosoft.com')
cipp_list_mfa_users(tenantFilter='contoso.onmicrosoft.com')
cipp_list_user_devices(tenantFilter=..., userId='upn-or-objectId')
cipp_list_user_groups(tenantFilter=..., userId='upn-or-objectId')
```

`cipp_list_mfa_users` is the fastest way to find users without strong auth methods registered. Use it for security posture reviews and for bulk MFA enrollment campaigns.

### Lifecycle

```
cipp_create_user(tenantFilter, displayName, userPrincipalName, password,
                 givenName?, surname?, jobTitle?, department?, country?)

cipp_edit_user(tenantFilter, userId, displayName?, jobTitle?, department?, ...)

cipp_disable_user(tenantFilter, userId)
```

A license can't be assigned until the user has a usage location (an ISO 2-letter country code). `cipp_create_user` has no usage location param (`country` is the address field, not the usage location), so set `usageLocation` with `cipp_edit_user` before assigning licenses.

`cipp_edit_user` looks up the account's current UPN via CIPP `ListUsers` before it calls `EditUser`. CIPP rebuilds the UPN from username + domain on every edit, so editing without that UPN would rename the account. Right after `cipp_create_user`, Graph can lag and the user may not be visible yet, so the lookup retries up to 4 attempts, waiting 1s/3s/6s (~10s total), when the user isn't found (empty result, HTTP 404, or Graph `Request_ResourceNotFound`). Other errors aren't retried. If the edit still fails with a not-found error, wait a moment and retry it.

### Security actions

```
cipp_reset_password(tenantFilter, userId)  # CIPP generates the new password (or a PWPush link if PWPush is enabled)
cipp_reset_mfa(tenantFilter, userId)                        # clears all registered MFA methods
cipp_revoke_sessions(tenantFilter, userId)                  # invalidates all active tokens
cipp_bec_check(tenantFilter, userId)                        # BEC investigation report
```

`cipp_bec_check` runs a Business Email Compromise investigation: inbox rules, recent sign-in locations, MFA changes, mailbox forwarding rules, suspicious app consents. Always the first call when a user reports a phishing-related compromise — before disabling the account, while session telemetry is still live.

### Full offboarding

```
cipp_offboard_user(tenantFilter, userId,
                   convertToShared?, removeLicenses?,
                   removeFromGroups?, forwardingAddress?,
                   outOfOfficeMessage?, ...)
```

This single call wraps the canonical CIPP offboarding sequence: disable, revoke sessions, optional license reclaim, optional shared-mailbox conversion, optional forwarding, optional OOO message, group removal. Prefer this over chaining `disable_user` + `revoke_sessions` manually unless you need step-by-step control (in which case use the `user-offboarding-runner` agent).

## Workflow patterns

### Suspected BEC compromise

1. `cipp_bec_check` — capture the forensic snapshot before changing anything
2. `cipp_revoke_sessions` — kick the attacker out of all active sessions
3. `cipp_reset_password` — CIPP generates the new password (or a PWPush link); share it via a secure channel
4. `cipp_reset_mfa` — clear attacker-registered methods; user re-enrolls
5. Review the BEC report for inbox forwarding rules and remove them

### Standard offboarding

Use `cipp_offboard_user` with the org's policy defaults. For high-trust environments, do a dry-run review first:

1. `cipp_list_user_groups` — note group memberships (audit trail)
2. `cipp_list_user_devices` — flag company-owned devices for retrieval
3. Check `cipp_list_mailbox_permissions` on the user's mailbox (delegates may exist)
4. `cipp_offboard_user` with `convertToShared=true`, `removeLicenses=true`, `forwardingAddress=manager-upn`

### MFA gap report

```
mfa_users = cipp_list_mfa_users(tenantFilter='allTenants')
gaps = [u for u in mfa_users if not u.get('mfaRegistered')]
```

Use this monthly across the portfolio to drive MFA enforcement campaigns.

## Identifying a user

`userId` accepts either the Azure AD object GUID or the userPrincipalName. UPN is more readable; GUID is more stable across UPN changes. CIPP returns both — pick one and stay consistent within a workflow.
