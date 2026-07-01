---
name: "Inforcer Baseline Alignment"
when_to_use: "When working with Inforcer security baselines and tenant alignment — listing baseline templates, reading a tenant's alignment score, and pulling the per-policy drift detail of a tenant vs its assigned baseline"
description: >
  Use this skill when working with Inforcer baselines and alignment —
  listing baseline templates, reading alignment scores, and pulling
  alignment details (the per-policy drift breakdown of a tenant against
  its assigned baseline). Also covers reading deployed tenant policy
  state (read-only). This is the core drift-detection surface.
triggers:
  - inforcer baseline
  - baseline template
  - tenant alignment
  - alignment score
  - alignment details
  - policy drift
  - drift detail
  - tenant policies
---

# Inforcer Baseline Alignment & Drift

Inforcer's central idea: each managed tenant is measured against an
assigned **security baseline** (a template of policy settings). The gap
between the tenant's deployed state and that baseline is **drift**. This
skill covers listing baselines, reading alignment scores, and — most
importantly — pulling the **per-policy alignment details** that show
exactly where a tenant has drifted.

Read [api-patterns](../api-patterns/SKILL.md) for headers, region, the
envelope, and pagination, and [tenant-management](../tenant-management/SKILL.md)
for resolving a tenant to its integer Client Tenant ID. Every
alignment/policy call is tenant-scoped by that integer id.

## Tools

### `inforcer_baselines_list`

List the security **baseline templates** defined in Inforcer. Returns
baseline objects (id, name, and the policy settings each baseline
prescribes). Baselines are the "golden" definition a tenant is compared
against.

```
inforcer_baselines_list()
```

### `inforcer_alignment_scores`

Read the **alignment score** for a tenant — the headline measure of how
closely the tenant matches its assigned baseline.

```
inforcer_alignment_scores(clientTenantId=1423)
```

Use this for the at-a-glance "how aligned is this tenant?" answer. Score
classification (aligned / semi-aligned / drifted) is threshold-driven —
see [compliance-reporting](../compliance-reporting/SKILL.md).

### `inforcer_alignment_details`

Pull the **per-policy drift breakdown** — the detailed list of how each
policy in the tenant compares to the baseline. This is where you see
*which* policies are aligned and *which* have drifted, not just the
aggregate score.

```
inforcer_alignment_details(clientTenantId=1423)
```

Returns, per policy, the baseline-expected state and the tenant's actual
state so you can pinpoint exactly what diverged. This is the primary
input to any drift report.

### `inforcer_tenant_policies_list`

List the **deployed policy state** for a tenant (read-only). Shows what
policies are actually in place on the tenant, independent of the
baseline comparison.

```
inforcer_tenant_policies_list(clientTenantId=1423)
```

Use this to inspect the tenant's real configuration when an alignment
detail is ambiguous, or to confirm what is actually deployed.

## What to look for in an alignment review

| Finding | Why it matters |
|---------|----------------|
| Low alignment score | The tenant has drifted materially from its baseline; investigate `inforcer_alignment_details` |
| Policy present in baseline but absent on tenant | A required control was never deployed or was removed |
| Policy deployed but with weaker settings than baseline | Silent weakening — looks "configured" but doesn't meet baseline |
| Many small drifts vs one critical drift | Triage by control impact, not count — one missing MFA/identity control outweighs many cosmetic diffs |
| Tenant with no assigned baseline | Nothing to measure against; alignment is meaningless until a baseline is assigned |

## Workflow patterns

### Single-tenant drift deep-dive

```
ctid    = resolve("Acme")                 # integer Client Tenant ID
score   = inforcer_alignment_scores(clientTenantId=ctid)
details = inforcer_alignment_details(clientTenantId=ctid)
drifted = [p for p in details if p['aligned'] is False]
```

Start from the score for the headline, then read `alignment_details` to
list the drifted policies. Cross-reference `inforcer_tenant_policies_list`
when you need the tenant's actual deployed value for a policy.

### Portfolio drift sweep

For each tenant from `inforcer_tenants_list`, pull
`inforcer_alignment_scores`, then drill into `inforcer_alignment_details`
only for tenants below an alignment threshold. This keeps the sweep
cheap while still surfacing the per-policy detail where it matters. Page
`continuationToken` to completion on every list.

## Caveats

- Inforcer's API is **read-only** for alignment. You can **see** drift in
  full detail, but you **cannot** deploy a policy, remediate the drift,
  or restore configuration through the API. Those actions exist only in
  the Inforcer UI — surface them as recommendations, never as something
  this plugin performs.
- The API is **community-sourced** (no official public docs); field
  names such as `aligned` and the exact `alignment_details` shape are
  illustrative and credited to
  [`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity).
- Alignment is only meaningful relative to an **assigned** baseline; a
  tenant with no baseline assigned cannot be scored.

## Related Skills

- [tenant-management](../tenant-management/SKILL.md) - resolve a tenant to the integer Client Tenant ID before scoping
- [compliance-reporting](../compliance-reporting/SKILL.md) - how alignedThreshold / semiAlignedThreshold classify aligned / semi-aligned / drifted
- [assessments](../assessments/SKILL.md) - run an assessment to refresh the data that feeds alignment
- [api-patterns](../api-patterns/SKILL.md) - envelope, pagination, and the integer-id gotcha
