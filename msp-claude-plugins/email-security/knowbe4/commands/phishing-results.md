---
description: View phishing campaign results and click rates from KnowBe4
argument-hint: "[campaign] [period] [group] [detail]"
arguments: [campaign, period, group, detail]
---

# View Phishing Campaign Results

Retrieve and display phishing simulation results and click rates from KnowBe4.

## Prerequisites

- Valid KnowBe4 API key configured
- API token with Reporting permissions
- Correct KNOWBE4_REGION set

## Steps

1. **Determine scope**
   - If campaign ID/name provided, fetch that specific campaign
   - If period provided, fetch all campaigns within that date range
   - If neither, default to most recent completed campaign

2. **Retrieve campaign data**
   - Use `knowbe4_phishing_list_campaigns` to find campaigns
   - Use `knowbe4_phishing_get_campaign` for specific campaign details

3. **Get security test results**
   - Use `knowbe4_phishing_list_security_tests` for each campaign
   - Use `knowbe4_phishing_get_security_test` for detailed counts

4. **Filter by group if specified**
   - Cross-reference recipients with group membership
   - Calculate group-specific metrics

5. **Calculate metrics**
   - Phish-prone percentage (PPP)
   - Click rate, open rate, report rate
   - Data entry rate (most critical failure)

6. **Format and display results**
   - Summary view: campaign name, PPP, key counts
   - Detailed view: per-test breakdown
   - Recipients view: individual user results

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign | string/int | No | Most recent | Campaign name or ID |
| period | string | No | Last completed | Time period for results |
| group | string/int | No | All groups | Filter by specific group |
| detail | string | No | summary | summary, detailed, or recipients |

## Examples

### View Most Recent Campaign Results

```
/phishing-results
```

### View Specific Campaign

```
/phishing-results --campaign 12345
```

### View Results for a Time Period

```
/phishing-results --period "last 30 days"
```

### View Detailed Results by Group

```
/phishing-results --campaign "Q1 Baseline Test" --group "Sales Team" --detail detailed
```

### View Individual Recipient Results

```
/phishing-results --campaign 12345 --detail recipients
```

## Output

### Summary View

```
PHISHING CAMPAIGN RESULTS
=========================
Campaign: Q1 2024 Baseline Test
Status: Completed
Period: 2024-01-15 to 2024-01-29

RESULTS
  Delivered:    248
  Opened:       187 (75.4%)
  Clicked:       42 (16.9%)
  Data Entered:  12 (4.8%)
  Reported:      89 (35.9%)
  Bounced:        2 (0.8%)

PHISH-PRONE PERCENTAGE: 16.9%

CLICK-TO-REPORT RATIO: 0.47:1
```

### Detailed View

```
PHISHING CAMPAIGN RESULTS - DETAILED
=====================================
Campaign: Q1 2024 Baseline Test

Security Test 1: "Password Reset Required"
  Template Category: IT/Helpdesk
  Delivered: 125 | Clicked: 28 (22.4%) | Reported: 38 (30.4%)

Security Test 2: "Shared Document"
  Template Category: Cloud Services
  Delivered: 123 | Clicked: 14 (11.4%) | Reported: 51 (41.5%)

DEPARTMENT BREAKDOWN
  Sales:      32.1% PPP (highest)
  Marketing:  18.5% PPP
  Finance:    12.3% PPP
  IT:          4.2% PPP (lowest)
```

## Error Handling

### Campaign Not Found

```
No campaign found matching "Q3 Test".

Recent campaigns:
- Q1 2024 Baseline Test (ID: 12345) - Completed
- February Monthly Test (ID: 12340) - Completed
- January Spear Phish (ID: 12335) - Completed
```

### No Data for Period

```
No phishing campaigns found for the period 2024-06-01 to 2024-06-30.

Last campaign: Q1 2024 Baseline Test (completed 2024-01-29)
```

### API Errors

| Error | Resolution |
|-------|------------|
| 401 Unauthorized | Check KNOWBE4_API_KEY |
| 404 Not Found | Verify campaign ID and KNOWBE4_REGION |
| 429 Rate Limited | Wait and retry |

## Related Commands

- `/training-status` - Check training completion for users
- `/user-risk` - Get risk score for individual users
- `/campaign-summary` - Overview of recent campaigns
- `/group-report` - Group-level security awareness metrics
