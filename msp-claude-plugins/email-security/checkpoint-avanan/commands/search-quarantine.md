---
description: Search quarantined emails in Checkpoint Harmony Email by various criteria
argument-hint: "[query] [sender] [recipient] [reason] [severity] [start-date] [end-date] [status] [limit]"
arguments: [query, sender, recipient, reason, severity, start-date, end-date, status, limit]
---

# Search Quarantined Emails

Search and filter quarantined emails in Checkpoint Harmony Email & Collaboration (Avanan) using various criteria.

## Prerequisites

- Valid Checkpoint Harmony API credentials configured (CHECKPOINT_CLIENT_ID, CHECKPOINT_CLIENT_SECRET)
- API key must have quarantine read permissions

## Steps

1. **Build search filter**
   - Parse all provided arguments
   - Map text values to API filter codes (reason, severity, status)
   - Validate date range (max 90 days)

2. **Execute search query**
   ```http
   GET /app/hec-api/v1.0/quarantine?startDate=...&endDate=...&reason=...&limit=...
   Authorization: Bearer <token>
   ```

3. **Format and return results**
   - Display quarantine list with key details
   - Include quick actions for each entry

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search (sender, recipient, subject) |
| sender | string | No | - | Sender email address filter |
| recipient | string | No | - | Recipient email address filter |
| reason | string | No | - | phishing/malware/spam/dlp/bec/anomaly/policy/bulk |
| severity | string | No | - | critical/high/medium/low |
| start-date | string | No | 24h ago | ISO 8601 date |
| end-date | string | No | now | ISO 8601 date |
| status | string | No | quarantined | quarantined/released/deleted/all |
| limit | int | No | 25 | Max results (1-200) |

## Examples

### Search by Sender

```
/search-quarantine --sender "suspicious@external-domain.com"
```

### Search by Subject Text

```
/search-quarantine "invoice payment"
```

### Phishing Quarantine in Date Range

```
/search-quarantine --reason phishing --start-date "2024-02-01" --end-date "2024-02-15"
```

### Critical Severity Quarantine Items

```
/search-quarantine --severity critical --status quarantined
```

### Quarantine for Specific Recipient

```
/search-quarantine --recipient "cfo@company.com" --reason bec
```

## Output

```
Found 4 quarantined emails matching criteria

+--------------+-----------------------------------+--------------------------+----------+----------+------------+
| Entity ID    | Subject                           | Sender                   | Reason   | Severity | Date       |
+--------------+-----------------------------------+--------------------------+----------+----------+------------+
| qe-abc123    | Urgent: Wire Transfer Needed      | ceo@c0mpany.com          | BEC      | Critical | 2024-02-15 |
| qe-def456    | Your DocuSign Document            | noreply@d0cusign.net     | Phishing | High     | 2024-02-15 |
| qe-ghi789    | Invoice #4521 Attached            | billing@unknown-corp.com | Malware  | High     | 2024-02-14 |
| qe-jkl012    | Weekly Newsletter                 | news@marketing-blast.com | Spam     | Low      | 2024-02-14 |
+--------------+-----------------------------------+--------------------------+----------+----------+------------+

Quick Actions:
- Release email: /release-quarantine <entity-id>
- View threat: /check-threat <entity-id>
- Search related: /search-threats --sender <sender>
```

### Detailed View

```
/search-quarantine --sender "ceo@c0mpany.com" --detailed
```

```
Found 1 quarantined email

========================================================
qe-abc123 - Urgent: Wire Transfer Needed
========================================================
Sender:       ceo@c0mpany.com (CEO Name)
Recipients:   cfo@company.com
Reason:       BEC (Business Email Compromise)
Severity:     Critical
Confidence:   92%
Engine:       AI/ML Engine
Quarantined:  2024-02-15 09:23:00 UTC
Expires:      2024-03-16 09:23:00 UTC

Body Preview:
"Hi, I need you to process an urgent wire transfer
of $45,000 to the following account. This is time
sensitive and confidential..."

Indicators:
- Sender domain mismatch: c0mpany.com vs company.com
- Reply-to differs from sender
- Urgency language detected
- Financial request detected

Attachments: None
URLs: 0
========================================================
```

## Filter Reference

### Quarantine Reasons

| Text | API Code |
|------|----------|
| phishing | PHISHING |
| malware | MALWARE |
| spam | SPAM |
| dlp | DLP |
| bec | BEC |
| anomaly | ANOMALY |
| policy | POLICY |
| bulk | BULK |

### Severity Values

| Text | API Code |
|------|----------|
| critical | CRITICAL |
| high | HIGH |
| medium | MEDIUM |
| low | LOW |

### Status Values

| Text | Filter Behavior |
|------|-----------------|
| quarantined | Only items currently in quarantine |
| released | Only items that were released |
| deleted | Only items that were deleted |
| all | All quarantine entries regardless of status |

## Error Handling

### No Results

```
No quarantined emails found matching criteria

Suggestions:
- Broaden your search (remove filters)
- Check spelling of sender/recipient addresses
- Expand the date range
- Try --status all to include released/deleted items
```

### Invalid Date Range

```
Error: Date range exceeds 90-day maximum

Current range: 2024-01-01 to 2024-06-01 (152 days)
Maximum allowed: 90 days

Split your search into multiple 90-day windows.
```

### Rate Limiting

```
Rate limited by Checkpoint API

Retrying in 30 seconds...
(X-RateLimit-Remaining: 0, X-RateLimit-Reset: 1708012800)
```

## Related Commands

- `/release-quarantine` - Release email(s) from quarantine
- `/search-threats` - Search detected threats
- `/check-threat` - Get detailed threat analysis
