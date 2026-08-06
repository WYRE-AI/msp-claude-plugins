---
description: Get security awareness metrics for a KnowBe4 group
argument-hint: "<group> [period] [compare] [detail]"
arguments: [group, period, compare, detail]
---

# Group Security Awareness Report

Get security awareness metrics for a specific KnowBe4 group including phishing results, training completion, and risk scores.

## Prerequisites

- Valid KnowBe4 API key configured
- API token with Reporting permissions
- Correct KNOWBE4_REGION set

## Steps

1. **Resolve group identity**
   - If numeric, use as group ID directly
   - If text, search groups by name and confirm match

2. **Get group details**
   - Use `knowbe4_groups_get` for group info and member count
   - Use `knowbe4_groups_members` for member list

3. **Get group risk score data**
   - Use `knowbe4_groups_risk_score_history` for trend data
   - Calculate current average from member scores

4. **Get phishing metrics for group members**
   - Cross-reference group members with phishing campaign recipients
   - Calculate group-specific PPP

5. **Get training metrics for group members**
   - Check training enrollment and completion for group members
   - Calculate group completion rate

6. **Compare if requested**
   - Get comparison group or org-wide metrics
   - Calculate relative performance

7. **Format and display report**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| group | string/int | Yes | - | Group name or ID |
| period | string | No | Last 6 months | Time period for metrics |
| compare | string | No | - | Group name/ID or "organization" for comparison |
| detail | string | No | summary | summary, members, or trend |

## Examples

### Basic Group Report

```
/group-report "Sales Team"
```

### With Comparison to Organization Average

```
/group-report "Sales Team" --compare organization
```

### Compare Two Groups

```
/group-report "Sales Team" --compare "IT Department"
```

### View Member Details

```
/group-report "Sales Team" --detail members
```

### View Risk Trend

```
/group-report "Sales Team" --period "1 year" --detail trend
```

## Output

### Summary View

```
GROUP SECURITY AWARENESS REPORT
=================================
Group: Sales Team
Members: 25 (24 active, 1 archived)
Group Type: Department

RISK SCORE
  Current Average: 38.5 (MODERATE)
  6-Month Trend: Improving (was 47.2)
  Organization Average: 31.2

PHISHING METRICS (Last 6 Months)
  Campaigns Participated: 6
  Average PPP: 22.1%
  Best Campaign: 15.3% (March Monthly Test)
  Worst Campaign: 31.2% (Holiday Season Test)
  PAB Report Rate: 25.0%

TRAINING METRICS
  Active Campaigns: 2
  Overall Completion: 88.0%
  Past Due: 3 users
  Average Time on Training: 32 minutes

TOP RISKS
  1. Mike White - Risk Score: 72.1 (3 phishing failures in 6 months)
  2. Karen Martinez - Risk Score: 65.4 (2 failures, 0 training completed)
  3. Larry Jackson - Risk Score: 58.9 (2 failures, low report rate)

RECOMMENDATIONS
  1. Target top 3 risk users with remedial training
  2. PPP above org average by 6.3% -- consider additional phishing templates
  3. Improve PAB adoption (25% vs 35% org average)
```

### Member Detail View

```
GROUP MEMBER REPORT - Sales Team
==================================

Member              | Risk  | PPP    | Training | Last Phish Test
--------------------|-------|--------|----------|----------------
Jane Doe            | 42.8  | 25.0%  | 85%      | Clicked (Feb)
John Smith          | 22.1  | 8.3%   | 100%     | Reported (Feb)
Alice Johnson       | 18.5  | 0.0%   | 100%     | No action (Feb)
Bob Williams        | 35.2  | 16.7%  | 92%      | Reported (Feb)
Carol Brown         | 28.7  | 8.3%   | 100%     | Reported (Feb)
...
Mike White          | 72.1  | 50.0%  | 60%      | Clicked (Mar)
Karen Martinez      | 65.4  | 41.7%  | 45%      | Data entered (Feb)
Larry Jackson       | 58.9  | 33.3%  | 70%      | Clicked (Feb)

GROUP AVERAGES
  Risk Score: 38.5 | PPP: 22.1% | Training: 88.0%
```

### Trend View

```
GROUP RISK TREND - Sales Team (12 months)
==========================================

  2024-03: 38.5  ████████
  2024-02: 40.2  ████████
  2024-01: 43.8  █████████
  2023-12: 47.2  █████████
  2023-11: 46.0  █████████
  2023-10: 44.5  █████████
  2023-09: 48.1  ██████████
  2023-08: 50.3  ██████████
  2023-07: 52.7  ███████████
  2023-06: 55.1  ███████████
  2023-05: 54.8  ███████████
  2023-04: 56.2  ███████████

12-Month Improvement: -17.7 points (31.5% reduction)
Trend Direction: Consistently improving
```

### Comparison View

```
GROUP COMPARISON
==================

Metric           | Sales Team | IT Dept   | Org Average
-----------------|-----------|-----------|------------
Members          | 25        | 18        | 250
Risk Score       | 38.5      | 18.2      | 31.2
PPP              | 22.1%     | 4.2%      | 15.8%
Training Comp.   | 88.0%     | 98.0%     | 92.0%
PAB Report Rate  | 25.0%     | 65.0%     | 35.0%
Avg Time to Click| 4.2 min   | 12.8 min  | 7.5 min

Sales Team is 7.3 points above org average risk.
IT Department is 13.0 points below org average risk.
```

## Error Handling

### Group Not Found

```
No group found matching "Sales".

Available groups:
- Sales Team (ID: 101, 25 members)
- Sales Managers (ID: 102, 5 members)
- Pre-Sales Engineering (ID: 103, 8 members)
```

### Insufficient Data

```
Group "New Hires Q1" has insufficient data for a full report.

Members: 5
Phishing tests completed: 0
Training campaigns: 1 (in progress)

A meaningful report requires at least one completed phishing campaign.
```

### API Errors

| Error | Resolution |
|-------|------------|
| 401 Unauthorized | Check KNOWBE4_API_KEY |
| 404 Not Found | Verify group ID and KNOWBE4_REGION |
| 429 Rate Limited | Wait and retry |

## Related Commands

- `/phishing-results` - Detailed results for a specific phishing campaign
- `/training-status` - Training completion status
- `/user-risk` - Risk score for individual users
- `/campaign-summary` - Overview of recent campaigns
