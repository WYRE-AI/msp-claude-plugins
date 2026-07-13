---
name: "IRONSCALES Incidents"
description: >
  Use this skill when working with Ironscales phishing incidents — listing and
  triaging incidents, classifying emails as phishing/spam/legitimate, taking
  remediation actions, managing sender allowlists, and viewing company statistics.
when_to_use: >-
  When listing and triaging incidents, classifying emails as phishing/spam/legitimate, taking
  remediation actions, managing sender allowlists, and viewing company statistics. Use when:
  ironscales incident, phishing incident, ironscales remediation, classify email ironscales,
  ironscales phishing, ironscales allowlist, ironscales triage, ironscales spam, ironscales
  legitimate, or ironscales dashboard.
---

# Ironscales Phishing Incidents

## Overview

Ironscales combines AI-powered threat detection with crowdsourced employee phishing reports to identify and remediate phishing attacks. When a user reports a suspicious email (via the Ironscales Outlook add-in or Gmail extension) or Ironscales AI auto-detects a threat, an incident is created. Security administrators triage these incidents, classify each email, and take remediation actions. Ironscales uses federated learning — decisions made on one tenant inform the global threat model, improving detection over time.

## Key Concepts

### Incident Sources

| Source | Description |
|--------|-------------|
| `USER_REPORT` | Employee used the Ironscales add-in to report a suspicious email |
| `AI_DETECTION` | Ironscales AI automatically flagged the email without a user report |

### Incident Status

| Status | Description |
|--------|-------------|
| `open` | Newly reported, awaiting review |
| `in_progress` | Under active investigation |
| `resolved` | Classification applied and remediation complete |
| `closed` | Incident closed (may be false positive or resolved) |

### Email Classifications

| Classification | Description |
|----------------|-------------|
| `phishing` | Confirmed phishing email — malicious intent, credential harvesting, or fraud |
| `spam` | Unwanted bulk email — not targeted/malicious, but should be blocked |
| `legitimate` | Safe email — false positive report from user |

Once classified, Ironscales can take automatic remediation actions based on the classification:
- **Phishing** → Remove from all mailboxes, block sender, update threat intelligence
- **Spam** → Block sender, optionally remove from mailboxes
- **Legitimate** → Close incident, optionally add sender to allowlist

### Remediation Actions

| Action | Description |
|--------|-------------|
| `remove_emails` | Remove the email from all affected mailboxes |
| `block_sender` | Block the sender email address globally |
| `block_domain` | Block the entire sender domain |
| `allowlist_sender` | Add sender to allowlist (for false positives) |

## API Patterns

### List Incidents

```
ironscales_list_incidents
```

Parameters:
- `status` — Filter by status: `open`, `in_progress`, `resolved`, `closed`
- `source` — Filter by source: `USER_REPORT` or `AI_DETECTION`
- `offset` — Pagination offset (default: 0)
- `limit` — Records per page (default: 50, max: 100)

**Example — List open incidents:**

```json
{
  "status": "open",
  "limit": 50,
  "offset": 0
}
```

**Example response:**

```json
{
  "incidents": [
    {
      "id": "INC-10042",
      "status": "open",
      "source": "USER_REPORT",
      "reportedBy": "user@client.com",
      "reportedAt": "2026-03-02T08:30:00Z",
      "subject": "Your invoice is ready",
      "senderEmail": "billing@suspicious-domain.net",
      "senderName": "Billing Department",
      "recipientCount": 5,
      "classification": null,
      "aiVerdict": "phishing",
      "aiConfidence": 0.94
    },
    {
      "id": "INC-10041",
      "status": "open",
      "source": "AI_DETECTION",
      "reportedBy": null,
      "reportedAt": "2026-03-02T07:15:00Z",
      "subject": "Urgent: Verify your account",
      "senderEmail": "security@paypa1.com",
      "senderName": "PayPal Security",
      "recipientCount": 12,
      "classification": null,
      "aiVerdict": "phishing",
      "aiConfidence": 0.98
    }
  ],
  "total": 2,
  "offset": 0,
  "limit": 50
}
```

Key fields:
- `aiVerdict` — Ironscales AI's pre-classified verdict (not yet confirmed by admin)
- `aiConfidence` — Confidence score (0–1); above 0.9 is high confidence
- `classification` — null until an admin explicitly classifies the incident
- `recipientCount` — Number of mailboxes that received this email

### Get Incident Details

```
ironscales_get_incident
```

Parameters:
- `incidentId` — The incident ID

**Example response:**

