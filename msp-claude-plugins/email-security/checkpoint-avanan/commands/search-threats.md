---
description: Search detected threats in Checkpoint Harmony Email by type, severity, and date range
argument-hint: "[query] [type] [severity] [status] [sender] [recipient] [start-date] [end-date] [limit]"
arguments: [query, type, severity, status, sender, recipient, start-date, end-date, limit]
---

# Search Threats

Search and filter detected email threats in Checkpoint Harmony Email & Collaboration (Avanan) using various criteria.

## Prerequisites

- Valid Checkpoint Harmony API credentials configured (CHECKPOINT_CLIENT_ID, CHECKPOINT_CLIENT_SECRET)
- API key must have threat detection read permissions

## Steps

1. **Build search filter**
   - Parse all provided arguments
   - Map text values to API codes (type, severity, status)
   - Validate date range (max 90 days)

2. **Execute search query**
   ```http
   GET /app/hec-api/v1.0/threats?startDate=...&endDate=...&type=...&severity=...&limit=...
   Authorization: Bearer <token>
   ```

3. **Format and return results**
   - Display threat list with key details
   - Include severity indicators and quick actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search |
| type | string | No | - | phishing/malware/bec/ato/ransomware/spam/dlp/zero-day |
| severity | string | No | - | critical/high/medium/low |
| status | string | No | detected | detected/quarantined/remediated/false-positive/all |
| sender | string | No | - | Sender email address |
| recipient | string | No | - | Target recipient address |
| start-date | string | No | 7d ago | ISO 8601 date |
| end-date | string | No | now | ISO 8601 date |
| limit | int | No | 25 | Max results (1-200) |

## Examples

### Search by Threat Type

```
/search-threats --type phishing
```

### Critical Threats in Last 24 Hours

```
/search-threats --severity critical --start-date "2024-02-14T00:00:00Z"
```

### BEC Threats Targeting Finance

```
/search-threats --type bec --recipient "finance@company.com"
```

### Threats from Specific Sender

```
/search-threats --sender "suspicious@attacker-domain.com"
```

### All Malware Threats This Month

```
/search-threats --type malware --start-date "2024-02-01" --status all --limit 100
```

## Output

```
Found 5 threats matching criteria (last 7 days)

+--------------+--------+-----------+----------+--------------------------+-----------------------------------+------------+
| Threat ID    | Type   | Severity  | Status   | Sender                   | Subject                           | Detected   |
+--------------+--------+-----------+----------+--------------------------+-----------------------------------+------------+
| thr-abc123   | BEC    | Critical  | Detected | ceo@c0mpany.com          | Urgent: Wire Transfer             | 2024-02-15 |
| thr-def456   | Phish  | High      | Quarant. | noreply@d0cusign.net     | Your DocuSign Document            | 2024-02-15 |
| thr-ghi789   | Malware| High      | Quarant. | billing@unknown-corp.com | Invoice #4521 Attached            | 2024-02-14 |
| thr-jkl012   | Phish  | Medium    | Remed.   | support@paypa1.com       | Verify Your Account               | 2024-02-13 |
| thr-mno345   | Spam   | Low       | Quarant. | deals@spam-sender.com    | Amazing Offer Just For You        | 2024-02-12 |
+--------------+--------+-----------+----------+--------------------------+-----------------------------------+------------+

Summary:
- Critical: 1 | High: 2 | Medium: 1 | Low: 1
- Types: BEC (1), Phishing (2), Malware (1), Spam (1)

Quick Actions:
- View threat details: /check-threat <threat-id>
- Search quarantine: /search-quarantine --sender <sender>
```

### Detailed View

```
/search-threats --type bec --detailed
```

```
Found 1 BEC threat

========================================================
thr-abc123 - Business Email Compromise
========================================================
Type:         BEC (Business Email Compromise)
Severity:     Critical
Confidence:   92%
Status:       Detected
Engine:       AI/ML Engine

Sender:       ceo@c0mpany.com (John CEO)
Recipients:   cfo@company.com (1 user)
Direction:    INBOUND
Detected:     2024-02-15 09:23:00 UTC

Subject:      Urgent: Wire Transfer Needed

Indicators:
- Display name impersonation: "John CEO" (matches real CEO)
- Domain typosquatting: c0mpany.com (zero instead of 'o')
- Reply-to mismatch: reply@attacker-domain.com
- Financial request language detected
- Urgency language detected

IOCs:
- Domain: c0mpany.com
- Reply-to: reply@attacker-domain.com
- IP: 185.234.xxx.xxx

Related:
- Quarantine: qe-abc123
========================================================
```

## Filter Reference

### Threat Types

| Text | API Code |
|------|----------|
| phishing | PHISHING |
| malware | MALWARE |
| bec | BEC |
| ato | ATO |
| ransomware | RANSOMWARE |
| spam | SPAM |
| dlp | DLP |
| zero-day | ZERO_DAY |

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
| detected | Only newly detected, unprocessed threats |
| quarantined | Threats that resulted in quarantine |
| remediated | Threats that have been fully remediated |
| false-positive | Threats marked as false positives |
| all | All threats regardless of status |

## Error Handling

### No Results

```
No threats found matching criteria

Suggestions:
- Broaden your search (remove type/severity filters)
- Expand the date range (default is last 7 days)
- Try --status all to include remediated/false-positive threats
- Check spelling of sender/recipient addresses
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
```

## Related Commands

- `/check-threat` - Get detailed threat analysis with IOCs
- `/search-quarantine` - Search quarantined emails
- `/release-quarantine` - Release false positives from quarantine
- `/manage-policy` - View or adjust detection policies
