---
description: Find tenants that have drifted from the MSP's configured CIPP standards baseline — missing standards, standards in Report-only mode, recent compliance failures
argument-hint: "[scope] [tenants]"
arguments: [scope, tenants]
---

# CIPP Standards Drift

Detects tenants out of compliance with the MSP's CIPP standards baseline. Standards drift is the leading indicator of "tenant looks managed but isn't" — every tenant with a missing or report-only baseline standard is silently receiving zero enforcement for that control.

## Arguments

- `scope` (optional) — missing — tenants without baseline standards; report-only — tenants where critical standards aren't enforcing; failing — tenants with active compliance failures; all (default) — full drift report
- `tenants` (optional) — Comma-separated tenant list (defaults to all)

## Drift categories detected

| Category | Detection logic |
|----------|----------------|
| **Missing baseline** | A standard exists in your master baseline but isn't deployed in this tenant |
| **Report-only** | Standard is deployed but in `Report` mode — no alerting, no remediation |
| **Stale Alert** | Standard has been in `Alert` mode > 60 days without escalation to `Remediate` |
| **Recent failures** | Standard is in `Remediate` mode but has logged failures in the last check cycle |
| **Drift since onboarding** | Tenant onboarded before a standard was added to baseline; never backfilled |

## Output

Tenant-by-tenant drift table with:

- Standards present vs. expected
- Mode breakdown (Report / Alert / Remediate counts)
- Last check timestamp from `cipp_run_standards_check`
- Recommended action (deploy, promote mode, escalate failure)

## Workflow

This command produces the drift report. Use the `security-posture-reviewer` agent for the next step — translating drift into a remediation plan with sequencing and client-communication framing.
