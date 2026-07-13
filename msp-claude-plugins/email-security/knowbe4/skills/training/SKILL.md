---
name: "KnowBe4 Training"
description: >
  Use this skill when working with KnowBe4 training campaigns - creating and managing
  training assignments, tracking enrollment and completion, browsing training modules
  and content library, managing store purchases, and monitoring compliance deadlines.
  Covers training campaign lifecycle, enrollment workflows, completion tracking, and
  content management for security awareness programs.
when_to_use: >-
  When creating and managing training assignments, tracking enrollment and completion, browsing
  training modules and content library, managing store purchases. Use when: knowbe4 training,
  training campaign, security awareness training, training enrollment, training completion,
  training module, knowbe4 course, training assignment, training status, compliance training,
  training content, store purchase, or training deadline.
---

# KnowBe4 Training Campaign Management

## Overview

KnowBe4 training campaigns deliver security awareness content to users through structured enrollment workflows. Training can be assigned manually, triggered automatically after phishing test failures, or scheduled on a recurring basis. Each campaign tracks enrollment status, completion rates, and compliance deadlines. The training content library includes interactive modules, videos, games, assessments, and policy documents.

## Key Concepts

### Training Campaign Lifecycle

```
CREATED ──> SCHEDULED ──> ACTIVE ──> CLOSED
                │                       │
                └──── CANCELLED         └──> ARCHIVED
```

- **Created**: Campaign configured with content and target groups
- **Scheduled**: Queued to begin enrollment at a future date
- **Active**: Users enrolled and training in progress
- **Closed**: Campaign deadline passed, final completion recorded
- **Cancelled**: Campaign aborted
- **Archived**: Closed campaign moved to archive

### Enrollment Statuses

| Status | Description | Business Meaning |
|--------|-------------|------------------|
| **Not Started** | User enrolled but has not begun | Needs reminder |
| **In Progress** | User has started but not completed | Actively working |
| **Completed** | User finished all required content | Compliant |
| **Past Due** | Deadline passed without completion | Non-compliant |

### Training Content Types

| Type | Description | Typical Duration |
|------|-------------|-----------------|
| **Training Module** | Interactive course with slides and quizzes | 15-45 minutes |
| **Video** | Pre-recorded security awareness video | 5-15 minutes |
| **Game** | Gamified security training | 10-20 minutes |
| **Assessment** | Knowledge check quiz | 5-10 minutes |
| **Policy** | Policy document requiring acknowledgment | 2-5 minutes |
| **Newsletter** | Security awareness newsletter | 3-5 minutes |
| **Poster** | Downloadable awareness poster | N/A |

### Auto-Enrollment Triggers

Training can be triggered automatically based on:

| Trigger | Description |
|---------|-------------|
| **Phishing Failure** | User clicked/failed a phishing test |
| **New Hire** | User added to the system |
| **Group Membership** | User added to a specific group |
| **Scheduled** | Recurring enrollment (monthly, quarterly, annually) |
| **Manager Request** | Manual enrollment by manager/admin |

## Field Reference

### Training Campaign Fields

| Field | Type | Description |
|-------|------|-------------|
| `campaign_id` | int | Unique campaign identifier |
| `name` | string | Campaign name |
| `status` | string | Current status |
| `content` | array | List of training modules/content assigned |
| `groups` | array | Target groups |
| `duration_type` | string | How long users have to complete |
| `start_date` | datetime | When enrollment begins |
| `end_date` | datetime | Completion deadline |
| `relative_duration` | string | Days from enrollment to complete |
| `auto_enroll` | boolean | Whether new group members are auto-enrolled |
| `allow_multiple_enrollments` | boolean | Can users retake the training |
| `completion_percentage` | float | Percentage of enrollees who completed |

### Training Enrollment Fields

| Field | Type | Description |
|-------|------|-------------|
| `enrollment_id` | int | Unique enrollment identifier |
| `content_type` | string | Type of content assigned |
| `module_name` | string | Name of the training module |
| `user` | object | Enrolled user details |
| `campaign_id` | int | Parent campaign |
| `enrollment_date` | datetime | When user was enrolled |
| `start_date` | datetime | When user began training |
| `completion_date` | datetime | When user completed training |
| `status` | string | not_started, in_progress, completed, past_due |
| `time_spent` | int | Seconds spent on training |
| `current_module` | string | Module user is currently on |
| `policy_acknowledged` | boolean | Whether policy was acknowledged |

### Store Purchase Fields

