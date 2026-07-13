---
name: "Proofpoint URL Defense"
description: >
  Use this skill when working with Proofpoint URL Defense - URL rewriting, URL
  decoding, real-time URL analysis, click-time protection, and URL investigation.
  Covers how Proofpoint rewrites URLs, how to decode rewritten URLs back to originals,
  and how click-time analysis works to protect users.
when_to_use: >-
  When working with URL rewriting, URL decoding, real-time URL analysis, click-time protection,
  and URL investigation in Proofpoint URL Defense. Use when: proofpoint url defense, url rewrite,
  proofpoint url, decode proofpoint url, url defense, click-time protection, proofpoint rewritten
  url, urldefense.proofpoint.com, url analysis, proofpoint link, rewritten link, or proofpoint
  decode.
---

# Proofpoint URL Defense

## Overview

Proofpoint URL Defense rewrites URLs in email messages to route clicks through Proofpoint's analysis infrastructure. When a user clicks a rewritten URL, Proofpoint performs real-time analysis of the destination before allowing or blocking access. This provides click-time protection - even if a URL was clean when the email was delivered, it will be analyzed again at the moment the user clicks.

URL Defense is a critical layer of protection because many attacks use time-delayed weaponization: a URL is clean when the email is sent but becomes malicious hours or days later.

## Key Concepts

### URL Rewriting

Proofpoint rewrites URLs in email bodies and HTML attachments. The rewritten URL format is:

```
https://urldefense.proofpoint.com/v2/url?u=<encoded_original_url>&d=<domain_key>&c=<context>&r=<recipient_hash>&m=<message_hash>&s=<signature>&e=
```

**Version 3 format:**
```
https://urldefense.com/v3/__<encoded_url>__;!!<encoded_chars>!<signature>$
```

### URL Rewrite Components

| Component | Description |
|-----------|-------------|
| `u` | URL-encoded original URL (v2) |
| `d` | Domain key for the organization |
| `c` | Context identifier |
| `r` | Recipient hash |
| `m` | Message hash |
| `s` | HMAC signature for integrity |
| `e` | Empty (reserved) |

### Click-Time Analysis

When a user clicks a rewritten URL, Proofpoint performs:

1. **URL reputation check** - Is this URL on known blocklists?
2. **Real-time sandbox** - Load the page in a sandbox and check for malicious content
3. **Redirect chain following** - Follow all redirects to the final destination
4. **Content analysis** - Check for credential harvesting forms, drive-by downloads
5. **Verdict delivery** - Allow, warn, or block based on analysis

### Click-Time Verdicts

| Verdict | User Experience | Description |
|---------|-----------------|-------------|
| `allow` | User proceeds to destination | URL is clean |
| `warn` | Warning interstitial page | URL is suspicious but not confirmed malicious |
| `block` | Block page shown | URL is confirmed malicious |
| `isolate` | Opened in browser isolation | URL is risky, opened in safe container |

### URL Encoding in v2

In the v2 rewrite format, the original URL is encoded:
- `-` replaces `/`
- `_` replaces `=`
- Standard URL encoding for other special characters

### URL Encoding in v3

In the v3 format, the original URL uses a different encoding:
- `__` delimiters surround the encoded URL
- Special characters are encoded in the trailing `!!` section
- The `$` terminates the URL

## Field Reference

### URL Analysis Fields

| Field | Type | Description |
|-------|------|-------------|
| `originalUrl` | string | The original URL before rewriting |
| `rewrittenUrl` | string | The Proofpoint-rewritten URL |
| `verdict` | string | `allow`, `warn`, `block`, `isolate` |
| `threatId` | string | Threat ID if URL is malicious |
| `classification` | string | `malware`, `phish`, `spam`, `clean` |
| `firstSeen` | datetime | When the URL was first observed |
| `lastSeen` | datetime | Most recent observation |
| `clickCount` | int | Number of clicks on this URL |
| `blockCount` | int | Number of times clicks were blocked |
| `redirectChain` | string[] | Full redirect chain to final URL |
| `finalUrl` | string | Final destination after redirects |
| `certificate` | object | SSL certificate details of the destination |

### Decoded URL Fields

