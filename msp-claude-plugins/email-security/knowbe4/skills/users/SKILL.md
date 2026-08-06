---
name: "KnowBe4 Users"
description: >
  KnowBe4 user and group management: user lifecycle and status, group creation
  and membership, risk scores and risk score history, user event tracking,
  provisioning, and group-based targeting for campaigns.
when_to_use: >-
  When working with KnowBe4 users, groups, or risk scores. Use when: knowbe4 user, knowbe4
  users, knowbe4 group, user risk score, risk score history, user management knowbe4, group
  management, user provisioning, user status, employee risk, security risk score, or user event.
---

# KnowBe4 User and Group Management

## Overview

Users and groups are the foundation of KnowBe4's security awareness platform. Users represent individual employees who receive phishing simulations and training. Groups organize users for targeted campaign delivery, reporting segmentation, and risk analysis. Each user has a risk score calculated from their phishing test performance and training completion, providing a quantitative measure of human security risk.

## Anti-triggers

- **Proofpoint's user risk data** — both vendors expose a per-user
  "risk score", but KnowBe4's is derived from simulations the MSP ran,
  while Proofpoint's Attack Index counts real attacks aimed at that
  person. They are not interchangeable; use `proofpoint-people` for
  VAP, Attack Index, and top-clicker data.
- **Per-campaign recipient rows** — a recipient belongs to a phishing
  security test and carries that test's click and reply timestamps;
  use `knowbe4-phishing`.
- **Org- or department-level risk aggregates and benchmarks** — use
  `knowbe4-reporting`.
- **Creating, disabling, or offboarding the actual mailbox account** —
  KnowBe4 users are training records, not identities. Microsoft 365
  user lifecycle is `cipp-users`.

## Key Concepts

### User Lifecycle

```
PROVISIONED ──> ACTIVE ──> ARCHIVED
                  │
                  └──> SUSPENDED
```

- **Provisioned**: User account created, not yet active in campaigns
- **Active**: User receiving phishing tests and training assignments
- **Archived**: User deactivated (left the organization)
- **Suspended**: Temporarily excluded from campaigns (leave, etc.)

### Risk Score

The KnowBe4 risk score quantifies an individual user's susceptibility to social engineering:

| Score Range | Risk Level | Description |
|-------------|------------|-------------|
| 0-20 | Low | User consistently passes phishing tests and completes training |
| 20-40 | Moderate-Low | Occasional failures but generally aware |
| 40-60 | Moderate | Average susceptibility, needs regular training |
| 60-80 | High | Frequently fails phishing tests, priority for remediation |
| 80-100 | Critical | Consistently fails tests, immediate intervention needed |

### Risk Score Factors

The risk score is influenced by:

| Factor | Weight | Description |
|--------|--------|-------------|
| Phishing click rate | High | Percentage of phishing tests clicked |
| Data entry rate | Very High | Submitted credentials on landing pages |
| Training completion | Medium | Percentage of assigned training completed |
| Reporting rate | Medium (positive) | Frequency of reporting phishing via PAB |
| Time to click | Low | How quickly user clicked (impulse vs. deliberate) |
| Recency | Modifier | Recent events weighted more heavily |

### Group Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Department** | Organizational department (IT, Sales, HR) | Department-specific campaigns |
| **Location** | Office location or region | Location-based targeting |
| **Role-based** | Job function (Executive, Manager, Staff) | Role-specific content |
| **Risk-based** | Grouped by risk score range | Targeted remediation |
| **Custom** | Manual grouping | Ad-hoc campaigns |
| **Smart** | Auto-populated based on criteria | Dynamic targeting |

## Field Reference

### User Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique user identifier |
| `employee_number` | string | HR employee number |
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `email` | string | Primary email address |
| `job_title` | string | Job title |
| `department` | string | Department name |
| `location` | string | Office location |
| `division` | string | Division |
| `manager_name` | string | Manager's name |
| `manager_email` | string | Manager's email |
| `employee_start_date` | datetime | Hire date |
| `phish_prone_percentage` | float | Individual phish-prone percentage |
| `current_risk_score` | float | Current calculated risk score |
| `status` | string | active, archived, suspended |
| `groups` | array | Groups the user belongs to |
| `aliases` | array | Email aliases |
| `joined_on` | datetime | When user was added to KnowBe4 |
| `last_sign_in` | datetime | Last platform sign-in |
| `custom_field_1` through `custom_field_4` | string | Custom fields |
| `custom_date_1` | datetime | Custom date field |
| `organization` | string | Organization name |
| `language` | string | Preferred language |
| `comment` | string | Admin notes |

### Group Fields

| Field | Type | Description |
|-------|------|-------------|
| `group_id` | int | Unique group identifier |
| `name` | string | Group name |
| `group_type` | string | Type of group |
| `provisioning_managed` | boolean | Managed by provisioning (AD/SCIM) |
| `member_count` | int | Number of members |
| `current_risk_score` | float | Group average risk score |
| `status` | string | active, archived |

### Risk Score History Fields

| Field | Type | Description |
|-------|------|-------------|
| `risk_score` | float | Risk score at this point in time |
| `date` | datetime | Date of the risk score calculation |
| `change` | float | Change from previous score |
| `factors` | object | Breakdown of contributing factors |

## MCP Tools