| Field | Type | Description |
|-------|------|-------------|
| `store_purchase_id` | int | Unique purchase identifier |
| `content_id` | int | Purchased content item |
| `content_type` | string | Type of content |
| `content_name` | string | Name of content item |
| `purchase_date` | datetime | When purchased |
| `expiration_date` | datetime | License expiration |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `knowbe4_training_list_campaigns` | List training campaigns | `status`, `page`, `per_page` |
| `knowbe4_training_get_campaign` | Get campaign details | `campaign_id` |
| `knowbe4_training_list_enrollments` | List enrollments for a campaign | `campaign_id`, `status`, `page` |
| `knowbe4_training_get_enrollment` | Get enrollment details | `enrollment_id` |
| `knowbe4_training_list_modules` | List available training modules | `type`, `page`, `per_page` |
| `knowbe4_training_get_module` | Get module details | `module_id` |
| `knowbe4_training_list_store_purchases` | List store purchases | `page`, `per_page` |
| `knowbe4_training_get_store_purchase` | Get purchase details | `store_purchase_id` |

## Common Workflows

### Create and Monitor Training Campaign

1. **Browse available modules** using `knowbe4_training_list_modules`
2. **Select target groups** -- choose which user groups need training
3. **Set completion deadline** -- allow adequate time (2-4 weeks typical)
4. **Launch campaign** -- schedule or start immediately
5. **Monitor enrollment status** -- check completion rates weekly
6. **Send reminders** to users with "not_started" or "in_progress" status
7. **Review final completion** after deadline

### Track Compliance Status

1. **List active campaigns** with `knowbe4_training_list_campaigns`
2. **Get enrollments** for each campaign
3. **Filter by status** to find incomplete/past_due enrollments
4. **Identify non-compliant users** -- group by department or manager
5. **Escalate** users who are past due on required training

### Post-Phishing Remediation Training

1. **Identify failed users** from phishing campaign results
2. **Find appropriate remedial module** matching the phishing scenario
3. **Create targeted campaign** for failed users only
4. **Set short deadline** (1 week for remediation)
5. **Track completion** and re-test with follow-up phishing simulation

### Quarterly Security Awareness Review

1. **Pull all completed campaigns** for the quarter
2. **Calculate overall completion rate** across all campaigns
3. **Identify departments** with lowest completion rates
4. **Review training content** -- are modules current and relevant?
5. **Plan next quarter** based on gaps identified

### New Hire Onboarding

1. **Create onboarding training campaign** with essential modules
2. **Enable auto-enrollment** for the "New Hires" group
3. **Set relative deadline** (e.g., 14 days from enrollment)
4. **Include baseline phishing test** after training completion
5. **Move to regular groups** after onboarding completion

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid campaign configuration | Verify content IDs and group IDs exist |
| 401 | Invalid API token | Verify KNOWBE4_API_KEY |
| 403 | Insufficient permissions | API token needs Training permissions |
| 404 | Campaign not found | Verify campaign_id exists |
| 404 | Enrollment not found | Verify enrollment_id exists |
| 429 | Rate limit exceeded | Implement backoff (see api-patterns) |

### Data Considerations

| Issue | Cause | Resolution |
|-------|-------|------------|
| Zero completion rate | Campaign just started | Allow time for users to complete |
| User not enrolled | Not in target group | Check group membership |
| Completion not recording | Module requires assessment pass | User may need to retake quiz |
| Past due but completed | Completed after deadline | Marked past_due at deadline, then completed |
| Duplicate enrollments | Multiple campaigns with same content | Check `allow_multiple_enrollments` |

## Best Practices

1. **Set realistic deadlines** -- Allow 2-4 weeks for standard training, 1 week for remediation
2. **Send reminders** -- Notify at 50% and 75% of deadline elapsed
3. **Keep content fresh** -- Rotate training modules quarterly
4. **Match training to threats** -- Use phishing failure data to select relevant modules
5. **Track completion trends** -- Completion rates should improve over time
6. **Segment by audience** -- Executives, IT, finance, and general staff need different content
7. **Combine with phishing** -- Always follow training with a phishing simulation to validate
8. **Use gamification** -- Games and competitions increase engagement
9. **Report to stakeholders** -- Share completion rates with department managers
10. **Automate remediation** -- Auto-enroll phishing test failures in relevant training

## Related Skills

- [KnowBe4 Phishing](../phishing/SKILL.md) - Phishing simulation campaigns
- [KnowBe4 Users](../users/SKILL.md) - User management and groups
- [KnowBe4 Reporting](../reporting/SKILL.md) - Training completion metrics
- [KnowBe4 API Patterns](../api-patterns/SKILL.md) - Authentication, pagination, and rate limits
