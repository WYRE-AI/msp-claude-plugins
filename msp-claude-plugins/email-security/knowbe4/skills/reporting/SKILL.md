---
name: "KnowBe4 Reporting"
description: >
  Use this skill when generating KnowBe4 security awareness reports - phishing
  summary statistics, training completion rates, risk score overviews, trend analysis,
  organizational benchmarks, and executive dashboards. Covers how to interpret
  KnowBe4 metrics, build meaningful reports, and communicate security awareness
  posture to stakeholders.
when_to_use: >-
  When generating KnowBe4 security awareness reports - phishing summary statistics, training
  completion rates, risk score overviews, trend analysis, organizational benchmarks. Use when:
  knowbe4 report, knowbe4 reporting, security awareness report, phishing summary, training
  completion rate, risk overview, trend analysis, knowbe4 metrics, knowbe4 dashboard, security
  posture report, awareness metrics, executive report knowbe4, or compliance report.
---

# KnowBe4 Security Awareness Reporting

## Overview

KnowBe4 reporting provides visibility into an organization's security awareness posture through phishing simulation metrics, training completion data, and risk scores. Effective reporting translates raw data into actionable insights for security teams, management, and compliance stakeholders. This skill covers how to retrieve, interpret, and present KnowBe4 metrics.

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

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `knowbe4_reporting_account_summary` | Get account-level summary stats | none |
| `knowbe4_reporting_phishing_summary` | Get phishing simulation summary | `start_date`, `end_date` |
| `knowbe4_reporting_training_summary` | Get training completion summary | `campaign_id`, `start_date`, `end_date` |
| `knowbe4_reporting_risk_overview` | Get risk score overview | `group_id` |
| `knowbe4_reporting_ppp_trend` | Get PPP trend over time | `start_date`, `end_date`, `interval` |
| `knowbe4_reporting_department_breakdown` | Get metrics by department | `metric_type` |

## Common Workflows

### Monthly Security Awareness Report

1. **Get account summary** for top-level metrics
2. **Pull phishing summary** for the month
3. **Pull training summary** for active campaigns
4. **Get PPP trend** for the last 6 months
5. **Break down by department** to identify problem areas
6. **Compare to previous month** for trend direction
7. **Format report** with key findings and recommendations

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
