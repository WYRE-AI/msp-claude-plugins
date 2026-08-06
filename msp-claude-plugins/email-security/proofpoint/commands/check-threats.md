---
description: View recent TAP threat events including blocked messages, delivered threats, and click activity
argument-hint: "[window] [type] [classification] [status]"
arguments: [window, type, classification, status]
---

# Check Recent Threats

View recent Proofpoint TAP threat events to monitor email security posture.

## Prerequisites

- Valid Proofpoint service principal and secret configured
- User must have TAP API access

## Steps

1. **Parse time window**
   - Convert window parameter to seconds
   - Validate window does not exceed 24 hours

2. **Fetch threat events**
   - Call `proofpoint_tap_get_all_threats` with `sinceSeconds`
   - Or call specific endpoints based on `status` filter

3. **Filter and aggregate results**
   - Apply type and classification filters
   - Group by classification and disposition
   - Calculate summary statistics

4. **Format and display**
   - Show summary counts
   - List individual threat events
   - Highlight delivered threats and permitted clicks

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| window | string | No | 1h | Time window (1h, 6h, 12h, 24h) |
| type | string | No | all | url/attachment/message/all |
| classification | string | No | - | malware/phish/impostor/spam |
| status | string | No | all | blocked/delivered/all |

## Examples

### Last Hour Summary

```
/check-threats
```

### Last 24 Hours Phishing

```
/check-threats --window 24h --classification phish
```

### Delivered Threats Only

```
/check-threats --window 6h --status delivered
```

### Attachment Threats

```
/check-threats --window 12h --type attachment
```

### Malware in Last Hour

```
/check-threats --window 1h --classification malware --status all
```

## Output

### Summary View

```
Proofpoint Threat Summary - Last 1 Hour

Threats Blocked:    47
Threats Delivered:   2  [!]
Clicks Blocked:      3
Clicks Permitted:    1  [!]

By Classification:
  Phishing:    28 blocked, 1 delivered
  Malware:     12 blocked, 0 delivered
  Spam:         5 blocked, 1 delivered
  Impostor:     2 blocked, 0 delivered

By Threat Type:
  URL:         31
  Attachment:  14
  Message:      4

ACTION REQUIRED: 2 threats delivered, 1 click permitted
```

### Delivered Threats Detail

```
DELIVERED THREATS (Requires Attention)

1. [PHISH] Invoice Payment Required
   Sender:    billing@spoofed-domain.com
   Recipient: cfo@acmecorp.com
   Time:      2024-02-15 09:23:00
   Threat:    Credential harvesting URL
   Score:     Phish: 92, Malware: 15
   Campaign:  TA505-Feb2024
   Action:    Consider search-and-destroy

2. [SPAM] Special Offer - Act Now
   Sender:    promo@bulk-sender.com
   Recipient: sales@acmecorp.com
   Time:      2024-02-15 09:45:00
   Threat:    Spam with tracking pixels
   Score:     Spam: 78, Phish: 12
   Action:    Low priority, monitor

PERMITTED CLICKS

1. [PHISH] cfo@acmecorp.com clicked on credential harvester
   Click Time: 2024-02-15 09:35:00
   URL:        https://fake-login.evil.com/office365
   Campaign:   TA505-Feb2024
   Action:     URGENT - Initiate password reset
```

### No Threats

```
Proofpoint Threat Summary - Last 1 Hour

No threats detected in the past hour.

All clear - email security posture is healthy.

Last threat detected: 2024-02-15 07:12:00 (2 hours ago)
```

## Error Handling

### Invalid Window

```
Error: Invalid time window "48h"

Maximum window is 24 hours (24h).
Valid formats: 1h, 6h, 12h, 24h, or seconds (e.g., 3600)
```

### No TAP Access

```
Error: TAP API access not available

Your Proofpoint license may not include TAP API access.
Contact your Proofpoint administrator or account manager.
```

### Rate Limiting

```
Rate limited by Proofpoint TAP API

Current usage: 998/1000 requests per hour
Retrying in 60 seconds...
```

## Related Commands

- `/investigate-threat` - Deep-dive into a specific threat
- `/search-quarantine` - Search quarantined messages
- `/vap-report` - View Very Attacked People
- `/decode-url` - Decode Proofpoint-rewritten URLs
