---
name: "Proofpoint Essentials Org Management"
description: >
  Proofpoint Essentials organization lifecycle: get an org and its domains,
  activate/deactivate, delete, manage domains, toggle features, adjust
  licensing allocation, change package/subscription tier, and mint an
  Odin-based SSO token for console handoff.
when_to_use: >-
  When managing a customer organization's lifecycle, domains, features,
  licensing, or subscription tier in Proofpoint Essentials. Use when:
  proofpoint essentials org, add domain, remove domain, activate org,
  deactivate org, delete org, proofpoint essentials features, proofpoint
  essentials licensing, proofpoint essentials package, change subscription
  tier, or proofpoint essentials sso token.
---

# Proofpoint Essentials Org Management

## Overview

An Essentials **organization** is one customer tenant under an MSP's
reseller account: a set of domains, mailbox-protected users, enabled
features, a license allocation, and a package tier. This skill covers the
org-level lifecycle and everything scoped to the org as a whole rather than
to an individual mailbox. Every call here requires the org's regional pod —
resolve it first with `proofpoint_essentials_endpoint_resolve` (see the
`api-patterns` skill) before calling any tool below.

## Anti-triggers

- **Creating or managing individual mailbox users** — that is
  `user-management`. This skill covers the org container, not what's inside
  it.
- **Inbound/outbound mail flow metrics** — that is `reporting`. Org-level
  identity here stops at features, licensing, and package; it does not
  cover message volume or delivery statistics.

## Key Concepts

### Org lifecycle states

| State | Meaning |
|-------|---------|
| Active | Filtering mail flow enabled; domains route through Essentials normally |
| Deactivated | Org suspended — mail flow protection stops, but the org, its domains, and its users are preserved |
| Deleted | Org and its configuration are permanently removed |

**Deactivate is reversible; delete is not.** Deactivating an org (e.g. for a
non-paying customer, or during an offboarding notice period) preserves
everything so it can be reactivated later. Deleting an org removes its
configuration outright. Always prefer deactivate over delete unless the
customer relationship is definitively over.

### Domain states

A domain added to an org must be verified (via DNS TXT record or MX
delegation, configured in the Essentials console) before mail actually
routes through Essentials for it. Adding a domain via the API registers it;
it does not itself complete DNS verification.

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_essentials_org_get` | Get an org's details and its domain list | `org_name` |
| `proofpoint_essentials_org_activate` | Reactivate a deactivated org | `org_name` |
| `proofpoint_essentials_org_deactivate` | Suspend an org (reversible) | `org_name` |
| `proofpoint_essentials_org_delete` | Permanently delete an org | `org_name` |
| `proofpoint_essentials_domains_list` | List an org's domains | `org_name` |
| `proofpoint_essentials_domains_create` | Add one or more domains to an org | `org_name`, `domains[]` |
| `proofpoint_essentials_domains_update` | Update a domain's settings | `org_name`, `domain_name` |
| `proofpoint_essentials_domains_delete` | Remove a domain from an org | `org_name`, `domain_name` |
| `proofpoint_essentials_features_get` | View which product features are enabled for an org | `org_name` |
| `proofpoint_essentials_features_update` | Enable/disable product features for an org | `org_name`, `features` |
| `proofpoint_essentials_licensing_get` | View an org's license allocation | `org_name` |
| `proofpoint_essentials_licensing_update` | Modify an org's license allocation | `org_name`, `license_count` |
| `proofpoint_essentials_package_update` | Change an org's subscription/package tier | `org_name`, `package` |
| `proofpoint_essentials_token_create` | Mint an Odin-based SSO token for console handoff | `org_name` |

`proofpoint_essentials_domains_create` follows the batch-create / 207
Multi-Status pattern described in `api-patterns` when given more than one
domain — check per-domain results rather than treating the call as
all-or-nothing.

## Common Workflows

### Onboard a new customer org

1. Confirm the org already exists on the reseller side (Essentials orgs are
   provisioned through the reseller relationship, not created ad hoc via
   this API surface) and resolve its regional pod.
2. Call `proofpoint_essentials_org_get` to confirm the org is active and
   check its current domain list.
3. Call `proofpoint_essentials_domains_create` with the customer's mail
   domain(s). Check the 207 response for any domain that failed (e.g.
   already claimed by another org).
4. Instruct the customer to complete DNS verification for each new domain
   (TXT record or MX delegation) — the API call alone does not activate
   filtering.
5. Call `proofpoint_essentials_features_get` and
   `proofpoint_essentials_licensing_get` to confirm the org's package
   includes what the customer purchased.

### Suspend a non-paying customer without losing configuration

1. Call `proofpoint_essentials_org_get` to confirm current state and record
   it (domains, features, license count) in case of later disputes.
2. Call `proofpoint_essentials_org_deactivate` with the org name.
3. Confirm mail flow protection has stopped by re-checking org state — do
   not assume the call succeeded silently; verify.

### Offboard a customer permanently

1. Confirm with the account owner that deletion (not deactivation) is
   intended — **this is the destructive path and cannot be undone.**
2. Export or record anything needed for compliance/audit before deleting —
   `proofpoint_essentials_org_get`, `proofpoint_essentials_domains_list`,
   `proofpoint_essentials_licensing_get` — since none of it is recoverable
   afterward.
3. Call `proofpoint_essentials_org_delete` with the org name.

### Upgrade a customer's package tier

1. Call `proofpoint_essentials_org_get` and `proofpoint_essentials_licensing_get`
   to confirm current package and seat usage.
2. Call `proofpoint_essentials_package_update` with the new tier.
3. Re-check `proofpoint_essentials_features_get` — a package change can
   enable features that were previously unavailable; confirm what actually
   changed rather than assuming the upgrade enabled everything the new tier
   nominally includes.

### Hand a customer org to a technician for console troubleshooting

1. Call `proofpoint_essentials_token_create` for the org to mint a
   short-lived Odin-based SSO token.
2. Use the returned token/URL to open the Essentials console scoped to that
   org — do not share the reseller admin's own `X-User`/`X-Password`
   credentials with the technician.

## Error Handling

| Symptom | Cause | Resolution |
|---------|-------|------------|
| 404 on `org_get` for an org you can see in the console | Wrong regional pod | Re-run endpoint discovery |
| `domains_create` 207 with a failed entry | Domain already claimed by another org, or malformed domain string | Inspect the per-item error; do not resubmit the whole batch |
| `org_deactivate` succeeds but mail still appears to flow | DNS/MX still pointed at Essentials from the customer's registrar | Deactivation stops Essentials-side processing; it does not change the customer's DNS |
| `package_update` succeeds but a feature is still unavailable | Feature requires a separate toggle | Call `proofpoint_essentials_features_update` explicitly — package tier changes seat/feature *eligibility*, not necessarily every feature's on/off state |
| `org_delete` returns 403 | Credential is a customer-org admin, not a reseller admin | Org deletion typically requires reseller-level admin credentials |

## Related Skills

- [Proofpoint Essentials API Patterns](../api-patterns/SKILL.md) - Auth, regional pod resolution, batch semantics
- [Proofpoint Essentials User Management](../user-management/SKILL.md) - Mailbox user CRUD within an org
- [Proofpoint Essentials Reporting](../reporting/SKILL.md) - Inbound/outbound mail flow metrics
