---
name: "cipp-standards"
description: "CIPP's tenant-baseline enforcement model: the Report/Alert/Remediate standards modes and how to roll them out, on-demand standards evaluation, Best Practice Analyser reports, and SPF/DKIM/DMARC domain health results with their remediation actions."
when_to_use: >-
  When auditing standards compliance, running BPA reports, checking domain authentication health,
  or detecting tenants drifting from configured baselines. Use when: cipp standards, bpa, best
  practice analyser, best practice analyzer, run standards check, domain health, dmarc, dkim, spf,
  tenant baseline, compliance drift, or secure score.
---

# CIPP Standards & BPA

Standards are CIPP's mechanism for declaring "this is what every tenant we manage should look like" and continuously enforcing it. The Best Practice Analyser (BPA) is the read side — it shows you where current tenant state diverges from CIPP's recommended baseline. Domain health is a complementary check focused on email authentication.

## Anti-triggers

- **Drift against an Inforcer baseline** — Inforcer and CIPP both say
  "baseline", "drift", and "secure score" but measure different things
  against different templates; a tenant can be CIPP-compliant and
  Inforcer-drifted at once. Use `inforcer-baseline-alignment`.
- **Inspecting Conditional Access policies** — CA policies are not CIPP
  standards and do not appear in BPA output; use `cipp-security`.
- **Triaging what an `Alert`-mode standard actually raised** — the
  queue those alerts land in is `cipp-alerts`.
- **Drift measured across more than the CIPP-managed estate** — the
  cross-vendor method for comparing tenants to a baseline and deciding
  what to remediate is `compliance-pack-standards-drift`; this skill
  is the CIPP standards engine it reads.

## Tools

### `cipp_list_standards`

```
cipp_list_standards(tenantFilter='contoso.onmicrosoft.com')
```

Returns the list of standards configured for the tenant: which standards are enabled, what action each takes (`Report`, `Alert`, `Remediate`), and current compliance status. Use `tenantFilter='allTenants'` for a portfolio-wide view.

### `cipp_run_standards_check`

```
cipp_run_standards_check(tenantFilter='contoso.onmicrosoft.com')
```

Triggers an on-demand standards evaluation. CIPP runs this on a schedule, but force a fresh run after deploying a new standard or remediating a finding to confirm the fix took.

### `cipp_list_bpa`

```
cipp_list_bpa(tenantFilter='contoso.onmicrosoft.com')
```

Returns the latest Best Practice Analyser report — every CIPP-recommended check with `Pass`/`Fail`/`Warn` status across categories (Security, Identity, Mail, SharePoint, Teams, Intune). The most useful single call for tenant health.

### `cipp_list_domain_health`

```
cipp_list_domain_health(tenantFilter='contoso.onmicrosoft.com')
```

Per-domain SPF, DKIM, DMARC, MX, and DNSSEC results. Run for any tenant where mail authentication is suspect or before/after migrating mail.

## Standards model

A "standard" in CIPP has three modes:

| Mode | Behavior |
|------|----------|
| `Report` | Check only; show in BPA |
| `Alert` | Check + raise alert when out of compliance |
| `Remediate` | Check + auto-fix when out of compliance |

The progression for an MSP rolling out a new baseline is typically `Report` → `Alert` → `Remediate` over weeks, with the longest dwell in `Alert` to validate that auto-remediation will be safe.

## Workflow patterns

### Tenant health snapshot

```
bpa = cipp_list_bpa(tenantFilter)
fails = [check for check in bpa if check['status'] == 'Fail']
domain = cipp_list_domain_health(tenantFilter)
broken_dmarc = [d for d in domain if d.get('dmarcPass') is not True]
```

A tenant with > 5 BPA failures or any broken DMARC needs a remediation plan, not just a report.

### Standards drift detection

```
all_tenants_standards = cipp_list_standards(tenantFilter='allTenants')
```

Compare the standards each tenant has enabled against the MSP's master baseline list. Tenants missing a baseline standard usually mean the standard was deployed *after* the tenant onboarded and never backfilled.

### Pre-change validation

Before you change a tenant's identity or mail config:

1. `cipp_list_bpa` — capture current state
2. Make the change
3. `cipp_run_standards_check` to force a fresh evaluation
4. `cipp_list_bpa` again — diff against pre-change capture

## Domain health interpretation

| Result | Meaning | Action |
|--------|---------|--------|
| SPF: missing | No SPF record at all | Add `v=spf1 include:spf.protection.outlook.com -all` |
| SPF: too many lookups | Record exceeds 10-DNS-lookup limit | Flatten or consolidate `include:` directives |
| DKIM: not configured | Default DKIM signing disabled | Enable in Defender / Exchange Admin |
| DMARC: `p=none` | Reporting only, no enforcement | Move to `p=quarantine` after monitoring |
| DMARC: missing | No DMARC record | Add `v=DMARC1; p=none; rua=mailto:dmarc@...` to start |

## Caveats

- BPA results reflect the last scheduled run; run `cipp_run_standards_check` for fresh data.
- Standards `Remediate` mode can change tenant configuration without an additional confirmation — scope carefully and stage `Alert` first.
- Domain health doesn't catch every email-auth issue (it doesn't validate ARC, BIMI, MTA-STS) — for full mail forensics, supplement with external tools.
