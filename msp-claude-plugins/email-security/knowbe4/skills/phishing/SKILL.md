---
name: "KnowBe4 Phishing"
description: >
  Use this skill when working with KnowBe4 phishing simulations - creating campaigns,
  managing security tests, tracking recipient interactions (sent, opened, clicked, reported),
  calculating phish-prone percentages, and analyzing phishing simulation results.
  Covers campaign lifecycle, template selection, landing pages, and click tracking.
  Essential for MSP security teams running phishing awareness programs.
when_to_use: >-
  When creating campaigns, managing security tests, tracking recipient interactions (sent, opened,
  clicked, reported), calculating phish-prone percentages. Use when: knowbe4 phishing, phishing
  campaign, phishing simulation, phish-prone percentage, security test knowbe4, phishing template,
  click tracking, phishing results, simulated phishing, phishing report, recipient tracking,
  phishing landing page, or phishing test.
---

# KnowBe4 Phishing Simulation Management

## Overview

KnowBe4 phishing simulations are the core mechanism for testing and improving an organization's resilience to social engineering attacks. Campaigns deliver simulated phishing emails to users and track their interactions -- whether they opened the email, clicked the link, submitted data on the landing page, reported it via the Phish Alert Button, or took no action. The phish-prone percentage is the key metric derived from these campaigns.

## Key Concepts

### Campaign Lifecycle

```
CREATED ──> SCHEDULED ──> IN_PROGRESS ──> COMPLETED
                │                              │
                └──── CANCELLED                └──> ARCHIVED
```

- **Created**: Campaign configured but not yet scheduled
- **Scheduled**: Campaign queued for delivery at a specific date/time
- **In Progress**: Emails are being sent and interactions tracked
- **Completed**: Campaign delivery finished, final results available
- **Cancelled**: Campaign aborted before completion
- **Archived**: Completed campaign moved to archive

### Security Test Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Phishing** | Standard email with link to landing page | Most common, baseline testing |
| **Vishing** | Voice-based social engineering simulation | Phone-based attack awareness |
| **Smishing** | SMS-based phishing simulation | Mobile threat awareness |
| **USB** | Physical USB drop test | Physical security awareness |
| **QR Code** | QR code-based phishing | Emerging threat vector |

### Recipient Interaction States

Each recipient in a campaign progresses through trackable states:

| State | Description | Indicates |
|-------|-------------|-----------|
| **Delivered** | Email successfully delivered | Baseline count |
| **Opened** | Recipient opened the email | Curiosity/engagement |
| **Clicked** | Recipient clicked the phishing link | Failed the test |
| **Replied** | Recipient replied to the email | Failed the test (data leakage risk) |
| **Attachment Opened** | Recipient opened an attachment | Failed the test |
| **Macro Enabled** | Recipient enabled macros in attachment | Critical failure |
| **Data Entered** | Recipient submitted data on landing page | Critical failure |
| **Reported** | Recipient reported via Phish Alert Button | Passed the test |
| **No Action** | No interaction recorded | Neutral (may not have seen it) |

### Phish-Prone Percentage Calculation

The phish-prone percentage (PPP) is the primary metric for organizational risk:

```javascript
function calculatePhishPronePercentage(campaign) {
  const totalDelivered = campaign.recipients.filter(r => r.delivered).length;
  const totalFailed = campaign.recipients.filter(r =>
    r.clicked || r.replied || r.attachmentOpened || r.macroEnabled || r.dataEntered
  ).length;

  if (totalDelivered === 0) return 0;
  return ((totalFailed / totalDelivered) * 100).toFixed(1);
}
```

**Industry Benchmarks:**
| PPP Range | Rating | Context |
|-----------|--------|---------|
| 0-5% | Excellent | Well-trained organization |
| 5-15% | Good | Regular training in place |
| 15-30% | Average | Industry baseline for new programs |
| 30-50% | Poor | Needs immediate attention |
| 50%+ | Critical | High-risk organization |

## Field Reference

### Campaign Fields

| Field | Type | Description |
|-------|------|-------------|
| `campaign_id` | int | Unique campaign identifier |
| `name` | string | Campaign name |
| `status` | string | Current status (created, scheduled, in_progress, completed) |
| `create_date` | datetime | When campaign was created |
| `start_date` | datetime | Scheduled start date |
| `end_date` | datetime | Campaign end date |
| `duration_type` | string | How long the campaign runs (e.g., one_week, two_weeks) |
| `send_duration` | string | Email delivery spread period |
| `track_duration` | string | How long to track interactions after delivery |
| `frequency_type` | string | One-time, weekly, bi-weekly, monthly |
| `phishing_template_id` | int | Template used for the phishing email |
| `landing_page_id` | int | Landing page shown after click |
| `groups` | array | Target groups for the campaign |

### Phishing Security Test (PST) Fields