```json
{
  "id": "INC-10042",
  "status": "open",
  "source": "USER_REPORT",
  "reportedBy": "user@client.com",
  "reportedAt": "2026-03-02T08:30:00Z",
  "subject": "Your invoice is ready",
  "senderEmail": "billing@suspicious-domain.net",
  "senderName": "Billing Department",
  "senderIp": "203.0.113.55",
  "replyTo": "payments@attacker.com",
  "recipients": [
    "user@client.com",
    "accountspayable@client.com",
    "cfo@client.com",
    "finance1@client.com",
    "finance2@client.com"
  ],
  "classification": null,
  "aiVerdict": "phishing",
  "aiConfidence": 0.94,
  "indicators": [
    {
      "type": "SUSPICIOUS_DOMAIN",
      "value": "suspicious-domain.net",
      "description": "Domain registered 3 days ago"
    },
    {
      "type": "REPLY_TO_MISMATCH",
      "value": "payments@attacker.com",
      "description": "Reply-to address differs from sender domain"
    },
    {
      "type": "FINANCIAL_REQUEST",
      "description": "Email body contains payment request language"
    }
  ],
  "links": [
    {
      "url": "https://suspicious-domain.net/invoice",
      "verdict": "malicious",
      "category": "phishing"
    }
  ],
  "attachments": [],
  "remediationStatus": null
}
```

### Classify Email

```
ironscales_classify_email
```

Applies a classification to an incident's email. This is the core administrative action that resolves incidents.

Parameters:
- `incidentId` — The incident ID to classify
- `classification` — Classification: `phishing`, `spam`, or `legitimate`
- `comment` — Optional comment for audit trail

**Example — Classify as phishing:**

```json
{
  "incidentId": "INC-10042",
  "classification": "phishing",
  "comment": "Confirmed phishing — lookalike billing domain with malicious link"
}
```

**Example response:**

```json
{
  "incidentId": "INC-10042",
  "classification": "phishing",
  "classifiedAt": "2026-03-02T09:00:00Z",
  "classifiedBy": "admin@msp.com",
  "status": "resolved",
  "remediationTriggered": true,
  "remediationActions": ["remove_emails", "block_sender"]
}
```

### Remediate Incident

```
ironscales_remediate_incident
```

Takes a specific remediation action on a confirmed incident. Classification may trigger automatic remediation, but this tool allows manual or additional actions.

Parameters:
- `incidentId` — The incident ID
- `action` — Remediation action: `remove_emails`, `block_sender`, `block_domain`, `allowlist_sender`
- `comment` — Optional comment for audit trail

**Example — Remove phishing emails from all mailboxes:**

```json
{
  "incidentId": "INC-10042",
  "action": "remove_emails",
  "comment": "Removing phishing emails from finance team mailboxes"
}
```

**Example response:**

```json
{
  "incidentId": "INC-10042",
  "action": "remove_emails",
  "status": "success",
  "affectedMailboxes": 5,
  "completedAt": "2026-03-02T09:02:00Z"
}
```

### Get Company Statistics

```
ironscales_get_company_stats
```

Returns company-wide phishing statistics and dashboard metrics.

Parameters:
- `period` — Time period: `7d`, `30d`, `90d` (default: `30d`)

**Example response:**

```json
{
  "period": "30d",
  "companyId": "company-abc123",
  "summary": {
    "totalIncidents": 87,
    "phishingConfirmed": 34,
    "spamConfirmed": 18,
    "falsePositives": 35,
    "remediatedIncidents": 52,
    "averageTimeToResolve": 42
  },
  "topAttackTypes": [
    { "type": "credential_phishing", "count": 22 },
    { "type": "bec_impersonation", "count": 8 },
    { "type": "malware_delivery", "count": 4 }
  ],
  "topTargetedUsers": [
    { "email": "cfo@client.com", "incidentCount": 7 },
    { "email": "accountspayable@client.com", "incidentCount": 5 }
  ],
  "userReportRate": 0.68
}
```

Key metrics:
- `averageTimeToResolve` — Mean time to classification in minutes
- `userReportRate` — Percentage of phishing incidents caught by user reports vs. AI alone
- `topTargetedUsers` — Users who receive the most phishing attempts (high-value targets)

### Manage Allowlist

```
ironscales_manage_allowlist
```

Add or remove senders from the company allowlist to prevent false positive incidents.

Parameters:
- `action` — `add`, `remove`, or `list`
- `senderEmail` — Sender email address (required for `add`/`remove`)
- `senderDomain` — Sender domain to allowlist (optional, allowlists all senders from this domain)
- `comment` — Reason for allowlisting (recommended for audit trail)

**Example — Allowlist a sender:**

```json
{
  "action": "add",
  "senderEmail": "newsletter@trusted-vendor.com",
  "comment": "Legitimate marketing newsletter — added per CFO request"
}
```

