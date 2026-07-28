# Ironscales Incident Tools — Full API Reference

Complete parameter lists and request/response examples for the incident,
classification, remediation, statistics, and allowlist tools.

## List Incidents

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

## Get Incident Details

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

## Classify Email

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

## Remediate Incident

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

## Get Company Statistics

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

## Manage Allowlist

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
