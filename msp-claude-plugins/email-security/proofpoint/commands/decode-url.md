---
description: Decode a Proofpoint URL Defense rewritten URL back to the original URL
argument-hint: "<url> [analyze]"
arguments: [url, analyze]
---

# Decode Proofpoint URL

Decode a Proofpoint URL Defense rewritten URL back to the original destination URL. Optionally analyze the decoded URL for current threat status.

## Prerequisites

- Valid Proofpoint service principal and secret configured
- URL must be a valid Proofpoint-rewritten URL (v2 or v3 format)

## Steps

1. **Validate URL format**
   - Check if URL matches Proofpoint v2 or v3 rewrite format
   - v2: `https://urldefense.proofpoint.com/v2/url?u=...`
   - v3: `https://urldefense.com/v3/__...__`

2. **Decode the URL**
   - Call `proofpoint_url_decode` with the rewritten URL
   - Extract the original destination URL

3. **Optionally analyze**
   - If `--analyze` is set, call `proofpoint_url_analyze`
   - Check current threat verdict
   - Show redirect chain if applicable

4. **Return results**
   - Display the decoded original URL
   - Show analysis results if requested

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| url | string | Yes | - | Proofpoint-rewritten URL |
| analyze | boolean | No | false | Analyze for threats |

## Examples

### Basic Decode (v2)

```
/decode-url "https://urldefense.proofpoint.com/v2/url?u=https-3A__www.example.com_document&d=DwMFaQ&c=abc123&r=def456&m=ghi789&s=jkl012&e="
```

### Basic Decode (v3)

```
/decode-url "https://urldefense.com/v3/__https://www.example.com/document__;!!ABC123!def$"
```

### Decode with Analysis

```
/decode-url "https://urldefense.proofpoint.com/v2/url?u=https-3A__suspicious-2Dsite.com_login&d=DwMFaQ&c=abc&r=def&m=ghi&s=jkl&e=" --analyze
```

### Decode from Email Body

```
# Copy the full rewritten URL from an email and paste it
/decode-url "https://urldefense.com/v3/__https://partner-portal.vendor.com/shared/report.pdf__;!!XYZ!abc$"
```

### Batch Decode (Multiple URLs)

```
# For multiple URLs, decode each one separately
/decode-url "https://urldefense.proofpoint.com/v2/url?u=https-3A__link1.com&d=X&c=X&r=X&m=X&s=X&e="
/decode-url "https://urldefense.proofpoint.com/v2/url?u=https-3A__link2.com&d=X&c=X&r=X&m=X&s=X&e="
```

## Output

### Simple Decode

```
URL Decoded Successfully

Rewritten URL:  https://urldefense.proofpoint.com/v2/url?u=https-3A__www.example.com_document...
Original URL:   https://www.example.com/document
Version:        v2
```

### Decode with Analysis

```
URL Decoded and Analyzed

Rewritten URL:  https://urldefense.proofpoint.com/v2/url?u=https-3A__suspicious-2Dsite.com_login...
Original URL:   https://suspicious-site.com/login

THREAT ANALYSIS
  Verdict:        BLOCK
  Classification: Phishing
  Confidence:     92/100
  First Seen:     2024-02-14 22:15:00
  Threat ID:      abc123def456

  Redirect Chain:
    1. https://suspicious-site.com/login
    2. https://redir.evil.net/r?id=xyz
    3. https://192.168.100.50/harvest.php (Final)

  WARNING: This URL leads to a credential harvesting page.
  Do NOT visit this URL or enter any credentials.

  Campaign: TA505-Feb2024-Office365
  Action:   Investigate with /investigate-threat --threat-id "abc123def456"
```

### Clean URL

```
URL Decoded and Analyzed

Rewritten URL:  https://urldefense.com/v3/__https://partner-portal.vendor.com/shared/report.pdf__...
Original URL:   https://partner-portal.vendor.com/shared/report.pdf

THREAT ANALYSIS
  Verdict:        ALLOW
  Classification: Clean
  First Seen:     2024-01-15 08:00:00
  Click Count:    47 (all permitted)

  This URL appears to be safe.
```

## Error Handling

### Not a Proofpoint URL

```
Error: Not a Proofpoint URL Defense URL

The provided URL does not match Proofpoint v2 or v3 rewrite format.

Expected formats:
  v2: https://urldefense.proofpoint.com/v2/url?u=...
  v3: https://urldefense.com/v3/__...__

Make sure you copied the complete URL including all parameters.
```

### Truncated URL

```
Error: URL appears to be truncated

The URL is missing required parameters (signature, context).
This usually happens when the URL is truncated during copy/paste.

Tips:
- Copy the entire URL, including the trailing parameters
- Check for line breaks that may have split the URL
- In some email clients, right-click the link and choose "Copy Link Address"
```

### Decode Failed

```
Error: Unable to decode URL

The URL signature could not be verified.
Possible causes:
- URL was modified after rewriting
- URL parameters were corrupted
- URL format is not supported

Try copying the URL again from the original email.
```

### Analysis Unavailable

```
URL Decoded Successfully

Original URL: https://www.example.com/document

Note: Threat analysis is not available for this URL.
The URL may not have been processed by Proofpoint's analysis engine.
```

## Related Commands

- `/check-threats` - View recent TAP threats
- `/investigate-threat` - Deep-dive threat investigation
- `/search-quarantine` - Search quarantined messages
