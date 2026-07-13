---
description: Portfolio-wide Inforcer baseline drift report — every managed tenant's alignment vs its assigned baseline, classified aligned / semi-aligned / drifted and sorted drifted-first, with secure score
argument-hint: "[aligned_threshold] [semi_aligned_threshold] [tenants]"
arguments: [aligned_threshold, semi_aligned_threshold, tenants]
---

# Inforcer Drift Report

A portfolio-wide baseline drift report across the MSP's managed Microsoft 365
tenants. Each tenant is measured against its assigned baseline, classified into
a band, and sorted so the worst posture surfaces first. Designed for monthly
internal reviews, QBRs, and as the source data for client-facing posture
summaries.

## Arguments

- `aligned_threshold` (optional) — Alignment value at/above which a tenant is "aligned" (used to classify each tenant's band)
- `semi_aligned_threshold` (optional) — Alignment value at/above which a tenant is "semi-aligned" (below this is "drifted")
- `tenants` (optional) — Comma-separated list of tenants to include (names/domains/GUIDs/integer ids; defaults to all managed tenants)

## How it works

1. **Enumerate tenants** — `inforcer_tenants_list`, paging `continuationToken`
   to completion. A partial tenant list silently drops clients from the
   report, so this always pages fully before reporting.
2. **Per-tenant scores** — for each tenant's **integer Client Tenant ID**, pull
   `inforcer_alignment_scores` and `inforcer_secure_scores`.
3. **Classify** — apply `aligned_threshold` / `semi_aligned_threshold` to the
   alignment value to band each tenant aligned / semi-aligned / drifted.
4. **Drill where it matters** — pull `inforcer_alignment_details` only for
   below-threshold tenants, so the report carries per-policy drift detail for
   the tenants that need it without an expensive full-portfolio detail pull.

## What it produces

A tenant-by-tenant scorecard, sorted **drifted-first, then semi-aligned, then
aligned**:

| Column | Source |
|--------|--------|
| Tenant (display name) | `inforcer_tenants_list` |
| Alignment score + band | `inforcer_alignment_scores` + thresholds |
| Microsoft secure score | `inforcer_secure_scores` |
| Top drifted controls (drifted/semi-aligned tenants) | `inforcer_alignment_details` |

Plus a summary: counts per band, the lowest secure scores, and the **priority
list** — tenants that are both **drifted and low secure score**.

The bands are threshold-driven (at/above `aligned_threshold` = aligned;
`[semi_aligned_threshold, aligned_threshold)` = semi-aligned; below
`semi_aligned_threshold` = drifted). The report always states the thresholds
used — changing them reclassifies tenants without anything changing on the
tenant.

## Notes

- **Read-only.** This report measures drift; it does not deploy policy,
  remediate, or restore configuration (UI-only, not API-exposed). Findings are
  recommendations.
- Tenants with **no assigned baseline** are flagged separately — they can't be
  scored, and that missing assignment is itself a finding.
- Triage by **control impact, not drift count** — one missing identity/MFA
  control outweighs many cosmetic diffs.
- Inforcer's API is **community-sourced** ([`royklo/InforcerCommunity`](https://github.com/royklo/InforcerCommunity));
  treat field shapes as best-effort, not a vendor contract.

## Use the agent for

This command produces the drift data. For the narrative — what to address
first, why, and the recommended owner/tool for each finding — hand off to the
`inforcer-drift-reporter` agent. For a single tenant, use `/tenant-posture`.
