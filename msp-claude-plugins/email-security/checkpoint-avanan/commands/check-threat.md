---
description: Get detailed threat analysis including IOCs and timeline from Checkpoint Harmony Email
argument-hint: "<threat-id> [include-iocs] [include-timeline] [include-related]"
arguments: [threat-id, include-iocs, include-timeline, include-related]
---

# Check Threat Details

Get comprehensive threat analysis for a specific detection in Checkpoint Harmony Email & Collaboration (Avanan), including indicators of compromise, detection timeline, and related events.

## Prerequisites

- Valid Checkpoint Harmony API credentials configured (CHECKPOINT_CLIENT_ID, CHECKPOINT_CLIENT_SECRET)
- API key must have threat detection read permissions
- A valid threat ID (obtain from `/search-threats`)

## Steps

1. **Retrieve threat details**
   ```http
   GET /app/hec-api/v1.0/threats/<threat-id>
   Authorization: Bearer <token>
   ```

2. **Extract IOCs** (if --include-iocs)
   ```http
   GET /app/hec-api/v1.0/threats/<threat-id>/iocs
   Authorization: Bearer <token>
   ```

3. **Get timeline** (if --include-timeline)
   ```http
   GET /app/hec-api/v1.0/threats/<threat-id>/timeline
   Authorization: Bearer <token>
   ```

4. **Find related threats** (if --include-related)
   - Search for threats from same sender/domain
   - Link to quarantine entries

5. **Format comprehensive analysis report**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| threat-id | string | Yes | - | Threat ID to analyze |
| include-iocs | boolean | No | true | Include IOC extraction |
| include-timeline | boolean | No | true | Include event timeline |
| include-related | boolean | No | false | Include related threats |

## Examples

### Basic Threat Check

```
/check-threat thr-abc123
```

### Full Analysis with Related Threats

```
/check-threat thr-abc123 --include-related
```

### Quick Check Without Timeline

```
/check-threat thr-abc123 --include-timeline false
```

### IOC-Focused Analysis

```
/check-threat thr-abc123 --include-iocs --include-timeline false
```

## Output

### Phishing Threat Analysis

```
========================================================
THREAT ANALYSIS: thr-def456
========================================================

CLASSIFICATION
  Type:         Phishing (Credential Harvesting)
  Severity:     High
  Confidence:   88%
  Engine:       Anti-Phishing + URL Rewriting
  Status:       Quarantined

EMAIL DETAILS
  Subject:      Your DocuSign Document is Ready
  Sender:       noreply@d0cusign.net (DocuSign)
  Reply-To:     noreply@d0cusign.net
  Recipients:   john@company.com
  Direction:    Inbound
  Received:     2024-02-15 08:45:00 UTC

DETECTION INDICATORS
  - Sender domain typosquatting: d0cusign.net (similar to docusign.net)
  - Login page similarity: 94% match to DocuSign login
  - SPF: FAIL (d0cusign.net does not authorize sender IP)
  - DKIM: NONE (no DKIM signature)
  - DMARC: FAIL

INDICATORS OF COMPROMISE (IOCs)
  URLs:
    [MALICIOUS] https://d0cusign.net/sign/review?id=abc123
      - Verdict: Phishing page
      - Redirects to: https://185.234.xxx.xxx/harvest.php
      - SSL: Self-signed certificate
      - Page similarity: 94% DocuSign login

  Domains:
    - d0cusign.net (registered 2 days ago, registrar: NameCheap)
    - Hosting: 185.234.xxx.xxx (AS12345 - known bulletproof host)

  IP Addresses:
    - 185.234.xxx.xxx (origin server)
    - 91.123.xxx.xxx (email relay)

TIMELINE
  08:45:00 UTC  Email received by mail server
  08:45:02 UTC  Anti-spam scan: PASS
  08:45:03 UTC  Anti-phishing scan: DETECTED (88% confidence)
  08:45:03 UTC  URL analysis: d0cusign.net flagged as typosquat
  08:45:04 UTC  Page similarity check: 94% match to DocuSign
  08:45:05 UTC  Email quarantined
  08:45:06 UTC  Admin notification sent

QUARANTINE
  Entity ID:    qe-def456
  Status:       Quarantined
  Expires:      2024-03-16 08:45:00 UTC

RECOMMENDED ACTIONS
  1. Do NOT release this email - confirmed phishing
  2. Block domain d0cusign.net at email gateway
  3. Check if any users received similar emails
  4. Search for: /search-threats --sender "noreply@d0cusign.net"
========================================================
```

### BEC Threat Analysis

```
========================================================
THREAT ANALYSIS: thr-abc123
========================================================

CLASSIFICATION
  Type:         BEC (Business Email Compromise)
  Severity:     Critical
  Confidence:   92%
  Engine:       AI/ML Engine
  Status:       Detected

EMAIL DETAILS
  Subject:      Urgent: Wire Transfer Needed
  Sender:       ceo@c0mpany.com (John Smith)
  Reply-To:     reply@attacker-domain.com
  Recipients:   cfo@company.com
  Direction:    Inbound
  Received:     2024-02-15 09:23:00 UTC

DETECTION INDICATORS
  - Display name impersonation: "John Smith" matches CEO
  - Domain typosquatting: c0mpany.com (zero for 'o')
  - Reply-to mismatch: reply@attacker-domain.com
  - Financial request: wire transfer mentioned
  - Urgency language: "urgent", "immediately"
  - No prior email history from c0mpany.com

INDICATORS OF COMPROMISE (IOCs)
  Domains:
    - c0mpany.com (registered 1 day ago)
    - attacker-domain.com (registered 3 days ago)

  IP Addresses:
    - 203.0.xxx.xxx (email origin)

  Email Addresses:
    - ceo@c0mpany.com (impersonation)
    - reply@attacker-domain.com (reply collection)

TIMELINE
  09:23:00 UTC  Email received by mail server
  09:23:01 UTC  Anti-spam scan: PASS
  09:23:02 UTC  Anti-phishing scan: PASS (no URLs)
  09:23:03 UTC  AI/ML scan: BEC DETECTED (92% confidence)
  09:23:03 UTC  Display name match to internal executive
  09:23:04 UTC  Email quarantined
  09:23:05 UTC  Admin notification sent (critical severity)

RECOMMENDED ACTIONS
  1. Do NOT release this email - confirmed BEC
  2. Block domains: c0mpany.com, attacker-domain.com
  3. Alert the CFO that this email is fraudulent
  4. Check for similar attacks: /search-threats --type bec
  5. Consider creating an incident for investigation
========================================================
```

## Error Handling

### Threat Not Found

```
Error: Threat not found: thr-invalid123

The threat may have:
- Expired (past data retention period)
- Never existed (check the threat ID)

Use /search-threats to find the correct threat ID.
```

### Expired Data

```
Warning: IOC data partially unavailable for thr-old789

The threat was detected 85 days ago. Some detailed analysis
data may have been purged per the retention policy.

Available: Basic threat details, classification
Unavailable: Full IOC extraction, URL analysis details
```

### Permission Denied

```
Error: Insufficient permissions to view threat details

Your API key does not have threat detection read permissions.
Contact your Checkpoint administrator to update API key scopes.
```

### Rate Limiting

```
Rate limited by Checkpoint API

Retrying in 30 seconds...
```

## Related Commands

- `/search-threats` - Search for threats
- `/search-quarantine` - Find related quarantine entries
- `/release-quarantine` - Release false positives
- `/manage-policy` - Adjust detection policies
