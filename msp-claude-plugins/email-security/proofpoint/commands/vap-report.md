---
description: Get the Very Attacked People (VAP) report showing the most targeted users
argument-hint: "[window] [size] [user] [department]"
arguments: [window, size, user, department]
---

# Very Attacked People (VAP) Report

Generate a report of the most attacked users in the organization, including attack index scores, threat breakdowns, and risk assessments.

## Prerequisites

- Valid Proofpoint service principal and secret configured
- People-Centric Security API access
- Minimum 14 days of email data for meaningful results

## Steps

1. **Determine report scope**
   - If `user` is provided, get individual risk profile
   - Otherwise, generate VAP ranking report

2. **Fetch people data**
   - Call `proofpoint_people_get_vap` with window and size
   - Or call `proofpoint_people_get_user_risk` for individual user

3. **Enrich with context**
   - Add department and title information
   - Cross-reference with top clickers data
   - Calculate risk categories

4. **Format report**
   - Display ranked list with attack index scores
   - Show threat breakdown by classification
   - Highlight users who are both attacked and click-prone

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| window | int | No | 30 | Time window (14, 30, or 90 days) |
| size | int | No | 20 | Number of top users |
| user | string | No | - | Specific user email |
| department | string | No | - | Filter by department |

## Examples

### Default VAP Report

```
/vap-report
```

### 90-Day Report, Top 50

```
/vap-report --window 90 --size 50
```

### Specific User Risk Profile

```
/vap-report --user "cfo@acmecorp.com"
```

### Department Report

```
/vap-report --department "Finance" --window 30
```

### Executive Risk Assessment

```
/vap-report --department "Executive" --window 90 --size 10
```

## Output

### VAP Ranking Report

```
Very Attacked People Report - Last 30 Days
Organization: Acme Corporation

Top 20 Most Attacked Users:

+----+------------------------+--------------+-------+--------+--------+--------+----------+
| #  | User                   | Department   | Index | Phish  | Malware| BEC    | Clicks   |
+----+------------------------+--------------+-------+--------+--------+--------+----------+
|  1 | cfo@acmecorp.com       | Finance      |   856 |    45  |    12  |    28  | 3 (7%)   |
|  2 | ceo@acmecorp.com       | Executive    |   742 |    38  |     8  |    35  | 0 (0%)   |
|  3 | ap@acmecorp.com        | Finance      |   689 |    52  |    15  |    18  | 5 (12%)  |
|  4 | hr@acmecorp.com        | HR           |   534 |    31  |    22  |     8  | 2 (6%)   |
|  5 | it-admin@acmecorp.com  | IT           |   498 |    28  |    35  |     3  | 1 (2%)   |
|  6 | sales-lead@acmecorp.com| Sales        |   423 |    34  |     9  |    12  | 4 (11%)  |
|  7 | controller@acmecorp.com| Finance      |   398 |    25  |     6  |    22  | 0 (0%)   |
|  8 | vp-ops@acmecorp.com    | Operations   |   367 |    18  |    12  |    15  | 1 (4%)   |
|  9 | receptionist@acme...   | Admin        |   312 |    42  |     8  |     2  | 6 (15%)  |
| 10 | dev-lead@acmecorp.com  | Engineering  |   287 |    15  |    28  |     1  | 0 (0%)   |
+----+------------------------+--------------+-------+--------+--------+--------+----------+

Risk Summary:
  Very High Risk (Index > 500): 5 users
  High Risk (Index 200-500):    5 users
  Users with click activity:    6 users

HIGH PRIORITY: 3 users are both heavily attacked AND click-prone:
  1. ap@acmecorp.com        - Attack Index: 689, Click Rate: 12%
  2. sales-lead@acmecorp.com - Attack Index: 423, Click Rate: 11%
  3. receptionist@acme...    - Attack Index: 312, Click Rate: 15%

Recommendations:
  - Enroll high-clickers in targeted phishing simulation
  - Enable browser isolation for top 5 VAPs
  - Review MFA settings for all VAPs
  - Consider dedicated email filtering rules for finance/executive
```

### Individual User Report

```
User Risk Profile: cfo@acmecorp.com
Report Period: Last 30 Days

USER IDENTITY
  Name:       Jane Smith
  Email:      cfo@acmecorp.com
  Title:      Chief Financial Officer
  Department: Finance
  VIP:        Yes

RISK ASSESSMENT
  Overall Risk:   Very High
  Attack Index:   856
  Click Rate:     7% (3 clicks on 45 threats)
  Risk Category:  Very High Risk

THREAT BREAKDOWN
  Total Threats:  85
  Phishing:       45 (53%)
  BEC/Impostor:   28 (33%)
  Malware:        12 (14%)

TOP THREAT FAMILIES
  1. TA505 campaigns (18 messages)
  2. Office 365 credential phishing (12 messages)
  3. BEC wire transfer requests (9 messages)

CLICK HISTORY
  Total Clicks:   3 (last 30 days)
  Last Click:     2024-02-15 09:35:00
  Clicks Blocked: 2
  Clicks Permitted: 1 [!]

  Recent Clicks:
    1. 2024-02-15 - Credential harvester (PERMITTED)
    2. 2024-02-10 - Phishing page (BLOCKED)
    3. 2024-02-03 - Malware download (BLOCKED)

RECOMMENDATIONS
  1. URGENT: Verify no credential compromise from Feb 15 click
  2. Enroll in executive phishing simulation program
  3. Enable browser isolation for this user
  4. Review and strengthen MFA configuration
  5. Consider dedicated email filtering rules
  6. Schedule 1:1 security awareness briefing
```

## Error Handling

### Insufficient Data

```
Warning: Insufficient data for VAP report

Your organization has less than 14 days of email data.
VAP reports require at least 14 days for meaningful results.

Current data available: 8 days
Try again after: 2024-02-22
```

### User Not Found

```
Error: User not found: "unknown@acmecorp.com"

This email address was not found in Proofpoint.
Possible causes:
- User does not receive email through Proofpoint
- Email address may be misspelled
- User account may be new (< 14 days)
```

### People API Not Enabled

```
Error: People-Centric Security API not available

Your Proofpoint license may not include the People API.
Contact your Proofpoint account manager for access.
```

## Related Commands

- `/check-threats` - View recent TAP threats
- `/investigate-threat` - Deep-dive threat investigation
- `/search-quarantine` - Search quarantined messages
