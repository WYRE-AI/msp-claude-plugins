---
description: Full health check for one Proofpoint Essentials customer org
argument-hint: "<org_name>"
arguments: [org_name]
---

# Org Health Check

A read-only sweep of one customer org's health: lifecycle state, domain and
user counts, feature/license posture, and a recent inbound/outbound mail
flow trend.

## Prerequisites

- Proofpoint Essentials reseller or org-admin credentials configured (see
  the `api-patterns` skill)
- MCP tools `proofpoint_essentials_endpoint_resolve`,
  `proofpoint_essentials_org_get`, `proofpoint_essentials_domains_list`,
  `proofpoint_essentials_users_list`, `proofpoint_essentials_features_get`,
  `proofpoint_essentials_licensing_get`, and
  `proofpoint_essentials_reporting_get` available

## Steps

1. **Resolve and confirm the org**

   Call `proofpoint_essentials_endpoint_resolve` for the org, then
   `proofpoint_essentials_org_get` against the resolved region. Note
   lifecycle state — a deactivated org is the single most important finding
   and should lead the report if present.

2. **Check domains**

   Call `proofpoint_essentials_domains_list`. Note the domain count and flag
   anything that looks unverified or stale (the API call itself doesn't
   report DNS-verification status directly — cross-check against what the
   customer expects to see filtered).

3. **Check users**

   Call `proofpoint_essentials_users_list`. Note the user count per domain
   if the customer has more than one domain, since an unexpectedly low
   count on one domain often means onboarding stalled partway through.

4. **Check features and licensing**

   Call `proofpoint_essentials_features_get` and
   `proofpoint_essentials_licensing_get`. Flag any mismatch between the
   customer's expected package and what's actually enabled or licensed.

5. **Check recent mail flow**

   Call `proofpoint_essentials_reporting_get` with `direction=inbound` and
   again with `direction=outbound` for a recent window (start with the last
   7 days). A flat-zero series for an active org with verified domains is a
   stronger warning sign than the org/domain/user checks above will
   individually surface.

6. **Synthesize**

   Report, explicitly (not as a single healthy/unhealthy verdict):
   - Lifecycle state
   - Domain count and any flagged domains
   - User count, and per-domain distribution if multiple domains
   - Feature/license posture vs. expected package
   - Recent inbound/outbound volume trend, or an explicit "no mail flow
     data in this window" if the series came back empty

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|--------------|
| org_name | string | Yes | The Proofpoint Essentials org name to check |

## Examples

```
/org-health-check --org_name "acmecorp"
```

## Error Handling

- **Endpoint resolution fails:** Not a known org under this reseller's
  account — confirm the exact org name via `/search-org` first.
- **Reporting call returns an empty series for an active org:** Don't
  report this as "no issues found" — an active org with verified domains
  and zero mail flow is itself the finding. Check domain verification
  state before concluding it's a reporting artifact.
- **`users_list` succeeds but returns zero users on a domain that's been
  active for a while:** Flag explicitly; this usually means onboarding was
  never completed for that domain rather than the domain having no
  mailboxes.

## Related Commands

- `/search-org` — quick org lookup without the full mail-flow health sweep
