---
description: Resolve a Proofpoint Essentials customer org by name or domain and show its details
argument-hint: "<org_name_or_domain>"
arguments: [org_name_or_domain]
---

# Search Proofpoint Essentials Org

Look up a customer org in Proofpoint Essentials and return its current
state: domains, org lifecycle status, features, and license allocation.

Essentials has no cross-org fuzzy-search endpoint — an org is always
addressed by its exact org name (or resolved from one of its domains).
This command resolves the org's regional pod and pulls its details in one
pass rather than searching a directory that doesn't exist.

## Prerequisites

- Proofpoint Essentials reseller or org-admin credentials configured (see
  the `api-patterns` skill)
- MCP tools `proofpoint_essentials_endpoint_resolve`,
  `proofpoint_essentials_org_get`, `proofpoint_essentials_features_get`,
  and `proofpoint_essentials_licensing_get` available

## Steps

1. **Resolve the org's regional pod**

   Call `proofpoint_essentials_endpoint_resolve` with the given org name or
   domain. If it doesn't resolve, the value is not a known org/domain in
   this reseller's account — stop here and say so rather than guessing a
   region.

2. **Pull org detail**

   Call `proofpoint_essentials_org_get` against the resolved region.
   Extract the org's lifecycle state (active/deactivated) and its domain
   list.

3. **Pull features and licensing**

   Call `proofpoint_essentials_features_get` and
   `proofpoint_essentials_licensing_get` for the same org.

4. **Synthesize**

   Report:
   - Resolved region/pod
   - Lifecycle state (active/deactivated) — call out deactivation
     explicitly, it's easy to miss in a details dump
   - Full domain list
   - Enabled features
   - Current license allocation

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|--------------|
| org_name_or_domain | string | Yes | The org's exact name, or one of its domains |

## Examples

```
/search-org --org_name_or_domain "acmecorp"
/search-org --org_name_or_domain "acmecorp.com"
```

## Error Handling

- **Endpoint resolution fails:** The value isn't a known org or domain
  under this reseller's account — double-check spelling, and confirm the
  credential in use is a reseller admin if the org belongs to another
  technician's book of business.
- **`org_get` returns 404 after a successful resolve:** The org may have
  been deleted since the last endpoint-discovery cache; re-resolve rather
  than retrying the same pod.
- **`features_get`/`licensing_get` fail while `org_get` succeeds:** Scope
  mismatch — the credential may be a customer-org admin without full
  reseller-level visibility into licensing.

## Related Commands

- `/org-health-check` — deeper lifecycle, domain-verification, and mail-flow
  health sweep for one org
