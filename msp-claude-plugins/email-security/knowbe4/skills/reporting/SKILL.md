---
name: "KnowBe4 Reporting"
description: >
  KnowBe4 security awareness reporting: phishing summary statistics, training
  completion rates, risk score overviews, trend analysis, organizational
  benchmarks, and executive dashboards, including how to interpret metrics and
  communicate posture to stakeholders.
when_to_use: >-
  When generating or interpreting KnowBe4 security awareness reports. Use when:
  knowbe4 report, knowbe4 reporting, security awareness report, phishing summary, training
  completion rate, risk overview, trend analysis, knowbe4 metrics, knowbe4 dashboard, security
  posture report, awareness metrics, executive report knowbe4, or compliance report.
---

# KnowBe4 Security Awareness Reporting

## Overview

KnowBe4 reporting provides visibility into an organization's security awareness posture through phishing simulation metrics, training completion data, and risk scores. Effective reporting translates raw data into actionable insights for security teams, management, and compliance stakeholders. This skill covers how to retrieve, interpret, and present KnowBe4 metrics.

## Anti-triggers

- **An "email security report" covering threats actually blocked** —
  every metric here measures simulations and training, not real
  attacks. Threats stopped in production are `proofpoint-tap`,
  `checkpoint-avanan-threats`, or `abnormal-security-threats`.
- **One campaign's results or one person's risk score** — this skill
  returns account-, department-, and trend-level aggregates; the
  per-object detail sits in `knowbe4-phishing`, `knowbe4-training`, or
  `knowbe4-users`.

## Key Concepts

### Core Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Phish-Prone Percentage (PPP)** | % of users who failed phishing tests | Below 5% after 12 months |
| **Training Completion Rate** | % of enrolled users who completed training | Above 95% |
| **Average Risk Score** | Mean risk score across all active users | Below 30 |
| **Reporting Rate** | % of phishing tests reported via PAB | Above 70% |
| **Click-to-Report Ratio** | Ratio of clicks to reports | Below 0.5:1 |
| **Time to First Click** | Average time from delivery to first click | Increasing over time |

### Metric Interpretation Guide

**Phish-Prone Percentage (PPP):**
```
PPP = (Users who failed / Users who received test) * 100

Interpretation:
- Decreasing PPP = Training is working
- Flat PPP = Need to change training approach
- Increasing PPP = New threats, new employees, or stale training
- Sudden spike = Especially effective phishing template
```

**Training Completion Rate:**
```
Completion Rate = (Completed enrollments / Total enrollments) * 100

Interpretation:
- Below 80% = Enforcement issue, need manager involvement
- 80-95% = Normal range, follow up on stragglers
- Above 95% = Excellent compliance
- 100% = Verify data -- may indicate auto-completion
```

**Risk Score Trends:**
```
Risk Trend = Current avg risk score - Previous period avg risk score

Interpretation:
- Negative trend = Improving (good)
- Flat trend = Plateau, consider changing approach
- Positive trend = Degrading, investigate cause
```

### Reporting Timeframes

| Timeframe | Use Case | Audience |
|-----------|----------|----------|
| **Weekly** | Operational monitoring, active campaign tracking | Security team |
| **Monthly** | Trend analysis, department comparisons | Security manager |
| **Quarterly** | Executive summary, compliance reporting | Leadership, auditors |
| **Annual** | Year-over-year progress, program justification | Board, C-suite |

### Industry Benchmarks (2024)

| Metric | Small (<250) | Medium (250-1000) | Large (1000+) |
|--------|-------------|-------------------|---------------|
| Initial PPP | 32.4% | 30.1% | 31.5% |
| PPP after 90 days training | 17.6% | 16.4% | 15.2% |
| PPP after 12 months | 5.4% | 4.8% | 4.5% |
| Training completion | 87% | 91% | 93% |
| PAB reporting rate | 45% | 52% | 58% |

## Field Reference

### Account-Level Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_users` | int | Total active users |
| `current_risk_score` | float | Organization-wide average risk score |
| `phish_prone_percentage` | float | Organization-wide PPP |
| `total_phishing_campaigns` | int | Total phishing campaigns run |
| `total_training_campaigns` | int | Total training campaigns run |

