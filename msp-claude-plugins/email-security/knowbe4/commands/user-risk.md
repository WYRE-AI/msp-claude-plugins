---
description: Get risk score and risk history for a KnowBe4 user
argument-hint: "<user> [period] [compare]"
arguments: [user, period, compare]
---

# Get User Risk Score and History

Retrieve the risk score, risk history, and contributing factors for a specific KnowBe4 user.

## Prerequisites

- Valid KnowBe4 API key configured
- API token with Reporting permissions
- Correct KNOWBE4_REGION set

## Steps

1. **Resolve user identity**
   - If numeric, use as user ID directly
   - If email, search users by email
   - If name, search by first/last name and confirm match

2. **Get user profile**
   - Use `knowbe4_users_get` for current details and risk score
   - Note department, groups, and phish-prone percentage

3. **Get risk score history**
   - Use `knowbe4_users_risk_score_history` for trend data
   - Default to 6 months if period not specified

4. **Get contributing events**
   - There is no per-user event tool. Reconstruct the phishing side by
     listing PSTs with `knowbe4_phishing_security_tests_list` and pulling
     `knowbe4_phishing_security_test_recipients` for the ones that
     included this user
   - Training standing comes from the user record itself
     (`knowbe4_users_get`) and from `knowbe4_training_enrollments_list`
   - Correlate what you find with risk score changes, and say which
     window you actually covered

5. **Compare to peers if requested**
   - Get department or group average risk score
   - Calculate user's position relative to peers

6. **Format and display results**
   - Current risk score with level indicator
   - Trend direction (improving, stable, degrading)
   - Contributing factors
   - Recommendations

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| user | string/int | Yes | - | User email, name, or ID |
| period | string | No | 6 months | Time period for history |
| compare | string | No | - | Compare to group/department average |

## Examples

### Basic Risk Check

```
/user-risk jane.doe@company.com
```

### With Extended History

```
/user-risk jane.doe@company.com --period "1 year"
```

### Compare to Department

```
/user-risk jane.doe@company.com --compare department
```

### By User ID

```
/user-risk 12345 --period "3 months"
```

### By Name

```
/user-risk "Jane Doe"
```

## Output

### Standard View

```
USER RISK ASSESSMENT
=====================
Name:       Jane Doe
Email:      jane.doe@company.com
Department: Sales
Location:   New York
Groups:     Sales Team, All Employees

RISK SCORE: 42.8 (MODERATE)
  Trend: Improving (was 58.3 six months ago)
  Phish-Prone %: 25.0%
  Department Avg: 38.5

RISK SCORE HISTORY (6 months)
  2024-02: 58.3  ████████████
  2024-01: 52.1  ██████████
  2023-12: 48.7  ██████████
  2023-11: 45.2  █████████
  2023-10: 44.0  █████████
  2023-09: 42.8  █████████

CONTRIBUTING FACTORS
  + Clicked phishing link (2024-01-15) - "Password Reset" template
  + Entered data on landing page (2023-11-20) - "Shared Document" template
  - Completed "Think Before You Click" training (2024-02-01)
  - Reported phishing via PAB (2024-02-10)
  - Completed "Security Awareness Essentials" (2023-12-15)

RECOMMENDATIONS
  1. Assign targeted anti-phishing training focusing on password reset scenarios
  2. Monitor closely -- risk trend is positive but still above department average
  3. Include in next phishing simulation for follow-up assessment
```

### Comparison View

```
USER RISK COMPARISON
=====================
User: Jane Doe (42.8)
Department: Sales (avg: 38.5)
Organization: All Users (avg: 31.2)

        Jane Doe  Sales Avg  Org Avg
Risk:     42.8      38.5      31.2
PPP:      25.0%     22.1%     15.8%
Training: 85.0%     88.0%     92.0%
Reports:  20.0%     25.0%     35.0%

Status: Above department average risk by 4.3 points
```

## Error Handling

### User Not Found

```
No user found matching "jane@company.com".

Did you mean one of these?
- jane.doe@company.com (Jane Doe, Sales)
- janet.smith@company.com (Janet Smith, Marketing)
- jane.williams@company.com (Jane Williams, HR)
```

### No Risk Data

```
No risk score data available for Jane Doe.

This user has not yet participated in any phishing simulations.
Risk score will be calculated after first phishing test.
```

### API Errors

| Error | Resolution |
|-------|------------|
| 401 Unauthorized | Check KNOWBE4_API_KEY |
| 404 Not Found | Verify user ID and KNOWBE4_REGION |
| 429 Rate Limited | Wait and retry |

## Related Commands

- `/phishing-results` - View phishing campaign results
- `/training-status` - Check training completion status
- `/campaign-summary` - Overview of recent campaigns
- `/group-report` - Group-level security awareness metrics