| Field | Type | Description |
|-------|------|-------------|
| `pst_id` | int | Unique security test identifier |
| `status` | string | Test status |
| `started_at` | datetime | When the test began |
| `category` | object | Template category info |
| `template` | object | Email template details |
| `landing_page` | object | Landing page details |
| `scheduled_count` | int | Recipients scheduled to receive |
| `delivered_count` | int | Emails successfully delivered |
| `opened_count` | int | Emails opened |
| `clicked_count` | int | Links clicked |
| `replied_count` | int | Replies sent |
| `attachment_open_count` | int | Attachments opened |
| `macro_enabled_count` | int | Macros enabled |
| `data_entered_count` | int | Data entered on landing page |
| `reported_count` | int | Reported via PAB |
| `bounced_count` | int | Emails bounced |

### Recipient Fields

| Field | Type | Description |
|-------|------|-------------|
| `recipient_id` | int | Unique recipient identifier |
| `pst_id` | int | Parent security test |
| `user` | object | User details (name, email, department) |
| `scheduled_at` | datetime | When email is scheduled |
| `delivered_at` | datetime | When email was delivered |
| `opened_at` | datetime | When email was opened |
| `clicked_at` | datetime | When link was clicked |
| `replied_at` | datetime | When reply was sent |
| `attachment_opened_at` | datetime | When attachment was opened |
| `macro_enabled_at` | datetime | When macro was enabled |
| `data_entered_at` | datetime | When data was entered |
| `reported_at` | datetime | When it was reported |
| `bounced_at` | datetime | When email bounced |
| `ip` | string | IP address of interaction |
| `browser` | string | Browser used for click |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `knowbe4_phishing_list_campaigns` | List all phishing campaigns | `status`, `page`, `per_page` |
| `knowbe4_phishing_get_campaign` | Get campaign details | `campaign_id` |
| `knowbe4_phishing_list_security_tests` | List security tests for a campaign | `campaign_id` |
| `knowbe4_phishing_get_security_test` | Get detailed security test results | `pst_id` |
| `knowbe4_phishing_list_recipients` | List recipients for a security test | `pst_id`, `page`, `per_page` |
| `knowbe4_phishing_get_recipient` | Get individual recipient details | `recipient_id` |
| `knowbe4_phishing_list_templates` | List available phishing templates | `category`, `page`, `per_page` |
| `knowbe4_phishing_get_template` | Get template details | `template_id` |

## Common Workflows

### Review Campaign Results

1. **List campaigns** to find the target campaign
2. **Get campaign details** for overview metrics
3. **List security tests** within the campaign
4. **Get security test results** for detailed interaction counts
5. **List recipients** to identify who clicked/failed
6. **Calculate PPP** from the results

### Identify High-Risk Users

1. **List completed campaigns** from a date range
2. **Get recipients** who clicked or entered data across campaigns
3. **Cross-reference** with user profiles for repeat offenders
4. **Generate report** of users who failed multiple tests

### Compare Campaign Performance Over Time

1. **List all campaigns** sorted by date
2. **Get PPP** for each campaign
3. **Track trend** -- PPP should decrease over time with training
4. **Identify anomalies** -- sudden PPP increase may indicate new attack vector or template difficulty

### Post-Campaign Remediation

1. **Get failed recipients** from completed campaign
2. **Enroll failed users** in remedial training
3. **Schedule follow-up test** targeting the same users
4. **Compare results** to measure improvement

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid campaign parameters | Check date formats and required fields |
| 401 | Invalid API token | Verify KNOWBE4_API_KEY |
| 403 | Insufficient permissions | API token needs Reporting permissions |
| 404 | Campaign not found | Verify campaign_id exists |
| 429 | Rate limit exceeded | Implement backoff (see api-patterns) |

### Data Considerations

| Issue | Cause | Resolution |
|-------|-------|------------|
| Zero delivered count | Campaign just started | Wait for delivery to complete |
| High bounce rate | Invalid email addresses | Clean user list before next campaign |
| No reported count | PAB not deployed | Install Phish Alert Button |
| Opened count higher than delivered | Email previews/security scanners | Filter by user agent if available |

## Best Practices

1. **Vary templates** -- Use different phishing scenarios to avoid pattern recognition
2. **Spread delivery** -- Send over days/weeks, not all at once, to avoid "water cooler effect"
3. **Track trends, not individual tests** -- Single campaigns can be noisy; look at 3-6 month trends
4. **Combine with training** -- Auto-enroll failed users in relevant training modules
5. **Use realistic scenarios** -- Match templates to actual threats your clients face
6. **Baseline first** -- Run an initial campaign before training to establish baseline PPP
7. **Report to leadership** -- Share PPP trends with management to justify security awareness investment
8. **Test all levels** -- Include executives and IT staff, not just general users
9. **Respect local regulations** -- Some regions have restrictions on simulated phishing
10. **Set proper tracking duration** -- Allow 72 hours minimum for accurate click data

## Related Skills

- [KnowBe4 Training](../training/SKILL.md) - Training campaign management and enrollment
- [KnowBe4 Users](../users/SKILL.md) - User management and risk scores
- [KnowBe4 Reporting](../reporting/SKILL.md) - Security awareness metrics and dashboards
- [KnowBe4 API Patterns](../api-patterns/SKILL.md) - Authentication, pagination, and rate limits