### Phishing Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_campaigns` | int | Number of phishing campaigns |
| `total_tests_sent` | int | Total phishing emails delivered |
| `total_clicked` | int | Total clicks across all campaigns |
| `total_reported` | int | Total reports via PAB |
| `overall_ppp` | float | Overall phish-prone percentage |
| `ppp_by_department` | object | PPP broken down by department |
| `ppp_by_location` | object | PPP broken down by location |
| `ppp_trend` | array | PPP over time (monthly) |

### Training Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_campaigns` | int | Number of training campaigns |
| `total_enrollments` | int | Total user enrollments |
| `completed` | int | Number completed |
| `in_progress` | int | Number in progress |
| `not_started` | int | Number not started |
| `past_due` | int | Number past due |
| `completion_rate` | float | Overall completion percentage |
| `average_time_spent` | int | Average seconds spent on training |
| `completion_by_department` | object | Completion broken down by department |

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|----------------|
| `knowbe4_account_get` | Account-level summary: subscription level, seats, admin details, current risk score | none |
| `knowbe4_account_risk_score_history` | Account risk score over time | `page`, `per_page` |
| `knowbe4_reporting_phishing_summary` | Aggregate phishing stats: total tests, delivered/opened/clicked/reported, average PPP, click and report rates | `page`, `per_page` |
| `knowbe4_reporting_training_summary` | Aggregate training stats: total, active and completed campaign counts | `page`, `per_page` |
| `knowbe4_reporting_risk_overview` | Account risk posture: current score, recent trend, highest-risk groups | none |

### What the reporting surface will not do

These three constraints govern almost every report you will be asked for,
and none of them are visible from the tool names.

**No date filtering, anywhere.** None of these tools takes a date range —
`knowbe4_reporting_risk_overview` takes no arguments at all. "Phishing
results for March" cannot be requested; it has to be reconstructed by
reading Phishing Security Tests and filtering on their dates client-side.

**The summaries are page-scoped, and they do not say so.**
`knowbe4_reporting_phishing_summary` reads a single page of PSTs (default
`per_page=500`) and averages over it, then returns
`average_phish_prone_percentage` with no marker that it covered part of
the account. `knowbe4_reporting_training_summary` does the same over
campaigns. Read back the `page` and `per_page` fields it echoes and state
the coverage in the report, or paginate and aggregate yourself. Two
summaries taken at different sizes are not comparable.

**There is no PPP-trend tool and no department breakdown.** Both are
routinely asked for and neither exists:

- *PPP over time* has to be assembled from
  `knowbe4_phishing_security_tests_list`, taking each test's
  `phish_prone_percentage` and its date. Do **not** substitute
  `knowbe4_account_risk_score_history` — risk score and phish-prone
  percentage are different measures on different scales, and a risk-score
  trendline presented as a PPP trend is wrong in a way a client cannot
  catch.
- *Department metrics* have to be aggregated from `knowbe4_users_list`,
  grouping on each user's `department` field. `knowbe4_groups_list` is
  not a substitute: KnowBe4 groups are membership lists that may or may
  not correspond to departments, and reporting group risk scores under
  department headings misstates who the numbers describe.

## Common Workflows

### Monthly Security Awareness Report

1. **Get account summary** with `knowbe4_account_get` for top-level metrics
2. **Pull the phishing aggregate** with `knowbe4_reporting_phishing_summary`,
   and record the `page`/`per_page` it covered
3. **Pull the training aggregate** with `knowbe4_reporting_training_summary`
4. **Scope to the month yourself** — read
   `knowbe4_phishing_security_tests_list` and keep the tests whose dates
   fall in the reporting period; the summaries above are not date-filtered
5. **Build the PPP trend** from those per-test `phish_prone_percentage`
   values, bucketed by month
6. **Aggregate by department** from `knowbe4_users_list`, grouping on the
   `department` field
7. **Compare to previous month** for trend direction
8. **Format report** with key findings, recommendations, and an explicit
   note of what the figures cover

### Quarterly Executive Report