| Tool | Description | Parameters (required in **bold**) |
|------|-------------|----------------|
| `knowbe4_users_list` | List users — email, name, risk score, department | `status` (`active`\|`archived`), `group_id`, `page`, `per_page` |
| `knowbe4_users_get` | Get user details: risk score, PPP, training status, group memberships | **`user_id`** |
| `knowbe4_users_risk_score_history` | Risk score history for one user | **`user_id`**, `page`, `per_page` |
| `knowbe4_groups_list` | List groups — names, member counts, risk scores | `page`, `per_page` |
| `knowbe4_groups_get` | Get group details, including risk score and member count | **`group_id`** |
| `knowbe4_groups_members` | List members of a group, with user details for each | **`group_id`**, `page`, `per_page` |
| `knowbe4_groups_risk_score_history` | Risk score history for one group | **`group_id`**, `page`, `per_page` |
| `knowbe4_account_get` | Account-level info: subscription, seats, admin details, current risk score | none |
| `knowbe4_account_risk_score_history` | Account-level risk score over time | `page`, `per_page` |

**There is no per-user event feed.** No tool returns a user's phishing and
training history as a stream, and `knowbe4_users_get` does not carry one —
it returns the user's current standing (risk score, phish-prone
percentage, training status, groups), not the events behind it. Per-person
behavioural detail lives on the phishing side instead, as recipient
records within a specific Phishing Security Test: see
`knowbe4_phishing_security_test_recipients` and
`knowbe4_phishing_security_test_recipient` in the phishing skill. Building
"everything this user did" means walking the PSTs they were part of, which
is deliberate friction around individually identifying monitoring data —
see GOVERNANCE.md.

Note `knowbe4_groups_list` has no `status` filter, and a KnowBe4 group is
not a department: `department` is a field on the user record, so
department rollups have to be computed from `knowbe4_users_list`.

## Common Workflows

### User Risk Assessment

1. **Get user details** with `knowbe4_users_get` for current risk score
2. **Pull risk score history** with `knowbe4_users_risk_score_history`
3. **Check phishing behaviour** -- find the PSTs the user was part of and
   pull their recipient records (there is no per-user event feed)
4. **Compare to group average** -- use `knowbe4_groups_get` for the group's
   risk score; note a group is not necessarily their department
5. **Recommend action** based on risk level and trend direction

### Identify High-Risk Users

1. **List all users** with `knowbe4_users_list`
2. **Sort by `current_risk_score`** descending
3. **Filter** to users with risk score above threshold (e.g., 60+)
4. **Cross-reference** with group membership for department context
5. **Generate prioritized remediation list**

### Group Risk Comparison

1. **List all groups** with `knowbe4_groups_list`
2. **Get group risk scores** for each group
3. **Rank departments** by average risk score
4. **Identify outlier groups** -- significantly higher or lower than average
5. **Recommend targeted campaigns** for high-risk groups

### New Employee Onboarding

1. **Create user** or verify auto-provisioned via AD/SCIM sync
2. **Add to appropriate groups** (department, location, "New Hires")
3. **Verify enrollment** in onboarding training campaign
4. **Monitor initial phishing test** results
5. **Adjust group membership** after onboarding period

### User Offboarding

1. **Identify departing user** by employee ID or email
2. **Archive the user** to remove from active campaigns
3. **Note**: Historical data (phishing results, training) is preserved for reporting
4. **Verify** user is removed from active campaign targeting

### Risk Score Trend Analysis

1. **Pull risk score history** for user or group over 6-12 months
2. **Plot trend** -- is risk decreasing (good) or increasing (bad)?
3. **Correlate with events** -- training completion should precede risk decrease
4. **Identify plateau** -- if risk score stopped improving, change training approach
5. **Report progress** to stakeholders

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid user parameters | Check email format, required fields |
| 401 | Invalid API token | Verify KNOWBE4_API_KEY |
| 403 | Insufficient permissions | API token needs User Management permissions |
| 404 | User not found | Verify user_id exists |
| 404 | Group not found | Verify group_id exists |
| 409 | Duplicate email | User with this email already exists |
| 429 | Rate limit exceeded | Implement backoff (see api-patterns) |

### Data Considerations

| Issue | Cause | Resolution |
|-------|-------|------------|
| Risk score is null | New user with no test data | Wait for first phishing test |
| User not in expected group | AD sync not configured | Check provisioning settings |
| Archived user still in reports | Historical data preserved by design | Filter by status=active |
| Group member count mismatch | Includes archived users | Filter by active status |
| Custom fields empty | Not configured in console | Set up in Account Settings |

## Best Practices

1. **Use AD/SCIM provisioning** -- Automate user lifecycle from Active Directory
2. **Maintain clean groups** -- Regularly audit group membership
3. **Track risk trends** -- Monthly risk score reviews are more useful than point-in-time
4. **Set risk thresholds** -- Define organizational policy for risk score actions
5. **Segment campaigns by risk** -- High-risk users need more frequent, targeted training
6. **Use manager email field** -- Enables manager notification for training compliance
7. **Clean up departed users** -- Archive promptly to keep metrics accurate
8. **Leverage custom fields** -- Map to HR attributes for richer reporting
9. **Monitor group averages** -- Department-level risk trends reveal systemic issues
10. **Correlate with incidents** -- Compare risk scores to actual security incidents

## Related Skills

- [KnowBe4 Phishing](../phishing/SKILL.md) - Phishing simulation campaigns
- [KnowBe4 Training](../training/SKILL.md) - Training campaign management
- [KnowBe4 Reporting](../reporting/SKILL.md) - Risk metrics and dashboards
- [KnowBe4 API Patterns](../api-patterns/SKILL.md) - Authentication, pagination, and rate limits
