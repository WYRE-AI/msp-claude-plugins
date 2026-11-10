---
name: "CIPP Secure Score"
description: >
  Microsoft Secure Score through CIPP: the live per-tenant score and its
  history (cipp_get_secure_score), the recommendation catalog behind it
  (cipp_list_secure_score_controls), and how to turn the two into a ranked,
  client-ready improvement plan.
when_to_use: >-
  When reporting a customer's Microsoft Secure Score, comparing it with similar tenants, or
  deciding which security controls to implement next. Use when: secure score, microsoft secure
  score, m365 security score, security posture report, qbr security slide, improve secure score,
  or secure score recommendations.
---

# CIPP Secure Score

## Overview

Secure Score is Microsoft's 0-100% measure of how many recommended security controls a tenant has implemented. MSPs use it as the headline number in QBRs and as a to-do list. CIPP reads it live per tenant.

## Anti-triggers

- **Standards and drift** (whether a tenant matches the MSP's baseline) — use `cipp-standards`.
- **Conditional Access review** — use `cipp-security`.
- **MFA enrolment per user** — use `cipp-users` (`cipp_list_mfa_users`).

## MCP Tools

| Tool | Tier | Arguments | Returns |
|------|------|-----------|---------|
| `cipp_get_secure_score` | read | `tenantFilter` (one tenant; `allTenants` not supported), `top` (daily readings, default 7, max 90) | Latest points, percentage of the maximum, comparison with all tenants and with similarly sized tenants, and per-control scores |
| `cipp_list_secure_score_controls` | read | `tenantFilter` | The control catalog: title, category, rank, max points, implementation cost, user impact, remediation text |

## Workflows

### QBR security number

1. `cipp_get_secure_score` with `top: 90` for the trend.
2. Report the current percentage, the change over the period, and how it compares with similarly sized tenants (the `TotalSeats` comparison is the fair one for a small business).

### Ranked improvement plan

1. `cipp_get_secure_score` for the per-control current scores.
2. `cipp_list_secure_score_controls` for max points, implementation cost and user impact.
3. Join on the control, compute points available (max minus current), and rank by points available with low user impact and low cost first.
4. Present the top items with their remediation text. Flag controls an MSP normally deploys through CIPP standards so they are fixed fleet-wide rather than per tenant.

## Gotchas

- **One tenant at a time.** For an estate view, loop over `cipp_list_tenants`; each call reads Graph live.
- **"Third-party" controls.** Some controls are satisfied by a non-Microsoft product (another EDR, another MFA provider) but still show as not implemented until marked in the Secure Score portal. Check before reporting a gap.
- **Score moves daily.** Microsoft recalculates once a day; a fix made today shows tomorrow.
