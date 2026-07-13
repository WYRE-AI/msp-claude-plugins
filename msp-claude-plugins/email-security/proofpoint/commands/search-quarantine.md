---
description: Search quarantined messages in Proofpoint by sender, recipient, subject, or reason
argument-hint: "[sender] [recipient] [subject] [reason] [start-date] [end-date] [limit]"
arguments: [sender, recipient, subject, reason, start-date, end-date, limit]
---

# Search Proofpoint Quarantine

Search for quarantined email messages in Proofpoint by various criteria.

## Prerequisites

- Valid Proofpoint service principal and secret configured
- User must have quarantine read permissions

## Steps

1. **Build search filters**
   - Parse all provided arguments
   - Validate date ranges if provided
   - Map reason text to API values

2. **Execute quarantine search**
   ```http
   GET /v2/quarantine/search?sender=<sender>&recipient=<recipient>&subject=<subject>&reason=<reason>
   Authorization: Basic <credentials>
   ```

3. **Format and return results**
   - Display quarantine list with key details
   - Include quick actions for each message

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sender | string | No | - | Sender email (exact or partial) |
| recipient | string | No | - | Recipient email address |
| subject | string | No | - | Subject substring match |
| reason | string | No | - | spam/phish/malware/impostor/policy |
| start-date | datetime | No | 24h ago | Start of date range |
| end-date | datetime | No | now | End of date range |
| limit | int | No | 25 | Max results (1-500) |

## Examples

### Search by Recipient

```
/search-quarantine --recipient "john@acmecorp.com"
```

### Search by Sender

```
/search-quarantine --sender "newsletter@vendor.com"
```

### Search for Phishing Messages

```
/search-quarantine --reason phish --limit 50
```

### Combined Filters

```
/search-quarantine --recipient "cfo@acmecorp.com" --reason impostor --start-date "2024-02-14T00:00:00Z"
```

### Search by Subject

```
/search-quarantine --subject "Invoice" --reason phish
```

## Output

```
Found 4 quarantined messages

+----+-------------------------+----------------------+------------------+----------+---------------------+
| #  | Subject                 | Sender               | Recipient        | Reason   | Date                |
+----+-------------------------+----------------------+------------------+----------+---------------------+
| 1  | Urgent Invoice #4521    | billing@spoof.com    | cfo@acmecorp.com | phish    | 2024-02-15 09:23:00 |
| 2  | Please review attached  | unknown@evil.net     | cfo@acmecorp.com | malware  | 2024-02-15 08:15:00 |
| 3  | Wire transfer request   | ceo-spoof@fake.com   | cfo@acmecorp.com | impostor | 2024-02-14 16:42:00 |
| 4  | Your account needs...   | security@phish.com   | cfo@acmecorp.com | phish    | 2024-02-14 14:10:00 |
+----+-------------------------+----------------------+------------------+----------+---------------------+

Quick Actions:
- Preview message: /preview-quarantine <id>
- Release message: /release-quarantine <id>
- Delete message: delete using proofpoint_quarantine_delete
```

## Error Handling

### No Results

```
No quarantined messages found matching criteria

Suggestions:
- Broaden your search (remove filters)
- Expand the date range
- Check spelling of sender/recipient addresses
- Try without the reason filter
```

### Invalid Date Range

```
Error: Invalid date range

Start date must be before end date.
Maximum search window is 30 days.
```

### Rate Limiting

```
Rate limited by Proofpoint API

Retrying in 60 seconds...
Current usage: 498/500 requests per hour
```

## Related Commands

- `/release-quarantine` - Release quarantined messages
- `/check-threats` - View recent TAP threats
- `/decode-url` - Decode Proofpoint-rewritten URLs
