---
description: Quick health snapshot for a single tenant — BPA failures, conditional access enforcement, MFA gaps, domain authentication, standards compliance
argument-hint: "<tenant> [detail]"
arguments: [tenant, detail]
---

# CIPP Tenant Health Snapshot

Pulls a focused health picture for one tenant. Suitable for client check-ins, post-onboarding validation, pre-QBR prep, or "is something off with [tenant]?" investigations.

## Arguments

- `tenant` (required) — Tenant default domain, display name, or GUID
- `detail` (optional) — summary (default), full, or executive — controls report depth

## What it checks

1. **Tenant freshness** — `cipp_get_tenant_details` to confirm `lastRefresh` is current
2. **BPA failures** — `cipp_list_bpa` grouped by category, sorted by severity
3. **Conditional Access** — `cipp_list_conditional_access_policies` filtered to `state='enabled'`; flags if MFA-for-all-apps baseline is missing
4. **MFA gaps** — `cipp_list_mfa_users` with count of users without registered strong auth methods
5. **Domain health** — `cipp_list_domain_health` flagging any DMARC `p=none`, missing SPF, or unconfigured DKIM
6. **Standards** — `cipp_list_standards` showing baseline standards present, mode (Report/Alert/Remediate), and last check status

## Detail levels

- **summary** (default): Pass/fail per category, top 5 findings, one-line health verdict
- **full**: Every BPA result, every CA policy, all MFA gap users, all domain results
- **executive**: Plain-language posture summary suitable for a client-facing email

## When to use this vs. the agent

Use this command for routine snapshots and quick lookups. Delegate to `security-posture-reviewer` when you need cross-tenant comparison, drift detection, or a structured remediation plan.