1. **Get 3-month summary** across all metrics
2. **Calculate quarter-over-quarter change** for PPP, completion rate, risk score
3. **Identify top 5 highest-risk departments**
4. **Highlight achievements** (PPP improvements, 100% completion groups)
5. **List recommendations** for next quarter
6. **Include industry benchmarks** for context

### Compliance Audit Report

1. **List all training campaigns** for the audit period
2. **Get completion rates** for each required training
3. **Identify non-compliant users** (past_due or not_started)
4. **Document remediation actions** taken for non-compliance
5. **Export data** with timestamps for audit evidence

### Risk Trend Analysis

1. **Pull risk score history** for the organization over 12 months
2. **Overlay with campaign dates** -- phishing tests and training launches
3. **Correlate risk changes** with specific events
4. **Identify which campaigns** had the most impact on risk
5. **Recommend optimization** of campaign mix

### New Client Baseline Report

1. **Run baseline phishing test** before any training
2. **Record initial PPP** as the starting point
3. **Document initial risk score distribution**
4. **Set targets** based on industry benchmarks
5. **Schedule follow-up assessment** at 90 days

## Report Templates

### Executive Summary Format

```
SECURITY AWARENESS REPORT - [Month/Quarter]
============================================

KEY METRICS
- Phish-Prone Percentage: XX.X% (change from last period)
- Training Completion Rate: XX.X%
- Average Risk Score: XX.X
- PAB Reporting Rate: XX.X%

HIGHLIGHTS
- [Notable achievement or concern]
- [Notable achievement or concern]

DEPARTMENT RANKING (by PPP, best to worst)
1. [Department] - X.X%
2. [Department] - X.X%
...

RECOMMENDATIONS
1. [Action item]
2. [Action item]
```

### Department Comparison Format

```
DEPARTMENT SECURITY AWARENESS COMPARISON
=========================================

Department    | PPP    | Training | Risk Score | Trend
-------------|--------|----------|------------|------
IT           | 3.2%   | 98%      | 15.4       | ↓
Finance      | 8.1%   | 95%      | 28.7       | ↓
Sales        | 22.4%  | 82%      | 52.1       | →
HR           | 12.7%  | 91%      | 35.2       | ↓
Executive    | 15.3%  | 88%      | 41.0       | ↑
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid date range | Use ISO 8601 format (YYYY-MM-DD) |
| 401 | Invalid API token | Verify KNOWBE4_API_KEY |
| 403 | Insufficient permissions | API token needs Reporting permissions |
| 404 | No data for period | No campaigns run during specified dates |
| 429 | Rate limit exceeded | Implement backoff (see api-patterns) |

### Data Considerations

| Issue | Cause | Resolution |
|-------|-------|------------|
| PPP seems too low | Small sample size | Need more campaigns for statistical significance |
| Completion rate drops | New campaign started with fresh enrollments | Wait for campaign to mature |
| Risk score not updating | Calculated periodically, not real-time | Allow 24-48 hours for updates |
| Department data missing | Users lack department field | Update user profiles |
| Trend shows no data points | Date range too narrow | Expand date range |

## Best Practices

1. **Report consistently** -- Use the same metrics and format every period
2. **Show trends, not snapshots** -- A single PPP number is less useful than 6-month trend
3. **Use benchmarks** -- Compare against industry averages for context
4. **Segment by audience** -- Executives want summary; security team wants details
5. **Include recommendations** -- Every report should have actionable next steps
6. **Track leading indicators** -- PAB reporting rate predicts future PPP improvement
7. **Celebrate successes** -- Highlight departments and users who improve
8. **Avoid vanity metrics** -- Focus on metrics that drive security outcomes
9. **Automate where possible** -- Schedule recurring reports to reduce manual effort
10. **Correlate with real incidents** -- Connect awareness metrics to actual security events

## Related Skills

- [KnowBe4 Phishing](../phishing/SKILL.md) - Phishing simulation campaigns
- [KnowBe4 Training](../training/SKILL.md) - Training campaign management
- [KnowBe4 Users](../users/SKILL.md) - User management and risk scores
- [KnowBe4 API Patterns](../api-patterns/SKILL.md) - Authentication, pagination, and rate limits
