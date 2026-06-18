---
name: tenant-posture
description: Single-tenant Microsoft 365 posture snapshot from Inforcer — secure score plus alignment score, band, and the per-policy drift detail against the tenant's assigned baseline
arguments:
  - name: tenant
    description: The tenant to scope to — a friendly name, domain, GUID, or the integer Client Tenant ID (the MCP resolves the first three to the integer id)
    required: true
  - name: aligned_threshold
    description: Alignment value at/above which a tenant is "aligned" (used to classify the band)
    required: false
  - name: semi_aligned_threshold
    description: Alignment value at/above which a tenant is "semi-aligned" (below this is "drifted")
    required: false
---

# Inforcer Tenant Posture

A single-tenant posture snapshot: how aligned the tenant is to its assigned
baseline, where it has drifted, and what Microsoft thinks of its overall
posture (secure score). Built for onboarding validation, post-change review,
and QBR prep on one client.

## How it works

1. **Resolve the tenant** — pass `tenant` (name / domain / GUID / integer id)
   to `inforcer_tenants_list`; the MCP resolves it to the **integer Client
   Tenant ID** that every tenant-scoped call needs. (Inforcer paths take the
   integer Client Tenant ID, **not** the Azure AD GUID or domain.)
2. **Alignment score** — `inforcer_alignment_scores(clientTenantId=...)` for
   the headline measure of how closely the tenant matches its baseline.
3. **Per-policy drift detail** — `inforcer_alignment_details(clientTenantId=...)`
   for the breakdown: which policies are aligned, which drifted, and the
   baseline-expected vs. tenant-actual state for each.
4. **Secure score** — `inforcer_secure_scores(clientTenantId=...)` for
   Microsoft's own posture view, read as complementary to alignment.

## What it produces

| Section | Source |
|---------|--------|
| Headline: alignment score + band (aligned / semi-aligned / drifted) | `inforcer_alignment_scores` + thresholds |
| Microsoft secure score | `inforcer_secure_scores` |
| Drifted policies (baseline-expected vs. tenant-actual) | `inforcer_alignment_details` |
| Aligned policies (count, for context) | `inforcer_alignment_details` |

The band is **threshold-driven**: at/above `aligned_threshold` is **aligned**;
in `[semi_aligned_threshold, aligned_threshold)` is **semi-aligned**; below
`semi_aligned_threshold` is **drifted**. The snapshot always states the
thresholds it used — a band is meaningless without them.

## Notes

- **Read-only.** This command reads posture; it does not deploy policy,
  remediate drift, or restore configuration — those are UI-only and not
  exposed by the API. Drifted policies are reported as recommendations.
- If the tenant has **no assigned baseline**, alignment can't be scored —
  the snapshot flags the missing assignment rather than reporting a
  meaningless number.
- Inforcer's API is **community-sourced** ([`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity));
  field shapes are best-effort, not a vendor contract.

## Use the agent for

This command snapshots one tenant. For a portfolio-wide drift roll-up, or to
turn a drift snapshot into a prioritized remediation narrative, hand off to
the `inforcer-drift-reporter` agent. See also `/drift-report` for the
cross-tenant sweep.
