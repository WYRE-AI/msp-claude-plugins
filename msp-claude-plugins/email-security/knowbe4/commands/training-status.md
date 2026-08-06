---
description: Check training completion status for users or groups in KnowBe4
argument-hint: "[user] [group] [campaign] [status]"
arguments: [user, group, campaign, status]
---

# Check Training Completion Status

Check training completion status for users or groups in KnowBe4.

## Prerequisites

- Valid KnowBe4 API key configured
- API token with Reporting permissions
- Correct KNOWBE4_REGION set

## Steps

1. **Determine scope**
   - If user provided, check that specific user's enrollments
   - If group provided, check all members of that group
   - If campaign provided, check all enrollments for that campaign
   - If none provided, show summary across all active campaigns

2. **Retrieve training campaigns**
   - Use `knowbe4_training_campaigns_list` to find campaigns, then keep
     the active ones yourself — there is no status argument
   - Use `knowbe4_training_campaigns_get` for specific campaign details

3. **Get enrollment data**
   - Use `knowbe4_training_enrollments_list`. It is account-wide and takes
     no `campaign_id`, so page through it and match enrollments back to
     the campaign yourself
   - Filter by status client-side if specified

4. **Resolve user/group context**
   - If user specified, look up by email or ID
   - If group specified, get group members and cross-reference

5. **Calculate completion metrics**
   - Total enrolled, completed, in_progress, not_started, past_due
   - Completion percentage
   - Average time spent

6. **Format and display results**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| user | string/int | No | - | User email or ID |
| group | string/int | No | - | Group name or ID |
| campaign | string/int | No | All active | Training campaign name or ID |
| status | string | No | All statuses | Filter: not_started, in_progress, completed, past_due |

## Examples

### View All Active Training Status

```
/training-status
```

### Check Specific User

```
/training-status --user jane.doe@company.com
```

### Check Group Completion

```
/training-status --group "Sales Team"
```

### View Past Due Users for a Campaign

```
/training-status --campaign "2024 Annual Security Training" --status past_due
```

### Check Specific Campaign Completion

```
/training-status --campaign 5678
```

## Output

### Summary View (All Active Campaigns)

```
TRAINING STATUS SUMMARY
========================

Campaign: 2024 Annual Security Training
  Deadline: 2024-03-31
  Enrolled:    250
  Completed:   198 (79.2%)
  In Progress:  22 (8.8%)
  Not Started:  18 (7.2%)
  Past Due:     12 (4.8%)

Campaign: New Hire Onboarding Q1
  Deadline: Rolling (14 days from enrollment)
  Enrolled:     15
  Completed:    12 (80.0%)
  In Progress:   3 (20.0%)

OVERALL COMPLETION: 80.0%
```

### User View

```
TRAINING STATUS - jane.doe@company.com
========================================
Name: Jane Doe
Department: Sales
Risk Score: 34.2

Active Enrollments:
  1. 2024 Annual Security Training
     Module: "Security Awareness Essentials"
     Status: In Progress (60% complete)
     Enrolled: 2024-01-15
     Deadline: 2024-03-31
     Time Spent: 18 minutes

  2. Phishing Remediation
     Module: "Think Before You Click"
     Status: Not Started
     Enrolled: 2024-02-20
     Deadline: 2024-02-27

Completed (Last 12 months):
  - Q4 2023 Security Refresher (Completed 2023-11-28)
  - Ransomware Awareness (Completed 2023-09-15)
```

### Group View

```
TRAINING STATUS - Sales Team (15 members)
==========================================
Campaign: 2024 Annual Security Training

Completed (9):
  Jane Doe, John Smith, Alice Johnson, Bob Williams,
  Carol Brown, Dave Jones, Eve Davis, Frank Miller, Grace Wilson

In Progress (3):
  Henry Taylor (40%), Iris Anderson (25%), Jack Thomas (10%)

Not Started (2):
  Karen Martinez, Larry Jackson

Past Due (1):
  Mike White (enrolled 2024-01-15, deadline 2024-02-15)

COMPLETION RATE: 60.0%
```

## Error Handling

### User Not Found

```
No user found matching "jane@company.com".

Similar users:
- jane.doe@company.com (Jane Doe, Sales)
- janet.smith@company.com (Janet Smith, Marketing)
```

### No Active Campaigns

```
No active training campaigns found.

Recent completed campaigns:
- Q4 2023 Security Refresher (completed 2023-12-15)
- Ransomware Awareness (completed 2023-10-01)
```

### API Errors

| Error | Resolution |
|-------|------------|
| 401 Unauthorized | Check KNOWBE4_API_KEY |
| 404 Not Found | Verify user/campaign/group ID and KNOWBE4_REGION |
| 429 Rate Limited | Wait and retry |

## Related Commands

- `/phishing-results` - View phishing campaign results
- `/user-risk` - Get risk score for individual users
- `/campaign-summary` - Overview of recent campaigns
- `/group-report` - Group-level security awareness metrics