| Field | Type | Description |
|-------|------|-------------|
| `encodedUrl` | string | The Proofpoint-rewritten URL provided |
| `decodedUrl` | string | The original URL extracted |
| `version` | string | Rewrite version (`v2` or `v3`) |
| `valid` | boolean | Whether the URL is a valid Proofpoint rewrite |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_url_decode` | Decode a Proofpoint-rewritten URL | `url` |
| `proofpoint_url_analyze` | Analyze a URL for threats | `url` |
| `proofpoint_url_get_clicks` | Get click activity for a URL | `url`, `sinceSeconds` |
| `proofpoint_url_get_verdict` | Get the current verdict for a URL | `url` |
| `proofpoint_url_batch_decode` | Decode multiple URLs at once | `urls[]` |

## Common Workflows

### Decode a Rewritten URL

1. User or analyst provides a Proofpoint-rewritten URL
2. Call `proofpoint_url_decode` with the full rewritten URL
3. Return the original decoded URL
4. Optionally call `proofpoint_url_analyze` to check the URL's current threat status

### Investigate a Suspicious URL

1. Call `proofpoint_url_analyze` with the URL
2. Review the verdict, classification, and redirect chain
3. If malicious, call `proofpoint_url_get_clicks` to see who clicked
4. Cross-reference with TAP click events for full context
5. If the URL is being used in an active campaign, escalate to threat intelligence

### Bulk URL Decoding

1. Extract all Proofpoint-rewritten URLs from an email or document
2. Call `proofpoint_url_batch_decode` with the array of URLs
3. Review the decoded URLs for any suspicious destinations
4. Check each decoded URL against threat intelligence

### Click Activity Investigation

1. Identify a suspicious URL from TAP events or quarantine
2. Call `proofpoint_url_get_clicks` with the URL
3. Review which users clicked and when
4. Check whether clicks were permitted or blocked
5. For permitted clicks, assess whether credentials may be compromised
6. Initiate password resets for users who clicked on credential harvesting URLs

### URL Verdict Monitoring

1. Call `proofpoint_url_get_verdict` for a URL that was previously clean
2. Check if the verdict has changed (URLs can become malicious after delivery)
3. If the verdict changed to `block`, check if any users received emails containing the URL
4. If users received the URL before it was blocked, initiate search-and-destroy

## URL Decoding Reference

### Manual v2 Decoding

To manually decode a v2 Proofpoint URL:

1. Extract the `u=` parameter value
2. Replace `-` with `/`
3. Replace `_` with `=`
4. URL-decode the result

```
Input:  https://urldefense.proofpoint.com/v2/url?u=https-3A__example.com_path-3Fparam-3Dvalue&d=...
Step 1: https-3A__example.com_path-3Fparam-3Dvalue
Step 2: https-3A//example.com/path-3Fparam-3Dvalue
Step 3: https-3A//example.com/path-3Fparam=value
Step 4: https://example.com/path?param=value
```

### Manual v3 Decoding

To manually decode a v3 Proofpoint URL:

1. Extract the content between `__` delimiters
2. Decode special characters from the `!!` section
3. Replace encoded characters in the URL

```
Input:  https://urldefense.com/v3/__https://example.com/path__;!!ABC123!def$
Output: https://example.com/path
```

**Note:** Always use the `proofpoint_url_decode` tool rather than manual decoding to ensure accuracy.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid URL format | Ensure the URL is a valid Proofpoint-rewritten URL |
| 400 | Unsupported URL version | Only v2 and v3 formats are supported |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | URL Defense API not enabled | Ensure your license includes URL Defense API |
| 404 | URL not found | The URL may not have been processed by Proofpoint |
| 429 | Rate limit exceeded | Implement backoff |

### Decoding Failures

| Issue | Cause | Resolution |
|-------|-------|------------|
| Invalid signature | URL was modified after rewriting | The URL may have been truncated or altered |
| Unknown version | URL does not match v2 or v3 format | It may not be a Proofpoint URL |
| Expired URL | URL is older than the retention period | Original URL cannot be recovered from the API |

## Best Practices

1. **Always use the API to decode** - Manual decoding is error-prone; use `proofpoint_url_decode`
2. **Check verdicts at click time** - A URL clean at delivery may be malicious when clicked
3. **Monitor click activity** - Track which users are clicking rewritten URLs
4. **Train users on rewritten URLs** - Users should recognize Proofpoint-rewritten URLs as a security feature
5. **Don't bypass URL Defense** - Never instruct users to work around URL rewriting
6. **Use browser isolation for risky clicks** - Configure isolation for suspicious-but-not-confirmed URLs
7. **Audit redirect chains** - Multi-hop redirects are a common evasion technique
8. **Batch decode for efficiency** - When processing multiple URLs, use `proofpoint_url_batch_decode`
9. **Retain decoded URLs** - Log the original URLs for threat intelligence and IOC tracking
10. **Combine with TAP data** - Cross-reference URL analysis with TAP events for full visibility

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - Click tracking and threat events
- [Proofpoint Quarantine](../quarantine/SKILL.md) - Messages quarantined for malicious URLs
- [Proofpoint Forensics](../forensics/SKILL.md) - Deep URL investigation
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
