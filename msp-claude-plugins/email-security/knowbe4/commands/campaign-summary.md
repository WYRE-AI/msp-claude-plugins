---
description: Get summary of recent phishing and training campaigns from KnowBe4
argument-hint: "[type] [period] [status]"
arguments: [type, period, status]
---

# Campaign Summary

Get a summary of recent phishing and training campaigns from KnowBe4.

## Prerequisites

- Valid KnowBe4 API key configured
- API token with Reporting permissions
- Correct KNOWBE4_REGION set

## Steps

1. **Determine scope**
   - Apply type filter (phishing, training, or both)
   - Apply period filter (default: last 90 days)
   - Apply status filter (default: all)

2. **Retrieve phishing campaigns**
   - Use `knowbe4_phishing_campaigns_list` for phishing data
   - Get key metrics for each campaign

3. **Retrieve training campaigns**
   - Use `knowbe4_training_campaigns_list` for training data
   - Get enrollment and completion metrics

   Neither list tool accepts a status or date argument, so the type,
   period and status filters above are applied client-side after a full
   paginated read.

4. **Calculate aggregate metrics**
   - Total campaigns run
   - Overall PPP trend
   - Overall training completion rate
   - Active vs completed counts

5. **Format summary report**
   - Sort by date (most recent first)
   - Include key metrics per campaign
   - Show aggregate totals

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | string | No | all | phishing, training, or all |
| period | string | No | Last 90 days | Time period for summary |
| status | string | No | all | active, completed, scheduled, all |

## Examples

### View All Recent Campaigns

```
/campaign-summary
```

### View Only Phishing Campaigns

```
/campaign-summary --type phishing
```

### View This Quarter's Campaigns

```
/campaign-summary --period "Q1 2024"
```

### View Active Campaigns Only

```
/campaign-summary --status active
```

### View Training Campaigns for Last 6 Months

```
/campaign-summary --type training --period "last 6 months"
```

## Output

### All Campaigns Summary

```
CAMPAIGN SUMMARY - Last 90 Days
=================================

OVERVIEW
  Total Campaigns: 8 (5 phishing, 3 training)
  Active: 2 | Completed: 5 | Scheduled: 1

PHISHING CAMPAIGNS
  Overall PPP: 14.2% (down from 18.7% previous period)

  1. March Monthly Test [ACTIVE]
     Started: 2024-03-01 | Template: "IT Support Request"
     Delivered: 180/250 | Clicked: 22 (12.2%) | Reported: 65 (36.1%)

  2. February Monthly Test [COMPLETED]
     Period: 2024-02-01 to 2024-02-15
     Delivered: 248 | Clicked: 38 (15.3%) | Reported: 82 (33.1%)

  3. Spear Phish - Executives [COMPLETED]
     Period: 2024-01-20 to 2024-02-03
     Delivered: 22 | Clicked: 4 (18.2%) | Reported: 8 (36.4%)

  4. January Monthly Test [COMPLETED]
     Period: 2024-01-05 to 2024-01-19
     Delivered: 245 | Clicked: 41 (16.7%) | Reported: 72 (29.4%)

  5. Holiday Season Test [COMPLETED]
     Period: 2023-12-18 to 2024-01-02
     Delivered: 240 | Clicked: 52 (21.7%) | Reported: 58 (24.2%)

TRAINING CAMPAIGNS
  Overall Completion: 87.4%

  1. 2024 Annual Security Training [ACTIVE]
     Deadline: 2024-03-31
     Enrolled: 250 | Completed: 198 (79.2%) | Past Due: 12

  2. Phishing Remediation - Feb [COMPLETED]
     Completed: 2024-02-28
     Enrolled: 38 | Completed: 35 (92.1%)

  3. New Hire Onboarding Q1 [ACTIVE]
     Rolling deadline
     Enrolled: 15 | Completed: 12 (80.0%)

SCHEDULED
  1. April Monthly Phishing Test [SCHEDULED]
     Start: 2024-04-01 | Groups: All Employees
```

### Phishing-Only Summary

```
PHISHING CAMPAIGN SUMMARY - Last 90 Days
==========================================

PPP TREND
  December 2023:  21.7%  █████████████████
  January 2024:   16.7%  █████████████
  February 2024:  15.3%  ████████████
  March 2024:     12.2%  ██████████ (in progress)

  Trend: Improving (-9.5% over 3 months)

CAMPAIGNS (5 total)
  ...
```

## Error Handling

### No Campaigns Found

```
No campaigns found for the specified period.

Try a wider date range or check that campaigns exist in your KnowBe4 account.
Most recent campaign: Holiday Season Test (completed 2023-12-31)
```

### Partial Data

```
Note: Campaign "March Monthly Test" is still in progress.
Results shown are preliminary and will change as more emails are delivered.
```

### API Errors

| Error | Resolution |
|-------|------------|
| 401 Unauthorized | Check KNOWBE4_API_KEY |
| 429 Rate Limited | Wait and retry |

## Related Commands

- `/phishing-results` - Detailed results for a specific phishing campaign
- `/training-status` - Detailed training completion status
- `/user-risk` - Risk score for individual users
- `/group-report` - Group-level security awareness metrics
