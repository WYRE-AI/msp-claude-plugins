---
description: Generate a portfolio-wide M365 security posture report — Secure Score equivalents, MFA enrollment, conditional access coverage, and domain authentication across all managed tenants
argument-hint: "[format] [tenants]"
arguments: [format, tenants]
---

# CIPP Secure Score Report

Portfolio-level security posture report across the MSP's managed tenants. Designed for monthly internal reviews, quarterly business reviews, and as the source data for client-facing security summaries.

## Arguments

- `format` (optional) — scorecard (default) — tenant-by-tenant table sorted by risk; trend — compare to previous run; executive — client-deliverable summary
- `tenants` (optional) — Comma-separated list of tenants to include (defaults to all)

## What it produces

For each tenant in scope:

| Metric | Source |
|--------|--------|
| BPA fail count (Identity / Mail / Security) | `cipp_list_bpa` |
| Enabled CA policies (count + presence of MFA-for-all-apps) | `cipp_list_conditional_access_policies` |
| MFA enrollment % | `cipp_list_mfa_users` |
| Domain health (DMARC enforced, SPF valid, DKIM enabled) | `cipp_list_domain_health` |
| Standards baseline coverage | `cipp_list_standards` |
| Computed risk band | High / Medium / Low |

Tenants are sorted with high-risk first.

## Use the agent for

Cross-tenant *change* analysis ("which tenants regressed since last month?") goes to `security-posture-reviewer`, which can compare against a stored baseline and recommend remediation paths. This command produces the data; the agent produces the narrative.