**Example — List current allowlist:**

```json
{
  "action": "list"
}
```

**Example list response:**

```json
{
  "allowlist": [
    {
      "id": "allow-001",
      "senderEmail": "newsletter@trusted-vendor.com",
      "senderDomain": null,
      "addedAt": "2026-03-02T09:15:00Z",
      "addedBy": "admin@msp.com",
      "comment": "Legitimate marketing newsletter — added per CFO request"
    }
  ],
  "total": 1
}
```

## Common Workflows

### Daily Incident Triage

1. Call `ironscales_list_incidents` with `status=open`
2. Sort incidents by `aiConfidence` descending — high-confidence AI detections first
3. For each incident:
   - Review `subject`, `senderEmail`, and `aiVerdict`
   - For high-confidence phishing (`aiConfidence > 0.9`), call `ironscales_classify_email` with `phishing`
   - For ambiguous cases, call `ironscales_get_incident` to review full indicators before classifying
4. For incidents where classification is spam or legitimate, classify accordingly
5. Review `remediationTriggered` — verify automatic remediation fired for phishing classifications

### Investigate Before Classification

1. Call `ironscales_get_incident` with the incident ID
2. Review `indicators` array — each indicator explains why AI flagged this email
3. Check `links` — malicious URL verdict is a strong phishing signal
4. Review `replyTo` vs. `senderEmail` — mismatches are a common BEC/phishing indicator
5. Check `senderIp` against known threat intelligence sources if available
6. Based on findings, call `ironscales_classify_email` with the appropriate classification

### Process False Positive Reports

1. Call `ironscales_list_incidents` with `status=open` and `source=USER_REPORT`
2. For each incident where `aiVerdict=legitimate` or `aiConfidence < 0.5`:
   - The user likely reported a safe email
   - Call `ironscales_classify_email` with `legitimate`
3. After classifying as legitimate, consider adding the sender to the allowlist with `ironscales_manage_allowlist` (action=add)
4. Respond to the reporting user confirming the email is safe

### Block a Phishing Campaign

1. Identify a phishing campaign — multiple incidents from the same domain or with the same URL pattern
2. Classify each incident as `phishing` using `ironscales_classify_email`
3. For the first incident, use `ironscales_remediate_incident` with `action=block_domain` to block the entire sending domain
4. Verify `remediationStatus` confirms the block is active
5. Check `ironscales_get_company_stats` for the period to quantify campaign scope

### Weekly Statistics Review

1. Call `ironscales_get_company_stats` with `period=7d`
2. Review `topTargetedUsers` — these users need additional security awareness training
3. Check `userReportRate` — below 50% indicates users are not using the Ironscales add-in frequently
4. Review `topAttackTypes` — trending attack types inform security awareness focus areas
5. Compare `phishingConfirmed` vs. `falsePositives` — a high false positive rate indicates overly aggressive AI tuning or user education needed

## Error Handling

### Classification Fails — Incident Already Closed

**Cause:** The incident status is `closed` or `resolved` — only open/in-progress incidents can be classified.
**Solution:** Use `ironscales_list_incidents` to verify incident status before classifying.

### Remediation Reports Partial Success

**Cause:** Some mailboxes may be offline, the email may have been deleted by the user, or Exchange/M365 integration permissions may be incomplete.
**Solution:** Verify the Ironscales M365 integration in the platform. For remaining mailboxes, manually delete the email.

### Allowlist Not Preventing New Incidents

**Cause:** An allowlist entry for a sender email does not block incidents from the same domain via different addresses.
**Solution:** Use `senderDomain` in the allowlist entry to allowlist the entire domain instead of a single address.

### Low AI Confidence Score with Phishing Indicators

**Cause:** Ironscales AI scores based on multiple factors; a legitimate-looking sender or domain may reduce confidence even if individual indicators are strong.
**Solution:** Review `indicators` manually — a REPLY_TO_MISMATCH combined with a SUSPICIOUS_DOMAIN is a strong phishing signal regardless of AI confidence score.

## Best Practices

- Triage all open incidents at least once per business day — user-reported incidents reflect real user exposure
- Trust high-confidence AI verdicts (`aiConfidence > 0.9`) and classify quickly to keep queue clear
- Always investigate incidents with `recipientCount > 10` — these are broad campaigns affecting many users
- Use `block_domain` sparingly — block entire domains only when you are confident all mail from that domain is malicious
- Build the allowlist proactively — common internal notification senders, HR systems, and monitoring tools should be added to prevent recurring false positives
- Review `topTargetedUsers` monthly and ensure those users have MFA enabled and recent security awareness training
- Track `averageTimeToResolve` — reducing this metric minimizes user exposure window

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error codes
