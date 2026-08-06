---
description: Search for specific threat patterns in Abnormal Security by sender, recipient, attack type, or keywords
argument-hint: "[query] [type] [sender] [recipient] [status] [start-date] [end-date] [limit]"
arguments: [query, type, sender, recipient, status, start-date, end-date, limit]
---

# Search Threats

Search and filter email threats detected by Abnormal Security using various criteria.

## Prerequisites

- Valid Abnormal Security API token configured (ABNORMAL_API_TOKEN)
- API token must have threat detection read permissions

## Steps

1. **Build search filter**
   - Parse all provided arguments
   - Construct OData filter expression
   - Validate date range

2. **Execute search query**
   ```http
   GET /v1/threats?filter=...&pageSize=...
   Authorization: Bearer <token>
   ```

3. **Format and return results**
   - Display threat list with key details
   - Include AI-generated insights for each threat

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search |
| type | string | No | - | bec/phishing/malware/extortion/scam/spam/supply-chain |
| sender | string | No | - | Sender email address or domain |
| recipient | string | No | - | Target recipient address |
| status | string | No | all | remediated/not-remediated/post-remediated/all |
| start-date | string | No | 7d ago | ISO 8601 date |
| end-date | string | No | now | ISO 8601 date |
| limit | int | No | 25 | Max results (1-100) |

## Examples

### Search by Attack Type

```
/search-threats --type bec
```

### Threats from a Specific Sender

```
/search-threats --sender "suspicious@attacker-domain.com"
```

### Threats Targeting Finance Team

```
/search-threats --recipient "finance@company.com"
```

### BEC Threats This Month

```
/search-threats --type bec --start-date "2026-03-01" --limit 50
```

### Search by Keyword

```
/search-threats --query "wire transfer"
```

### Supply Chain Threats

```
/search-threats --type supply-chain --start-date "2026-03-01"
```

## Output

```
Found 3 threats matching criteria (last 7 days)

+-----------+-----------+----------+---------------------+-----------------------------------+-------------------+-----------+
| Threat ID | Type      | Severity | Sender              | Subject                           | Received          | Status    |
+-----------+-----------+----------+---------------------+-----------------------------------+-------------------+-----------+
| 184def76  | BEC       | Critical | ceo@c0mpany.com     | Urgent: Wire Transfer Request     | 2026-03-27 09:15  | Not Remed |
| 29abc134  | BEC       | High     | cfo@c0mpany.com     | Confidential: Payment Update      | 2026-03-25 14:20  | Remediated|
| 3f4e5d6c  | BEC       | High     | hr@c0mpany.com      | Employee Direct Deposit Change    | 2026-03-23 11:05  | Remediated|
+-----------+-----------+----------+---------------------+-----------------------------------+-------------------+-----------+

Summary:
- Critical: 1 | High: 2
- Unremediated: 1 | Remediated: 2

AI Insights (threat 184def76):
- Display name matches internal CEO but email domain is typosquat
- Reply-to address differs from sender address
- Financial request with urgency language detected
- First-time sender from this domain

Quick Actions:
- View threat details: Use abnormal_threats_get with the threat UUID
- Triage all threats: /threat-triage
- Enumerate the threat's messages: Use abnormal_messages_list
```

## Filter Reference

### Attack Types

| Text | API Filter Value |
|------|-----------------|
| bec | BEC |
| phishing | Phishing: Credential |
| malware | Malware |
| extortion | Extortion |
| scam | Scam |
| spam | Spam |
| supply-chain | Supply Chain Compromise |

### Remediation Status

| Text | Filter Behavior |
|------|-----------------|
| remediated | Auto-Remediated |
| not-remediated | Not Remediated |
| post-remediated | Post-Remediated (delivered then removed) |
| all | All threats regardless of status |

## Error Handling

### No Results

```
No threats found matching criteria.

Suggestions:
- Broaden your search (remove type/sender filters)
- Expand the date range (default is last 7 days)
- Try --status all to include remediated threats
- Check spelling of sender/recipient addresses
```

### Rate Limiting

```
Rate limited by Abnormal Security API.

Retrying in 60 seconds...
```

## Related Commands

- `/threat-triage` - Triage recent threats by severity
- `/case-review` - Review abuse mailbox cases
