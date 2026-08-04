---
name: "cipp-security"
description: "Read-only access to a tenant's Conditional Access policy graph and named locations through CIPP: policy state semantics, the findings that matter in a CA review, portfolio drift detection, and why CA writes are absent from the MCP surface."
when_to_use: >-
  When auditing conditional access policies or named locations across managed tenants for security
  posture review. Use when: conditional access, ca policy, named locations, trusted ips, cipp
  security, mfa enforcement, security posture, or location based access.
---

# CIPP Security — Conditional Access & Named Locations

Read-only access to a tenant's Conditional Access policy graph and named-location list. Use as input to security posture reviews and to detect tenants drifting from MSP baseline policies. CIPP doesn't expose CA write operations through MCP — apply policy changes via CIPP standards or the CIPP UI.

## Anti-triggers

- **Creating, editing, or deploying a CA policy** — there is no CA
  write tool here; policy rollout goes through `cipp-standards` or the
  CIPP UI.
- **Who has actually registered MFA** — CA tells you what is *required*,
  not what users have *enrolled*; `cipp_list_mfa_users` in `cipp-users`
  answers the enrolment question.
- **Defender, secure score, or threat policies for one tenant you hold
  credentials for** — that is the `m365` plugin's
  `Microsoft 365 Security`; this skill is CSP-delegated and CA-only.
- **Portfolio-wide posture scoring** — comparing tenants against a
  baseline template is `cipp-standards` or
  `inforcer-compliance-reporting`.

## Tools

### `cipp_list_conditional_access_policies`

```
cipp_list_conditional_access_policies(tenantFilter='contoso.onmicrosoft.com')
```

Returns every CA policy with `displayName`, `state` (`enabled` / `disabled` / `enabledForReportingButNotEnforced`), `conditions` (users, apps, locations, platforms, sign-in risk), and `grantControls` (MFA, compliant device, terms of use, etc).

### `cipp_list_named_locations`

```
cipp_list_named_locations(tenantFilter='contoso.onmicrosoft.com')
```

Returns named locations: IP ranges (trusted/untrusted) and country-based locations. These are the building blocks CA policies reference for location-based controls.

## What to look for in a CA review

| Finding | Why it matters |
|---------|----------------|
| Zero policies in `enabled` state | Tenant has no CA enforcement at all — a baseline `enabledForReportingButNotEnforced` doesn't block anything |
| MFA not required for "All cloud apps" | A baseline policy is missing or scoped too narrowly |
| Policies excluding the entire admin role | Common configuration mistake; admins should require *more* MFA, not less |
| Trusted location includes home/coffee-shop IPs | Named-location bloat creates exception paths for attackers |
| `legacy authentication` not blocked | Basic auth bypasses MFA entirely; should be blocked tenant-wide |
| Reporting-only policies older than 30 days | Should have been promoted to `enabled` or removed |

## Workflow patterns

### Tenant CA baseline check

```
policies = cipp_list_conditional_access_policies(tenantFilter)
enabled = [p for p in policies if p['state'] == 'enabled']
mfa_for_all_apps = any(
    p for p in enabled
    if 'mfa' in p.get('grantControls', {}).get('builtInControls', [])
    and 'All' in p.get('conditions', {}).get('applications', {}).get('includeApplications', [])
)
```

If `mfa_for_all_apps` is false, the tenant lacks the baseline "MFA for everything" policy that every MSP should ship as a standard.

### Portfolio drift detection

Run `cipp_list_conditional_access_policies` per tenant and compare the policy fingerprint (display names + `state` + grant controls) against the MSP's golden baseline. Flag tenants where any baseline policy is missing or disabled.

## Caveats

- CA write operations (create/edit/delete) are not exposed via MCP. Use CIPP standards (`cipp_run_standards_check` and the standards UI) to deploy policy templates across tenants, or do it manually via the CIPP web UI.
- Named locations are a **trust amplifier** — review them as carefully as policies. A misconfigured trusted IP range can quietly exempt entire networks from MFA.
- `enabledForReportingButNotEnforced` looks like coverage in dashboards but enforces nothing. Always check `state == 'enabled'` for actual enforcement.
