---
description: Trace an email through Mimecast by sender, recipient, subject, or date range
argument-hint: "[sender] [recipient] [subject] [start] [end] [status]"
arguments: [sender, recipient, subject, start, end, status]
---

# Mimecast Message Trace

Trace an email through Mimecast to determine its delivery status, delivery route, authentication results (SPF/DKIM/DMARC), and any threat detections. This is the primary diagnostic command for investigating reported phishing emails, missing messages, and delivery failures.

## Prerequisites

- Mimecast MCP server connected with valid credentials
- MCP tools `mimecast_find_message` and `mimecast_get_message_info` available

## Steps

1. **Search for the message**

   Call `mimecast_find_message` using the provided `sender`, `recipient`, `subject`, and date range parameters. If no date range is provided, default to the past 24 hours.

2. **Handle multiple results**

   If multiple messages match, list them in a table with: sender, recipient, subject, received time, and delivery status. Ask the user to confirm which message to investigate further.

3. **Retrieve full message details**

   Call `mimecast_get_message_info` with the Mimecast message ID from step 1.

4. **Analyze and report findings**

   Present a structured report covering:
   - Delivery status and route
   - Sender IP address
   - SPF, DKIM, DMARC authentication results
   - Spam score
   - Attachments (names and types)
   - Any threat detections

5. **Highlight security concerns**

   Flag any of the following as suspicious indicators:
   - `spf=fail`, `dkim=fail`, or `dmarc=fail`
   - Spam score above 5
   - Unexpected originating IP (different country from apparent sender)
   - Attachments with executable or macro-enabled extensions (.exe, .xlsm, .docm, .js, .vbs)

6. **Recommend next steps**

   Based on findings, suggest appropriate actions:
   - If delivered and malicious: use `/review-threats` to check TTP events and assess user exposure
   - If held: use `mimecast_release_message` if legitimate, or leave held if suspicious
   - If rejected/bounced: explain the rejection reason from the delivery route

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sender | string | No | — | Sender email or domain wildcard |
| recipient | string | No | — | Recipient email address |
| subject | string | No | — | Subject keyword |
| start | string | No | -24h | Start datetime (ISO 8601) |
| end | string | No | now | End datetime (ISO 8601) |
| status | string | No | all | Delivery status filter |

At least one of `sender`, `recipient`, or `subject` is required.

## Examples

### Trace by Sender and Recipient

```
/trace-message --sender "phishing@suspicious.com" --recipient "user@client.com"
```

### Trace by Subject Keyword

```
/trace-message --subject "invoice" --start "2026-03-01T00:00:00Z" --end "2026-03-01T23:59:59Z"
```

### Find All Held Messages for a User

```
/trace-message --recipient "user@client.com" --status held
```

### Sweep a Suspicious Domain

```
/trace-message --sender "*@suspicious-domain.com" --start "2026-02-01T00:00:00Z"
```

## Error Handling

- **No messages found:** Widen the date range or check the sender/recipient spelling; message may have been purged (retention is 30 days by default)
- **Multiple results:** Present a table and ask which message to investigate
- **Authentication errors:** Verify Mimecast credentials and region configuration

## Related Commands

- `/review-threats` - Check TTP threat logs for URL clicks and attachment detections
- `/check-queue` - Check delivery queue for stuck messages
