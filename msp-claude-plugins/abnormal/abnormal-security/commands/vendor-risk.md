---
description: Check vendor risk scores and compromised vendor activity in Abnormal Security VendorBase
argument-hint: "[vendor] [risk-level] [compromised-only] [limit]"
arguments: [vendor, risk-level, compromised-only, limit]
---

# Vendor Risk Check

Check vendor risk scores, compromised vendor indicators, and supply chain email threats using Abnormal Security's VendorBase.

## Prerequisites

- Valid Abnormal Security API token configured (ABNORMAL_API_TOKEN)
- API token must have VendorBase / vendor risk read permissions

## Steps

1. **Build vendor query**
   - If a specific vendor domain is provided, fetch its details
   - Otherwise, list vendors filtered by risk level

2. **Fetch vendor data**
   ```http
   GET /v1/vendors?filter=...
   Authorization: Bearer <token>
   ```
   or for a specific vendor:
   ```http
   GET /v1/vendors/<vendorDomain>
   Authorization: Bearer <token>
   ```

3. **Format risk report**
   - Display risk score, level, and contributing factors
   - Highlight compromise indicators if present
   - Include recommended actions

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| vendor | string | No | - | Specific vendor domain to check |
| risk-level | string | No | - | critical/high/medium/low |
| compromised-only | boolean | No | false | Only show compromised vendors |
| limit | int | No | 25 | Max results (1-100) |

## Examples

### Check a Specific Vendor

```
/vendor-risk --vendor "example-vendor.com"
```

### List All High-Risk Vendors

```
/vendor-risk --risk-level high
```

### List Critical and Compromised Vendors

```
/vendor-risk --risk-level critical --compromised-only
```

### Overview of All Vendor Risk

```
/vendor-risk --limit 50
```

## Output

### Specific Vendor Report

```
Vendor Risk Report: example-vendor.com
========================================

Vendor:          Example Vendor Inc.
Domain:          example-vendor.com
Risk Score:      78/100
Risk Level:      HIGH
Compromised:     YES (detected 2026-03-25)

Risk Factors:
- Authentication failures: SPF failing on recent emails
- Sending pattern change: New mail server IPs detected
- Content anomaly: Payment redirect request detected
- Behavioral anomaly: Unusual recipient targeting

Compromise Indicators:
- Emails sent from IP 185.234.xxx.xxx (not in vendor's SPF record)
- Auto-forwarding rule detected on vendor mailbox
- Payment detail change request sent to 3 of your users

Affected Users:
- finance@company.com (received payment redirect email)
- ap@company.com (received payment redirect email)
- cfo@company.com (received payment redirect email)

Vendor Communication Profile:
- First seen: 2025-06-15
- Total messages: 342
- Typical senders: sales@example-vendor.com, billing@example-vendor.com
- Primary contacts: procurement@company.com, finance@company.com
- Communication frequency: Weekly

Recommended Actions:
1. Block emails from example-vendor.com temporarily
2. Contact vendor via phone to confirm compromise
3. Quarantine recent emails from vendor: /search-threats --sender "example-vendor.com"
4. Notify affected users not to act on recent vendor emails
5. Verify any recent payment changes via side channel
```

### Vendor Risk Overview

```
Vendor Risk Overview
====================

Found 4 high-risk vendors

+-----------------------+-------+----------+-------------+-------------------+
| Vendor Domain         | Score | Level    | Compromised | Last Email        |
+-----------------------+-------+----------+-------------+-------------------+
| example-vendor.com    | 78    | High     | YES         | 2026-03-27 08:42  |
| supplier-co.com       | 72    | High     | No          | 2026-03-26 14:15  |
| partner-services.net  | 71    | High     | No          | 2026-03-25 09:30  |
| old-vendor.com        | 70    | High     | No          | 2026-03-20 16:45  |
+-----------------------+-------+----------+-------------+-------------------+

Summary:
- Compromised: 1 | High Risk: 3 | Monitoring: 4

Quick Actions:
- Check vendor details: /vendor-risk --vendor "example-vendor.com"
- Search vendor threats: /search-threats --sender "example-vendor.com"
```

## Error Handling

### Vendor Not Found

```
Vendor not found: unknown-vendor.com

This vendor domain is not in your VendorBase. Possible reasons:
- No emails received from this domain
- Domain is too new to have a risk profile

Use /search-threats --sender "unknown-vendor.com" to check for threats from this domain.
```

### No High-Risk Vendors

```
No vendors found at the specified risk level.

Your vendor risk posture looks healthy!

Suggestions:
- Check all vendors with: /vendor-risk --limit 50
- Review specific vendor: /vendor-risk --vendor "vendor-domain.com"
```

## Related Commands

- `/threat-triage` - Triage recent threats
- `/search-threats` - Search threats by sender
- `/account-audit` - Audit for account takeover
- `/case-review` - Review abuse mailbox cases
